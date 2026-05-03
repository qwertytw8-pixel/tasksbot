"""NLP parser: Russian text → one or more tasks.

Supports:
- Dates: «сегодня», «завтра», «послезавтра», «в понедельник», «25 мая», «25.05.2025»
- Time: «в 15:00», «в 3 часа», «с 9 до 13»
- Priority: «!», «важно», «важность высокая», «приоритет средний»
- Multi-task splitting: periods, semicolons, newlines, «потом», «затем», «и ещё», etc.
- Greeting / filler stripping at the start of input
- Global date context: date mentioned before first split propagates to all chunks
- Category hints via «категория ...» / «проект ...»
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta


@dataclass
class ParsedTask:
    title: str
    due_date: date | None = None
    has_time: bool = False
    due_at: datetime | None = None
    priority: int = 0
    description: str | None = None
    category_name: str | None = None


# ── weekday map ──────────────────────────────────────────────────────────
_WEEKDAYS = {
    "понедельник": 0,
    "вторник": 1,
    "среду": 2,
    "среда": 2,
    "четверг": 3,
    "пятницу": 4,
    "пятница": 4,
    "субботу": 5,
    "суббота": 5,
    "воскресенье": 6,
    "воскресение": 6,
}

_MONTHS = {
    "января": 1,
    "февраля": 2,
    "марта": 3,
    "апреля": 4,
    "мая": 5,
    "июня": 6,
    "июля": 7,
    "августа": 8,
    "сентября": 9,
    "октября": 10,
    "ноября": 11,
    "декабря": 12,
    "январь": 1,
    "февраль": 2,
    "март": 3,
    "апрель": 4,
    "май": 5,
    "июнь": 6,
    "июль": 7,
    "август": 8,
    "сентябрь": 9,
    "октябрь": 10,
    "ноябрь": 11,
    "декабрь": 12,
}

_PRIORITY_MAP = {
    "низкий": 1,
    "низкая": 1,
    "низкое": 1,
    "низк": 1,
    "средний": 2,
    "средняя": 2,
    "среднее": 2,
    "средн": 2,
    "высокий": 3,
    "высокая": 3,
    "высокое": 3,
    "высок": 3,
}

# ── regex patterns ───────────────────────────────────────────────────────
_RE_TIME_RANGE = re.compile(
    r"\bс\s+(\d{1,2})(?::(\d{2}))?\s+до\s+(\d{1,2})(?::(\d{2}))?\b",
    re.IGNORECASE,
)

_RE_TIME = re.compile(
    r"\bв\s+(\d{1,2})(?::(\d{2}))?\s*(?:час(?:а|ов|ов)?)?",
    re.IGNORECASE,
)

_RE_DATE_DOT = re.compile(r"\b(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\b")

_RE_DATE_NAMED = re.compile(
    r"\b(\d{1,2})\s+(" + "|".join(_MONTHS) + r")\b",
    re.IGNORECASE,
)

_RE_WEEKDAY = re.compile(
    r"\bв\s+(" + "|".join(_WEEKDAYS) + r")\b",
    re.IGNORECASE,
)

_RE_PRIORITY_WORD = re.compile(
    r"\b(?:важность|приоритет|степень\s+важности)\s+("
    + "|".join(_PRIORITY_MAP)
    + r")\b",
    re.IGNORECASE,
)

_RE_IMPORTANT = re.compile(r"\bважно\b|!", re.IGNORECASE)

# Splitting pattern for multi-task voice
_RE_SPLIT = re.compile(
    r"(?:\.\s+)|(?:;\s*)|(?:\n)|"
    r"(?:\b(?:потом|затем|далее|также|и\s+ещ[её]|"
    r"следующ(?:ая|ее|ий)|"
    r"а\s+ещ[её]|плюс|кроме\s+того|"
    r"ну\s+и|и\s+потом)\b[,.]?\s*)",
    re.IGNORECASE,
)

# Greetings and filler at the start of the text
_RE_GREETINGS = [
    re.compile(
        r"^\s*(?:привет|здравствуй\w*|добр(?:ый|ое|ого)\s+(?:день|вечер|утро)|"
        r"здорово|хай|хэлло|hello|hi)\s*[,!.]?\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"^\s*(?:слушай|смотри|короче|значит|ну\s+вот|вот|ладно|окей|ок|давай)\s*[,.]?\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"^\s*(?:у\s+меня\s+(?:(?:сегодня|завтра)\s+)?(?:такие\s+)?(?:задач[иа]|дела|планы))\s*[,:.]?\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"^\s*(?:вот\s+мои\s+(?:задач[иа]|дела|планы))\s*[,:.]?\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"^\s*(?:запиши|добавь|создай)(?:\s+(?:задач[уи]|мне))?\s*[,:.]?\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"^\s*(?:мне\s+(?:нужно|надо|необходимо))\s*[,:.]?\s*",
        re.IGNORECASE,
    ),
    re.compile(
        r"^\s*(?:напомни(?:\s+мне)?)\s*[,:.]?\s*",
        re.IGNORECASE,
    ),
]

# Category detection: «категория Работа», «проект Учёба»
_RE_CATEGORY = re.compile(
    r"\b(?:категория|проект|тег)\s+([А-Яа-яЁёA-Za-z0-9_\- ]{1,30})\b",
    re.IGNORECASE,
)


def _next_weekday(today: date, target_weekday: int) -> date:
    days_ahead = target_weekday - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


def _strip_greetings(text: str) -> str:
    """Remove greetings, fillers and intro phrases from the beginning of text."""
    changed = True
    while changed:
        changed = False
        for pattern in _RE_GREETINGS:
            new_text = pattern.sub("", text, count=1)
            if new_text != text:
                text = new_text
                changed = True
    return text.strip()


def _extract_date(text: str, today: date) -> tuple[date | None, str]:
    lower = text.lower()

    if "послезавтра" in lower:
        return today + timedelta(days=2), re.sub(r"послезавтра", "", text, flags=re.IGNORECASE)

    if "завтра" in lower:
        return today + timedelta(days=1), re.sub(r"завтра", "", text, flags=re.IGNORECASE)

    if "сегодня" in lower:
        return today, re.sub(r"сегодня", "", text, flags=re.IGNORECASE)

    m = _RE_WEEKDAY.search(text)
    if m:
        wd = _WEEKDAYS.get(m.group(1).lower())
        if wd is not None:
            return _next_weekday(today, wd), text[: m.start()] + text[m.end() :]

    m = _RE_DATE_DOT.search(text)
    if m:
        day, month = int(m.group(1)), int(m.group(2))
        year = int(m.group(3)) if m.group(3) else today.year
        if year < 100:
            year += 2000
        try:
            return date(year, month, day), text[: m.start()] + text[m.end() :]
        except ValueError:
            pass

    m = _RE_DATE_NAMED.search(text)
    if m:
        day = int(m.group(1))
        month = _MONTHS.get(m.group(2).lower())
        if month:
            year = today.year
            candidate = date(year, month, day)
            if candidate < today:
                candidate = date(year + 1, month, day)
            return candidate, text[: m.start()] + text[m.end() :]

    return None, text


def _extract_time(text: str) -> tuple[time | None, str | None, str]:
    """Returns (start_time, end_description, cleaned_text)."""
    m = _RE_TIME_RANGE.search(text)
    if m:
        h_start = int(m.group(1))
        m_start = int(m.group(2)) if m.group(2) else 0
        h_end = int(m.group(3))
        m_end = int(m.group(4)) if m.group(4) else 0
        cleaned = text[: m.start()] + text[m.end() :]
        end_str = f"{h_end:02d}:{m_end:02d}"
        if 0 <= h_start <= 23 and 0 <= m_start <= 59:
            return time(h_start, m_start), f"до {end_str}", cleaned
        return None, None, text

    m = _RE_TIME.search(text)
    if m:
        h = int(m.group(1))
        mins = int(m.group(2)) if m.group(2) else 0
        cleaned = text[: m.start()] + text[m.end() :]
        if 0 <= h <= 23 and 0 <= mins <= 59:
            return time(h, mins), None, cleaned
        return None, None, text

    return None, None, text


def _extract_priority(text: str) -> tuple[int, str]:
    m = _RE_PRIORITY_WORD.search(text)
    if m:
        level = _PRIORITY_MAP.get(m.group(1).lower(), 0)
        cleaned = text[: m.start()] + text[m.end() :]
        return level, cleaned

    if _RE_IMPORTANT.search(text):
        cleaned = _RE_IMPORTANT.sub("", text)
        return 3, cleaned

    return 0, text


def _extract_category(text: str) -> tuple[str | None, str]:
    m = _RE_CATEGORY.search(text)
    if m:
        cat_name = m.group(1).strip().rstrip(".,;:!?")
        cleaned = text[: m.start()] + text[m.end() :]
        if cat_name:
            return cat_name, cleaned
    return None, text


def _clean_title(title: str) -> str:
    title = re.sub(r"\s+", " ", title).strip()
    title = title.strip(".,;:!?- ")
    if title:
        title = title[0].upper() + title[1:]
    return title


def parse_tasks(text: str, today: date | None = None) -> list[ParsedTask]:
    """Parse raw Russian text into a list of ``ParsedTask`` objects.

    Improvements over basic parsing:
    - Strips greetings/fillers from the beginning
    - Extracts a "global" date from text before splitting (propagates to all chunks)
    - Extracts a "global" priority if set before first split
    - Detects category hints via «категория ...» / «проект ...»
    """
    if today is None:
        today = date.today()

    # Strip greetings and filler phrases
    text = _strip_greetings(text)
    if not text:
        return []

    # Try to extract a global date from the full text before splitting.
    # This handles cases like: "завтра купить молоко, позвонить маме, написать отчёт"
    # where "завтра" applies to all tasks.
    global_date, text_after_global_date = _extract_date(text, today)
    # Also try to extract a global priority from the full text before splitting.
    global_priority, text_after_global_priority = _extract_priority(
        text_after_global_date
    )
    # Also try to extract a global category
    global_category, text_after_global_category = _extract_category(
        text_after_global_priority
    )

    # Split into chunks
    chunks = _RE_SPLIT.split(text_after_global_category)
    chunks = [c.strip() for c in chunks if c and c.strip()]

    if not chunks:
        # If stripping removed everything but we had a global date, skip
        return []

    # Also try splitting by commas when we have 2+ items separated by commas
    # but only if the initial split produced a single chunk with commas in it.
    if len(chunks) == 1 and "," in chunks[0]:
        comma_parts = [p.strip() for p in chunks[0].split(",") if p.strip()]
        # Heuristic: if each comma-separated part is short (< ~60 chars),
        # treat them as separate tasks.
        if len(comma_parts) >= 2 and all(len(p) < 60 for p in comma_parts):
            chunks = comma_parts

    results: list[ParsedTask] = []
    for chunk in chunks:
        due_date, chunk = _extract_date(chunk, today)
        t, end_desc, chunk = _extract_time(chunk)
        priority, chunk = _extract_priority(chunk)
        category, chunk = _extract_category(chunk)

        title = _clean_title(chunk)
        if not title or len(title) < 2:
            continue

        # Apply global context if chunk didn't have its own
        if due_date is None:
            due_date = global_date
        if priority == 0 and global_priority > 0:
            priority = global_priority
        if category is None:
            category = global_category

        has_time = t is not None
        due_at: datetime | None = None
        if has_time and t is not None:
            if due_date is None:
                due_date = today
            due_at = datetime.combine(due_date, t)
        description = end_desc

        results.append(
            ParsedTask(
                title=title,
                due_date=due_date,
                has_time=has_time,
                due_at=due_at,
                priority=priority,
                description=description,
                category_name=category,
            )
        )
    return results
