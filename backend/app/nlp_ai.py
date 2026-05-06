"""AI-powered task parser using Groq LLM with fallback to regex-based parser."""

from __future__ import annotations

import contextlib
import json
import logging
import re
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import httpx

from app.nlp import ParsedTask, parse_ru, split_into_tasks

log = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """\
Ты — парсер задач из текста на русском языке. Пользователь пишет или диктует \
голосом свои задачи в свободной форме. Твоя задача — разбить текст на отдельные \
задачи и извлечь структурированные данные.

Для каждой задачи извлеки:
- title: краткое название задачи (2-5 слов, без приветствий, филлеров, вводных слов, \
без дат, времени и приоритетов в названии)
- date: "сегодня", "завтра", "послезавтра", день недели (в именительном падеже: \
"понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"), \
или null
- time: время в формате "HH:MM" или null
- priority: "low", "medium", "high" или null
- reminder: ТОЛЬКО если пользователь ЯВНО просит напомнить (слова "напомни", \
"напоминание", "remind"). Число минут до события. Если пользователь НЕ просил \
напоминание — ОБЯЗАТЕЛЬНО null. НЕ додумывай напоминание сам!
- category: категория/тег из хештега (#работа → "работа") или null

Правила разбивки на задачи:
- Каждое ОТДЕЛЬНОЕ действие = ОТДЕЛЬНАЯ задача в массиве
- Разделяй по: запятым, точкам, союзам ("также", "и ещё", "потом", "затем", "плюс")
- ЗАПЯТАЯ МЕЖДУ ДЕЙСТВИЯМИ = разные задачи
- "и" между ОДНОРОДНЫМИ предметами = одна задача ("купить хлеб и молоко")
- "и" между РАЗНЫМИ действиями = разные задачи ("позвонить и купить")
- Фразы "поставить N задач", "добавить задачи", "записать", "нужно сделать" — \
  это ВВОДНЫЕ инструкции, НЕ включаются в title задач

Правила приоритета:
- "важно"/"срочно" = high, "обычный" = medium, "не срочно" = low
- ГЛОБАЛЬНЫЕ модификаторы: если сказано "у всех задач приоритет высокий" или \
  "все важные" или "всё срочно" или "всем high" — применяй этот приоритет КО ВСЕМ задачам
- Если приоритет указан для конкретной задачи — используй его только для неё

Правила дат и времени:
- Каждая задача имеет СВОЮ дату и время, указанные рядом с ней
- Если дата указана один раз в начале и подразумевается для всех — применяй ко всем
- Время "вечером" = "19:00", "утром" = "09:00", "днём" = "13:00", "ночью" = "23:00"
- Если время не указано — ОБЯЗАТЕЛЬНО ставь time: null

Очистка текста:
- Убирай приветствия ("привет", "слушай", "смотри", "значит" и т.д.)
- Убирай вводные фразы ("мне нужно", "мне надо", "хочу", "нужно будет", \
  "поставь задачу", "добавь задачу", "запиши", "нужно поставить" и т.д.)
- НЕ включай в title даты, время, приоритеты или слова о напоминаниях
- Title должен быть ёмким: 2-5 слов, отражающих суть действия

Критически ВАЖНО:
- Ответь ТОЛЬКО валидным JSON массивом, без markdown-разметки, без ```json```, \
без пояснений, без лишних символов
- Каждый элемент массива — объект с полями: title, date, time, priority, reminder, category
- Не добавляй поля, которых нет в спецификации
- Если текст пустой или не содержит задач — верни пустой массив []

Пример 1 (разделение по запятым с датами и глобальным приоритетом):
Ввод: "позвонить другу сегодня в 13:00, купить продукты завтра \
в 14:00, спортзал послезавтра в 19:00. У всех приоритет высокий"
Вывод:
[
  {"title": "Позвонить другу", "date": "сегодня", "time": "13:00",
   "priority": "high", "reminder": null, "category": null},
  {"title": "Купить продукты", "date": "завтра", "time": "14:00",
   "priority": "high", "reminder": null, "category": null},
  {"title": "Спортзал", "date": "послезавтра", "time": "19:00",
   "priority": "high", "reminder": null, "category": null}
]

Пример 2 (разделение по запятым без дат):
Ввод: "купить продукты, позвонить врачу, стоматолог на пятницу"
Вывод:
[
  {"title": "Купить продукты", "date": null, "time": null,
   "priority": null, "reminder": null, "category": null},
  {"title": "Позвонить врачу", "date": null, "time": null,
   "priority": null, "reminder": null, "category": null},
  {"title": "Стоматолог", "date": "пятница", "time": null,
   "priority": null, "reminder": null, "category": null}
]

Пример 3 (без разделения — список покупок):
Ввод: "купить хлеб и молоко"
Вывод:
[
  {"title": "Купить хлеб и молоко", "date": null, "time": null,
   "priority": null, "reminder": null, "category": null}
]

Пример 4 (голосовое без времени, глобальный приоритет):
Ввод: "попить воду сегодня, включить мышку завтра. \
У всех приоритет высокий"
Вывод:
[
  {"title": "Попить воду", "date": "сегодня", "time": null,
   "priority": "high", "reminder": null, "category": null},
  {"title": "Включить мышку", "date": "завтра", "time": null,
   "priority": "high", "reminder": null, "category": null}
]\
"""


