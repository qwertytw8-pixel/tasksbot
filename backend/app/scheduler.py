"""Reminder ticker: scans `reminders` table once per minute and sends Telegram messages."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, update

from app.db import Reminder, Task, get_sessionmaker

log = logging.getLogger(__name__)


def _format_in_minutes(due_at: datetime, now: datetime) -> str:
    diff = (due_at - now).total_seconds() / 60
    if diff <= 0:
        return "сейчас"
    if diff < 60:
        return f"через {int(round(diff))} мин"
    hours = diff / 60
    if hours < 24:
        return f"через {int(round(hours))} ч"
    return due_at.strftime("%d.%m %H:%M")


async def _tick(bot: Bot) -> None:
    sm = get_sessionmaker()
    now = datetime.now(UTC)
    async with sm() as session:
        rows = await session.execute(
            select(Reminder, Task)
            .join(Task, Task.id == Reminder.task_id)
            .where(Reminder.sent.is_(False), Reminder.fire_at <= now)
            .limit(50)
        )
        items = list(rows.all())
        if not items:
            return

        for reminder, task in items:
            try:
                when = (
                    _format_in_minutes(task.due_at, now)
                    if task.due_at
                    else ""
                )
                text_when = f"\n🕒 {when}" if when else ""
                await bot.send_message(
                    chat_id=task.user_id,
                    text=(
                        f"⏰ <b>Напоминание</b>\n\n"
                        f"<b>{task.title}</b>{text_when}"
                    ),
                )
            except Exception:
                log.exception("failed to send reminder %s", reminder.id)
                continue
            await session.execute(
                update(Reminder).where(Reminder.id == reminder.id).values(sent=True)
            )
        await session.commit()


def start_scheduler(bot: Bot) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(_tick, "interval", seconds=60, args=(bot,), max_instances=1, coalesce=True)
    scheduler.start()
    log.info("reminder scheduler started")
    return scheduler
