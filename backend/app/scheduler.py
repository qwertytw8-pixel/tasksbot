"""Reminder dispatcher + daily summary.

Triggered externally via `POST /cron/tick` (e.g. from GitHub Actions cron).
Scans `reminders` table for entries that should fire and sends Telegram messages.
Daily summary sends end-of-day notification about incomplete tasks.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from sqlalchemy import func, select, update

from app.db import Reminder, Subscription, Task, User, get_sessionmaker

log = logging.getLogger(__name__)


def _format_in(due_at: datetime, now: datetime) -> str:
    diff = (due_at - now).total_seconds() / 60
    if diff <= 0:
        return "сейчас"
    if diff < 60:
        return f"через {int(round(diff))} мин"
    hours = diff / 60
    if hours < 24:
        return f"через {int(round(hours))} ч"
    return due_at.strftime("%d.%m %H:%M")


async def run_tick(bot: Bot) -> int:
    """Process due reminders. Returns the number of reminders sent."""
    sm = get_sessionmaker()
    now = datetime.now(UTC)
    sent_count = 0
    async with sm() as session:
        rows = await session.execute(
            select(Reminder, Task)
            .join(Task, Task.id == Reminder.task_id)
            .where(
                Reminder.sent.is_(False),
                Reminder.fire_at <= now,
                Task.archived_at.is_(None),
                Task.is_done.is_(False),
            )
            .limit(50)
        )
        items = list(rows.all())
        if not items:
            return 0

        for reminder, task in items:
            try:
                when = _format_in(task.due_at, now) if task.due_at else ""
                text_when = f"\n🕒 {when}" if when else ""
                await bot.send_message(
                    chat_id=task.user_id,
                    text=f"⏰ <b>Напоминание</b>\n\n<b>{task.title}</b>{text_when}",
                )
                sent_count += 1
            except Exception:
                log.exception("failed to send reminder %s", reminder.id)
                continue
            await session.execute(
                update(Reminder).where(Reminder.id == reminder.id).values(sent=True)
            )
        await session.commit()
    return sent_count


async def run_daily_summary(bot: Bot) -> int:
    """Send end-of-day summary to users whose local time is ~21:00.

    Returns the number of summaries sent.
    """
    sm = get_sessionmaker()
    now = datetime.now(UTC)
    sent_count = 0

    async with sm() as session:
        users = (await session.execute(select(User))).scalars().all()

        for user in users:
            try:
                tz = ZoneInfo(user.tz) if user.tz and user.tz != "UTC" else ZoneInfo("UTC")
            except (KeyError, ValueError):
                tz = ZoneInfo("UTC")

            local_now = now.astimezone(tz)
            if local_now.hour != 21:
                continue

            today_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + timedelta(days=1)

            today_start_utc = today_start.astimezone(UTC)
            today_end_utc = today_end.astimezone(UTC)
            today_date = local_now.date()

            incomplete = (
                await session.execute(
                    select(func.count())
                    .select_from(Task)
                    .where(
                        Task.user_id == user.id,
                        Task.is_done.is_(False),
                        Task.archived_at.is_(None),
                        Task.parent_task_id.is_(None),
                        (
                            (Task.due_date == today_date)
                            | (
                                (Task.has_time.is_(True))
                                & (Task.due_at >= today_start_utc)
                                & (Task.due_at < today_end_utc)
                            )
                        ),
                    )
                )
            ).scalar_one()

            if incomplete == 0:
                continue

            completed = (
                await session.execute(
                    select(func.count())
                    .select_from(Task)
                    .where(
                        Task.user_id == user.id,
                        Task.is_done.is_(True),
                        Task.parent_task_id.is_(None),
                        Task.done_at >= today_start_utc,
                        Task.done_at < today_end_utc,
                    )
                )
            ).scalar_one()

            task_word = _pluralize_tasks(incomplete)
            done_part = f"\n✅ Выполнено сегодня: {completed}" if completed > 0 else ""

            try:
                await bot.send_message(
                    chat_id=user.id,
                    text=(
                        f"📋 <b>Итоги дня</b>\n\n"
                        f"У тебя {incomplete} {task_word} на сегодня.{done_part}\n\n"
                        f"Открой приложение и заверши их! 💪"
                    ),
                )
                sent_count += 1
            except Exception:
                log.exception("failed to send daily summary to user %s", user.id)

    return sent_count


def _pluralize_tasks(n: int) -> str:
    if n % 10 == 1 and n % 100 != 11:
        return "незавершённая задача"
    if 2 <= n % 10 <= 4 and not (12 <= n % 100 <= 14):
        return "незавершённые задачи"
    return "незавершённых задач"


async def run_subscription_notifications(bot: Bot) -> int:
    """Send subscription expiry notifications. Returns the number sent."""
    from app.subscription import RENEWAL_DISCOUNT_PLAN

    sm = get_sessionmaker()
    now = datetime.now(UTC)
    sent_count = 0

    async with sm() as session:
        subs = (
            await session.execute(
                select(Subscription)
                .where(
                    Subscription.is_active.is_(True),
                    Subscription.expires_at.isnot(None),
                )
            )
        ).scalars().all()

        for sub in subs:
            days_left = (sub.expires_at - now).total_seconds() / 86400

            # 3 days before expiry
            if 2.5 < days_left <= 3.5 and not sub.notif_3d_sent:
                try:
                    exp_str = sub.expires_at.strftime("%d.%m.%Y")
                    await bot.send_message(
                        chat_id=sub.user_id,
                        text=(
                            "⏳ <b>Подписка скоро закончится</b>\n\n"
                            "Твоя Premium-подписка истекает "
                            f"{exp_str}.\n\n"
                            "Продли сейчас, чтобы не потерять "
                            "безлимитные задачи и все возможности!"
                        ),
                        reply_markup=InlineKeyboardMarkup(
                            inline_keyboard=[[
                                InlineKeyboardButton(
                                    text="💎 Продлить Premium",
                                    callback_data="show_premium",
                                )
                            ]]
                        ),
                    )
                    sent_count += 1
                except Exception:
                    log.exception("failed sub notif 3d for user %s", sub.user_id)
                    continue
                sub.notif_3d_sent = True
                await session.commit()

            # Day of expiry (0-24h left)
            elif -0.5 < days_left <= 0.5 and not sub.notif_0d_sent:
                try:
                    await bot.send_message(
                        chat_id=sub.user_id,
                        text=(
                            "⚠️ <b>Подписка истекла</b>\n\n"
                            "Твоя Premium-подписка закончилась. "
                            "Продли, чтобы вернуть все возможности!"
                        ),
                        reply_markup=InlineKeyboardMarkup(
                            inline_keyboard=[[
                                InlineKeyboardButton(
                                    text="💎 Продлить Premium",
                                    callback_data="show_premium",
                                )
                            ]]
                        ),
                    )
                    sent_count += 1
                except Exception:
                    log.exception("failed sub notif 0d for user %s", sub.user_id)
                    continue
                sub.notif_0d_sent = True
                await session.commit()

            # 1 day after expiry — discount offer
            elif -1.5 < days_left <= -0.5 and not sub.notif_discount_sent:
                discount = RENEWAL_DISCOUNT_PLAN
                try:
                    await bot.send_message(
                        chat_id=sub.user_id,
                        text=(
                            "🎁 <b>Специальное предложение!</b>\n\n"
                            "Мы скучаем! Держи скидку на продление:\n\n"
                            f"💎 Premium на {discount['label']} — "
                            f"<b>{discount['stars']} ⭐</b> "
                            f"<s>99 ⭐</s>\n\n"
                            "Предложение ограничено — не упусти!"
                        ),
                        reply_markup=InlineKeyboardMarkup(
                            inline_keyboard=[[
                                InlineKeyboardButton(
                                    text=f"🎁 Продлить за {discount['stars']} ⭐",
                                    callback_data="renew_discount",
                                )
                            ]]
                        ),
                    )
                    sent_count += 1
                except Exception:
                    log.exception("failed sub discount notif for user %s", sub.user_id)
                    continue
                sub.notif_discount_sent = True
                await session.commit()

    return sent_count