async def parse_tasks_ai(
    text: str,
    groq_api_key: str,
    tz_name: str = "UTC",
    now: datetime | None = None,
) -> list[ParsedTask] | None:
    """Parse tasks using Groq LLM. Returns None on failure (caller falls back to regex)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 2048,
                },
            )
            if resp.status_code != 200:
                log.warning("Groq API error %d: %s", resp.status_code, resp.text[:200])
                return None

            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()

            # Strip markdown fences if present
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\s*", "", content)
                content = re.sub(r"\s*```$", "", content)

            tasks_raw = json.loads(content)
            if not isinstance(tasks_raw, list) or not tasks_raw:
                return None

            tz = ZoneInfo(tz_name or "UTC")
            local_now = (now or datetime.now(tz)).astimezone(tz)
            today = local_now.date()

            results: list[ParsedTask] = []
            for t in tasks_raw:
                title = t.get("title", "").strip()
                if not title:
                    continue

                due_date = _resolve_date(t.get("date"), today)
                due_time = _resolve_time(t.get("time"))
                priority = _resolve_priority(t.get("priority"))
                reminder = t.get("reminder")
                category = t.get("category")

                has_time = due_time is not None
                due_at: datetime | None = None
                if has_time and due_date is not None:
                    local_dt = datetime.combine(due_date, due_time, tzinfo=tz)
                    due_at = local_dt.astimezone(UTC)
                elif has_time and due_date is None:
                    # Time without date → assume today
                    due_date = today
                    local_dt = datetime.combine(today, due_time, tzinfo=tz)
                    due_at = local_dt.astimezone(UTC)

                remind_min: int | None = None
                if reminder is not None:
                    with contextlib.suppress(ValueError, TypeError):
                        remind_min = int(reminder)

                results.append(ParsedTask(
                    title=title[:255],
                    due_date=due_date,
                    has_time=has_time,
                    due_at=due_at,
                    remind_minutes_before=remind_min if has_time else None,
                    category_name=category,
                    priority=priority,
                ))

            return results if results else None

    except Exception:
        log.exception("AI task parsing failed")
        return None


def _resolve_date(raw: str | None, today: date) -> date | None:
    if not raw or raw == "null":
        return None
    raw = raw.lower().strip()
    if raw == "сегодня":
        return today
    if raw == "завтра":
        return today + timedelta(days=1)
    if raw == "послезавтра":
        return today + timedelta(days=2)

    weekdays = {
        "понедельник": 0, "вторник": 1, "среда": 2, "среду": 2,
        "четверг": 3, "пятница": 4, "пятницу": 4,
        "суббота": 5, "субботу": 5, "воскресенье": 6,
    }
    for name, wd in weekdays.items():
        if name in raw:
            diff = (wd - today.weekday()) % 7
            if diff == 0:
                diff = 7
            return today + timedelta(days=diff)

    # Try DD.MM or DD.MM.YYYY
    m = re.match(r"(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?", raw)
    if m:
        day = int(m.group(1))
        month = int(m.group(2))
        year = int(m.group(3)) if m.group(3) else today.year
        if year < 100:
            year += 2000
        try:
            return date(year, month, day)
        except ValueError:
            pass

    return None


def _resolve_time(raw: str | None) -> time | None:
    if not raw or raw == "null":
        return None
    m = re.match(r"(\d{1,2}):(\d{2})", raw.strip())
    if m:
        h, mi = int(m.group(1)), int(m.group(2))
        if 0 <= h <= 23 and 0 <= mi <= 59:
            return time(h, mi)
    return None


def _resolve_priority(raw: str | None) -> int:
    if not raw or raw == "null":
        return 0
    raw = raw.lower().strip()
    if raw == "high":
        return 3
    if raw == "medium":
        return 2
    if raw == "low":
        return 1
    return 0


async def smart_parse_tasks(
    text: str,
    groq_api_key: str | None,
    tz_name: str = "UTC",
    now: datetime | None = None,
) -> list[ParsedTask]:
    """Parse tasks using AI (Groq) with automatic fallback to regex parser."""
    # Try AI parser first
    if groq_api_key:
        ai_results = await parse_tasks_ai(text, groq_api_key, tz_name, now)
        if ai_results:
            return ai_results

    # Fallback to regex parser
    chunks = split_into_tasks(text)
    if not chunks:
        chunks = [text]
    return [parse_ru(chunk, tz_name, now) for chunk in chunks]