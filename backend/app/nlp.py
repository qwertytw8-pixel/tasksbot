"""Russian natural-language task parser.

Given a free-form phrase in Russian (e.g. "купить молоко завтра в 19:00
напомни за 10 мин #дом"), extract a task title, date, time, reminder
lead-time and category tag.

The parser is heuristic and does its best. If nothing matches, it returns
the original text as the title with no date/time.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Category, Task, User

DEFAULT_REMIND_IF_TIME = 15
MAX_REMIND_MIN = 10_080  # 7 days

# --------------- greeting / filler filter --------------------------------

_GREETING_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\b(?:привет|здравствуй\w*|добрый\s+(?:день|вечер|утро)|"
        r"здорово|хай|хэлло|hello|hi)\b[,!.\s]*",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:слушай|смотри|короче|значит|ну\s+вот|вот|"
        r"ладно|окей|ок|давай)\b[,.\s]*",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:у\s+меня|мне\s+(?:нужно|надо|необходимо)|"
        r"(?:вот\s+)?(?:мои|такие|следующие)\s+(?:задач\w*|план\w*|дел\w*))\b[,.:!\s]*",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:(?:на\s+)?сегодня\s+(?:(?:вот\s+)?такие\s+)?(?:задач\w*|план\w*|дел\w*))\b[,.:!\s]*",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:запиши|записать|добавь|создай|поставь)\s*(?:мне\s+)?(?:задач\w*|пожалуйста)?\b[,.:!\s]*",
        re.IGNORECASE,
    ),
]

_FILLER_ONLY = re.compile(
    r"^[\s,.:;!?\-—]*"
    r"(?:привет\w*|здравствуй\w*|добрый\s+(?:день|вечер|утро)|"
    r"смотри|слушай|короче|значит|ну|вот|ладно|окей|ок|давай|"
    r"у\s+меня|мне\s+нужно|мне\s+надо|"
    r"(?:вот\s+)?(?:мои|такие|следующие)\s+(?:задач\w*|план\w*|дел\w*)|"
    r"(?:на\s+)?сегодня\s+(?:(?:вот\s+)?такие\s+)?(?:задач\w*|план\w*|дел\w*)|"
    r"(?:запиши|записать|добавь|создай|поставь)\s*(?:мне\s+)?(?:задач\w*|пожалуйста)?)"
    r"[\s,.:;!?\-—]*$",
    re.IGNORECASE,
)

# --------------- multi-task splitter -------------------------------------

_RE_MULTI_SPLIT = re.compile(
    r"(?:\.\s+)|(?:;\s*)|"
    r"(?:\b(?:потом|затем|далее|ещ[её]|также|и\s+ещ[её]|следующ(?:ая|ее|ий))\b[,.]?\s*)",
    re.IGNORECASE,
)

# --------------- voice priority / time range -----------------------------

_RE_PRIORITY_VOICE = re.compile(
    r"\b(?:важность|приоритет|степень\s+важности)\s+"
    r"(низк\w+|средн\w+|высок\w+)\b",
    re.IGNORECASE,
)

_RE_TIME_RANGE = re.compile(
    r"\bс\s+(\d{1,2})(?::(\d{2}))?\s+до\s+(\d{1,2})(?::(\d{2}))?\b",
    re.IGNORECASE,
)


def _strip_greetings(text: str) -> str:
    """Remove greetings and filler from the beginning of text."""
    result = text
    for pat in _GREETING_PATTERNS:
        result = pat.sub(" ", result, count=1)
    return re.sub(r"\s+", " ", result).strip()


def _is_filler_only(chunk: str) -> bool:
    """Return True if the chunk is purely a greeting/filler with no real task."""
    return bool(_FILLER_ONLY.match(chunk.strip()))


def _extract_voice_priority(text: str) -> tuple[int, str]:
    """Extract priority from voice phrases like 'важность средняя'."""
    m = _RE_PRIORITY_VOICE.search(text)
    if m:
        word = m.group(1).lower()
        for prefix, val in [("низк", 1), ("средн", 2), ("высок", 3)]:
            if word.startswith(prefix):
                cleaned = text[: m.start()] + text[m.end() :]
                return val, re.sub(r"\s+", " ", cleaned).strip()
    return 0, text


def _extract_time_range(text: str) -> tuple[time | None, str | None, str]:
    """Extract 'с 9 до 13'. Returns (start_time, end_desc, cleaned_text)."""
    m = _RE_TIME_RANGE.search(text)
    if m:
        h_start = int(m.group(1))
        m_start = int(m.group(2)) if m.group(2) else 0
        h_end = int(m.group(3))
        m_end = int(m.group(4)) if m.group(4) else 0
        cleaned = text[: m.start()] + text[m.end() :]
        end_str = f"{h_end:02d}:{m_end:02d}"
        if 0 <= h_start <= 23 and 0 <= m_start <= 59:
            return time(h_start, m_start), f"до {end_str}", cleaned.strip()
    return None, None, text


def split_into_tasks(text: str) -> list[str]:
    """Split text into multiple task chunks, filtering out greetings/filler."""
    text = _strip_greetings(text)
    if not text:
        return []

    chunks = _RE_MULTI_SPLIT.split(text)
    result = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        if _is_filler_only(chunk):
            continue
        result.append(chunk)
    return result


@dataclass
class ParsedTask:
    title: str
    due_date: date | None = None
    has_time: bool = False
    due_at: datetime | None = None  # always UTC
    remind_minutes_before: int | None = None
    category_name: str | None = None
    priority: int = 0
    description: str | None = None


# --- lookup tables ------------------------------------------------------

DAY_OFFSETS: list[tuple[str, int]] = [
    ("послезавтра", 2),
    ("завтра", 1),
    ("сегодня", 0),
    ("сейчас", 0),
]

WEEKDAYS: dict[str, int] = {
    "понедельник": 0, "понед": 0, "пон": 0, "пн": 0,
    "вторник": 1, "втор": 1, "вт": 1,
    "среду": 2, "среда": 2, "сред": 2, "ср": 2,
    "четверг": 3, "четв": 3, "чт": 3,
    "пятницу": 4, "пятница": 4, "пятн": 4, "пт": 4,
    "субботу": 5, "суббота": 5, "субб": 5, "сб": 5,
    "воскресенье": 6, "воскр": 6, "вс": 6,
}

MONTHS_LONG: list[tuple[str, int]] = [
    ("январ", 1), ("феврал", 2), ("март", 3), ("апрел", 4),
    ("мая", 5), ("май", 5), ("июн", 6), ("июл", 7),
    ("август", 8), ("сентябр", 9), ("октябр", 10),
    ("ноябр", 11), ("декабр", 12),
]

MONTHS_SHORT: dict[str, int] = {
    "янв": 1, "фев": 2, "мар": 3, "апр": 4, "май": 5,
    "июн": 6, "июл": 7, "авг": 8, "сен": 9, "окт": 10,
    "ноя": 11, "дек": 12,
}


# --- helpers ------------------------------------------------------------

def _strip(text: str, start: int, end: int) -> str:
    return text[:start] + " " + text[end:]


def _collapse_spaces(text: str) -> str:
    # Also strip stray punctuation that was surrounded by removed tokens.
    out = re.sub(r"\s+", " ", text).strip()
    out = re.sub(r"^[,\s—\-]+", "", out)
    out = re.sub(r"[,\s—\-]+$", "", out)
    return out


def _next_weekday(today: date, target: int, force_next: bool = False) -> date:
    diff = (target - today.weekday()) % 7
    if diff == 0 and force_next:
        diff = 7
    return today + timedelta(days=diff)


# --- main parser --------------------------------------------------------

def parse_ru(
    text: str,
    tz_name: str = "UTC",
    now: datetime | None = None,
) -> ParsedTask:
    """Parse a Russian free-form task phrase.

    `tz_name` is the user's IANA timezone (stored on the User record).
    `now` is only used in tests; production code should pass None.
    """
    if not text or not text.strip():
        return ParsedTask(title="")

    text = _strip_greetings(text)
    if not text:
        return ParsedTask(title="")

    priority, text = _extract_voice_priority(text)
    range_time, range_desc, text = _extract_time_range(text)

    tz = ZoneInfo(tz_name or "UTC")
    local_now = (now or datetime.now(tz)).astimezone(tz)
    today = local_now.date()

    result = ParsedTask(title=text.strip(), priority=priority, description=range_desc)
    working = " " + text.strip() + " "

    # 1) hashtag category
    tag_m = re.search(
        r"#([A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё0-9_\-]{0,63})",
        working,
    )
    if tag_m:
        result.category_name = tag_m.group(1).strip()
        working = _strip(working, tag_m.start(), tag_m.end())

    # 2) reminder lead time: "напомни за N [unit]"
    rem_m = re.search(
        r"\bнапомн(?:и(?:ть)?)?\s+за\s+(\d{1,4})\s*(минут\w*|мин\w*|часов?|час\w*|"
        r"дней|дн\w*|день|недел\w*|нед)?\b",
        working,
        re.IGNORECASE,
    )
    if rem_m:
        n = int(rem_m.group(1))
        unit = (rem_m.group(2) or "мин").lower()
        mins = n
        if unit.startswith("час"):
            mins = n * 60
        elif unit.startswith("дн") or unit.startswith("ден") or unit.startswith("день"):
            mins = n * 24 * 60
        elif unit.startswith("нед"):
            mins = n * 7 * 24 * 60
        result.remind_minutes_before = min(mins, MAX_REMIND_MIN)
        working = _strip(working, rem_m.start(), rem_m.end())

    # 3) absolute time
    extracted = _extract_time(working)
    if extracted is not None:
        working = extracted["working"]
        t = time(extracted["h"], extracted["m"])
    elif range_time is not None:
        t = range_time
    else:
        t = None

    # 4) absolute/relative date
    parsed_date: date | None = None
    local_dt: datetime | None = None

    # "через N мин/час/дн/нед" (or "через минуту/час/день" w/o number)
    through_m = re.search(
        r"\bчерез\s+(?:(\d{1,4})\s*)?"
        r"(минут\w*|мин\w*|часов?|час\w*|дн\w*|"
        r"день|дней|недел\w*|нед)\b",
        working,
        re.IGNORECASE,
    )
    if through_m:
        n = int(through_m.group(1)) if through_m.group(1) else 1
        unit = through_m.group(2).lower()
        if unit.startswith("мин"):
            local_dt = local_now + timedelta(minutes=n)
        elif unit.startswith("час"):
            local_dt = local_now + timedelta(hours=n)
        elif unit.startswith("дн") or unit.startswith("ден") or unit.startswith("день"):
            parsed_date = today + timedelta(days=n)
        elif unit.startswith("нед"):
            parsed_date = today + timedelta(days=n * 7)
        working = _strip(working, through_m.start(), through_m.end())

    # сегодня / завтра / послезавтра / сейчас
    if parsed_date is None and local_dt is None:
        for word, offset in DAY_OFFSETS:
            m = re.search(rf"\b{word}\b", working, re.IGNORECASE)
            if m:
                parsed_date = today + timedelta(days=offset)
                working = _strip(working, m.start(), m.end())
                break

    # weekday (optional "в следующ..")
    if parsed_date is None and local_dt is None:
        for key, wd in WEEKDAYS.items():
            m = re.search(
                rf"\b(?:в\s+следующ\w+\s+)?(?:в\s+|во\s+)?{key}\b",
                working,
                re.IGNORECASE,
            )
            if m:
                force_next = bool(re.search(r"следующ", m.group(0), re.IGNORECASE))
                parsed_date = _next_weekday(today, wd, force_next=force_next)
                working = _strip(working, m.start(), m.end())
                break

    # numeric date: DD.MM(.YY|YYYY) or DD/MM
    if parsed_date is None and local_dt is None:
        m = re.search(
            r"\b(\d{1,2})[\./](\d{1,2})(?:[\./](\d{2,4}))?\b",
            working,
        )
        if m:
            day = int(m.group(1))
            mon = int(m.group(2))
            yraw = m.group(3)
            if yraw:
                year = int(yraw)
                if year < 100:
                    year += 2000
            else:
                year = today.year
                # If date already passed this year, bump to next year.
                try:
                    candidate = date(year, mon, day)
                    if candidate < today:
                        year += 1
                except ValueError:
                    year = today.year
            try:
                parsed_date = date(year, mon, day)
                working = _strip(working, m.start(), m.end())
            except ValueError:
                pass

    # textual month: "15 декабря", "15 дек"
    if parsed_date is None and local_dt is None:
        td = _extract_textual_date(working, today)
        if td is not None:
            parsed_date, working = td

    # 5) combine
    if local_dt is not None:
        # "через N" already gave us absolute local datetime
        result.has_time = True
        result.due_at = local_dt.astimezone(UTC)
        result.due_date = local_dt.date()
    elif parsed_date is not None:
        result.due_date = parsed_date
        if t is not None:
            local_dt = datetime(
                parsed_date.year, parsed_date.month, parsed_date.day,
                t.hour, t.minute, tzinfo=tz,
            )
            result.has_time = True
            result.due_at = local_dt.astimezone(UTC)
    elif t is not None:
        # just a time mentioned, assume today (or tomorrow if time already past)
        local_dt = datetime(today.year, today.month, today.day,
                            t.hour, t.minute, tzinfo=tz)
        if local_dt < local_now:
            local_dt = local_dt + timedelta(days=1)
        result.has_time = True
        result.due_at = local_dt.astimezone(UTC)
        result.due_date = local_dt.date()

    # Default reminder for timed tasks: 15 min before.
    if result.has_time and result.remind_minutes_before is None:
        result.remind_minutes_before = DEFAULT_REMIND_IF_TIME

    # 6) final title = leftover
    title = _collapse_spaces(working)
    # Drop leading "в" if it's the only word left or nothing left
    if not title:
        title = text.strip()
    result.title = title[:255]
    return result


# --- sub-extractors -----------------------------------------------------

def _extract_time(working: str) -> dict | None:
    """Find a time token in the text. Returns the new working buffer and h/m."""
    # Special words
    for word, (h, m) in [("полдень", (12, 0)), ("полночь", (0, 0))]:
        mm = re.search(rf"\b(?:в\s+)?{word}\b", working, re.IGNORECASE)
        if mm:
            return {
                "h": h, "m": m,
                "working": _strip(working, mm.start(), mm.end()),
            }

    # "в HH:MM" / "в HH.MM"
    m = re.search(
        r"\bв\s+(\d{1,2})[:.](\d{2})(?!\d)\b",
        working,
        re.IGNORECASE,
    )
    if m:
        h = int(m.group(1))
        mi = int(m.group(2))
        if 0 <= h < 24 and 0 <= mi < 60:
            return {"h": h, "m": mi, "working": _strip(working, m.start(), m.end())}

    # "в H утра/вечера/дня/ночи [часов]"
    m = re.search(
        r"\bв\s+(\d{1,2})\s*(?:часов?|ч)?\s*(утра|вечера|дня|ночи)\b",
        working,
        re.IGNORECASE,
    )
    if m:
        h = int(m.group(1))
        qual = m.group(2).lower()
        if qual in ("вечера", "дня") and h < 12:
            h += 12
        if qual == "ночи" and h == 12:
            h = 0
        if qual == "утра" and h == 12:
            h = 0
        if 0 <= h < 24:
            return {"h": h, "m": 0, "working": _strip(working, m.start(), m.end())}

    # "в H часов"
    m = re.search(
        r"\bв\s+(\d{1,2})\s*часов?\b",
        working,
        re.IGNORECASE,
    )
    if m:
        h = int(m.group(1))
        if 0 <= h < 24:
            return {"h": h, "m": 0, "working": _strip(working, m.start(), m.end())}

    # bare "в HH" (assume 24h, 0..23)
    m = re.search(
        r"\bв\s+(\d{1,2})\b(?!\s*[:./])",
        working,
        re.IGNORECASE,
    )
    if m:
        h = int(m.group(1))
        if 0 <= h < 24:
            return {"h": h, "m": 0, "working": _strip(working, m.start(), m.end())}

    return None


def _extract_textual_date(
    working: str, today: date
) -> tuple[date, str] | None:
    # "DD <месяц>[года]"
    for mon_prefix, mon_num in MONTHS_LONG:
        pat = re.compile(
            rf"\b(\d{{1,2}})\s+{mon_prefix}\w*(?:\s+(\d{{4}}))?\b",
            re.IGNORECASE,
        )
        m = pat.search(working)
        if m:
            d = int(m.group(1))
            y = int(m.group(2)) if m.group(2) else _year_for(d, mon_num, today)
            try:
                return date(y, mon_num, d), _strip(working, m.start(), m.end())
            except ValueError:
                continue

    for abbrev, mon_num in MONTHS_SHORT.items():
        pat = re.compile(
            rf"\b(\d{{1,2}})\s+{abbrev}\.?\b",
            re.IGNORECASE,
        )
        m = pat.search(working)
        if m:
            d = int(m.group(1))
            y = _year_for(d, mon_num, today)
            try:
                return date(y, mon_num, d), _strip(working, m.start(), m.end())
            except ValueError:
                continue
    return None


def _year_for(day: int, month: int, today: date) -> int:
    try:
        candidate = date(today.year, month, day)
    except ValueError:
        return today.year
    if candidate < today:
        return today.year + 1
    return today.year


# --- human-friendly summary ---------------------------------------------

def format_summary(p: ParsedTask, tz_name: str) -> str:
    parts: list[str] = []
    if p.due_at is not None:
        local = p.due_at.astimezone(ZoneInfo(tz_name or "UTC"))
        today = datetime.now(ZoneInfo(tz_name or "UTC")).date()
        delta = (local.date() - today).days
        if delta == 0:
            day_str = "сегодня"
        elif delta == 1:
            day_str = "завтра"
        elif delta == 2:
            day_str = "послезавтра"
        elif 0 < delta <= 6:
            day_str = local.strftime("%A")
        else:
            day_str = local.strftime("%d.%m")
        parts.append(f"{day_str}, {local.strftime('%H:%M')}")
    elif p.due_date is not None:
        today = date.today()
        delta = (p.due_date - today).days
        if delta == 0:
            parts.append("сегодня")
        elif delta == 1:
            parts.append("завтра")
        elif delta == 2:
            parts.append("послезавтра")
        else:
            parts.append(p.due_date.strftime("%d.%m"))
    if p.remind_minutes_before is not None and p.has_time:
        if p.remind_minutes_before == 0:
            parts.append("напомнить вовремя")
        elif p.remind_minutes_before < 60:
            parts.append(f"напомнить за {p.remind_minutes_before} мин")
        elif p.remind_minutes_before < 24 * 60:
            parts.append(f"напомнить за {p.remind_minutes_before // 60} ч")
        else:
            parts.append(f"напомнить за {p.remind_minutes_before // (24 * 60)} дн")
    if p.category_name:
        parts.append(f"#{p.category_name}")
    if not parts:
        return "без даты"
    return " · ".join(parts)


# --- DB-backed "commit parsed task" -------------------------------------

DEFAULT_NEW_CATEGORY_COLOR = "#7c4dff"
DEFAULT_NEW_CATEGORY_EMOJI = "🏷️"


async def _find_or_create_category(
    session: AsyncSession, user_id: int, name: str
) -> Category:
    """Find a category by case-insensitive name, create one if missing."""
    clean = name.strip()
    stmt = select(Category).where(Category.user_id == user_id)
    existing = (await session.execute(stmt)).scalars().all()
    for cat in existing:
        if cat.name.casefold() == clean.casefold():
            return cat
    cat = Category(
        user_id=user_id,
        name=clean[:64],
        color=DEFAULT_NEW_CATEGORY_COLOR,
        emoji=DEFAULT_NEW_CATEGORY_EMOJI,
    )
    session.add(cat)
    await session.flush()
    return cat


async def commit_parsed(
    session: AsyncSession,
    user: User,
    parsed: ParsedTask,
) -> Task:
    """Create a Task from parsed NL. Caller handles commit + reminder sync."""
    category_id: int | None = None
    if parsed.category_name:
        cat = await _find_or_create_category(session, user.id, parsed.category_name)
        category_id = cat.id

    task = Task(
        user_id=user.id,
        category_id=category_id,
        title=(parsed.title or "Без названия")[:255],
        description=parsed.description,
        parent_task_id=None,
        due_date=parsed.due_date,
        has_time=parsed.has_time,
        due_at=parsed.due_at,
        remind_minutes_before=parsed.remind_minutes_before if parsed.has_time else None,
        priority=parsed.priority,
        is_done=False,
    )
    session.add(task)
    await session.flush()
    return task
