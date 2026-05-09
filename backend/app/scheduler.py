"""Reminder dispatcher + daily summary.

Triggered externally via `POST /cron/tick` (e.g. from GitHub Actions cron).
Scans `reminders` table for entries that should fire and sends Telegram messages.
Daily summary sends end-of-day notification about incomplete tasks.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from aiogram import Bot
from aiogram.types import BufferedInputFile, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from sqlalchemy import func, select, update

from app.db import Reminder, Subscription, Task, User, get_sessionmaker

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"


def _asset_image(name: str) -> BufferedInputFile | None:
    p = ASSETS_DIR / name
    if p.exists():
        return BufferedInputFile(p.read_bytes(), filename=p.name)
    return None

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
    """Process due reminders. Returns the number of reminders sent.

    Retries each reminder up to 3 times with exponential backoff.
    Reminders older than 24h are auto-marked as sent to avoid stale pileup.
    """
    import asyncio

    sm = get_sessionmaker()
    now = datetime.now(UTC)
    sent_count = 0
    stale_cutoff = now - timedelta(hours=24)
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
            if reminder.fire_at < stale_cutoff:
                log.warning(
                    "stale reminder %s (fire_at=%s), marking sent",
                    reminder.id, reminder.fire_at,
                )
                await session.execute(
                    update(Reminder).where(Reminder.id == reminder.id).values(sent=True)
                )
                continue

            sent = False
            for attempt in range(3):
                try:
                    when = _format_in(task.due_at, now) if task.due_at else ""
                    text_when = f"\n🕒 {when}" if when else ""
                    await bot.send_message(
                        chat_id=task.user_id,
                        text=f"⏰ <b>Напоминание</b>\n\n<b>{task.title}</b>{text_when}",
                    )
                    sent = True
                    sent_count += 1
                    break
                except Exception:
                    if attempt < 2:
                        await asyncio.sleep(2 ** attempt)
                    else:
                        log.exception("failed to send reminder %s after 3 attempts", reminder.id)

            if sent:
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


async def run_streak_at_risk(bot: Bot) -> int:
    """Warn users at ~21:00 local time who have an active streak but no tasks done today."""
    from app.game_models import GameProfile

    sm = get_sessionmaker()
    now = datetime.now(UTC)
    sent = 0

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

            profile = await session.get(GameProfile, user.id)
            if not profile or profile.streak_days < 2:
                continue

            today = local_now.date()
            if profile.last_streak_date == today:
                continue

            today_done = (
                await session.execute(
                    select(func.count())
                    .select_from(Task)
                    .where(
                        Task.user_id == user.id,
                        Task.is_done.is_(True),
                        Task.done_at >= datetime.combine(
                            today, datetime.min.time(), tzinfo=tz
                        ).astimezone(UTC),
                        Task.done_at < (
                            datetime.combine(today, datetime.min.time(), tzinfo=tz)
                            + timedelta(days=1)
                        ).astimezone(UTC),
                    )
                )
            ).scalar_one()

            if today_done > 0:
                continue

            try:
                await bot.send_message(
                    chat_id=user.id,
                    text=(
                        f"🔥 <b>Стрик в опасности!</b>\n\n"
                        f"У тебя {profile.streak_days} дней подряд. "
                        f"Заверши хотя бы одну задачу сегодня, чтобы не потерять стрик!\n\n"
                        f"🔥 <b>Streak at risk!</b>\n\n"
                        f"You have a {profile.streak_days}-day streak. "
                        f"Complete at least one task today to keep it!"
                    ),
                )
                sent += 1
            except Exception:
                log.exception("failed streak warning for user %s", user.id)

    return sent


async def run_personal_offers(bot: Bot) -> int:
    """Send personal 69-star offers. Two triggers, each fires once."""
    from app.subscription import RENEWAL_DISCOUNT_PLAN, get_active_subscription

    sm = get_sessionmaker()
    now = datetime.now(UTC)
    sent = 0

    async with sm() as session:
        # Trigger 1: user showed interest in premium but never subscribed
        users = (
            await session.execute(
                select(User).where(
                    User.premium_interest_at.isnot(None),
                    User.notif_interest_sent.is_(False),
                )
            )
        ).scalars().all()

        for user in users:
            hours_since = (now - user.premium_interest_at).total_seconds() / 3600
            if hours_since < 24:
                continue
            sub = await get_active_subscription(session, user.id)
            if sub is not None:
                user.notif_interest_sent = True
                await session.commit()
                continue
            discount = RENEWAL_DISCOUNT_PLAN
            try:
                await bot.send_message(
                    chat_id=user.id,
                    text=(
                        "🎁 <b>Персональное предложение!</b>\n\n"
                        "Мы заметили, что тебе интересен Premium.\n"
                        "Специально для тебя — скидка:\n\n"
                        f"💎 Premium на {discount['label']} — "
                        f"<b>{discount['stars']} ⭐</b> "
                        f"<s>99 ⭐</s>\n\n"
                        "Предложение действует один раз — не упусти!"
                    ),
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[[
                            InlineKeyboardButton(
                                text=f"🎁 Подключить за {discount['stars']} ⭐",
                                callback_data="renew_discount",
                            )
                        ]]
                    ),
                )
                sent += 1
            except Exception:
                log.exception("failed personal offer (interest) for user %s", user.id)
                continue
            user.notif_interest_sent = True
            await session.commit()

        # Trigger 2: subscription expired and user did not renew
        expired_subs = (
            await session.execute(
                select(Subscription).where(
                    Subscription.is_active.is_(True),
                    Subscription.expires_at.isnot(None),
                    Subscription.notif_post_expiry_sent.is_(False),
                )
            )
        ).scalars().all()

        for sub in expired_subs:
            days_left = (sub.expires_at - now).total_seconds() / 86400
            if days_left > -1:
                continue
            active = await get_active_subscription(session, sub.user_id)
            if active is not None and active.id != sub.id:
                sub.notif_post_expiry_sent = True
                await session.commit()
                continue
            hours_expired = (now - sub.expires_at).total_seconds() / 3600
            if hours_expired < 24:
                continue
            discount = RENEWAL_DISCOUNT_PLAN
            try:
                await bot.send_message(
                    chat_id=sub.user_id,
                    text=(
                        "🎁 <b>Персональное предложение!</b>\n\n"
                        "Твоя подписка закончилась. "
                        "Держи последний шанс продлить со скидкой:\n\n"
                        f"💎 Premium на {discount['label']} — "
                        f"<b>{discount['stars']} ⭐</b> "
                        f"<s>99 ⭐</s>\n\n"
                        "Это предложение действует один раз!"
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
                sent += 1
            except Exception:
                log.exception("failed personal offer (expiry) for user %s", sub.user_id)
                continue
            sub.notif_post_expiry_sent = True
            await session.commit()

    return sent


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


async def run_trial_notifications(bot: Bot) -> int:
    """Send trial-related notifications: trial ending, trial expired + discount, last call."""
    from app.config import get_settings
    from app.subscription import TRIAL_DISCOUNT_PLAN, trial_expires_at

    sm = get_sessionmaker()
    now = datetime.now(UTC)
    sent = 0
    settings = get_settings()

    async with sm() as session:
        users = (
            await session.execute(
                select(User).where(
                    User.trial_started_at.isnot(None),
                    User.trial_ended_at.is_(None),
                )
            )
        ).scalars().all()

        for user in users:
            expires = trial_expires_at(user)
            if expires is None:
                continue

            hours_left = (expires - now).total_seconds() / 3600

            # Trial ending reminder (~12h before end)
            if 0 < hours_left <= 18 and not user.trial_ending_notified:
                text_ru = (
                    "💎 <b>С Premium планировать удобнее</b>\n\n"
                    "У тебя уже открыт полный доступ, а значит ты можешь "
                    "пользоваться Task Blo так, как задумано:\n"
                    "• 🎤 создавать задачи голосом\n"
                    "• ♾️ не упираться в лимиты\n"
                    "• 🏷 наводить порядок своими категориями\n\n"
                    "Если тебе нравится такой формат, его можно будет "
                    "сохранить и дальше."
                )
                kb = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(
                        text="🚀 Открыть приложение",
                        web_app=WebAppInfo(url=settings.webapp_url),
                    )],
                    [InlineKeyboardButton(
                        text="💎 Посмотреть Premium",
                        callback_data="show_premium",
                    )],
                ])
                try:
                    img = _asset_image("trial_ending_ru.png")
                    if img:
                        await bot.send_photo(
                            chat_id=user.id, photo=img,
                            caption=text_ru, reply_markup=kb,
                        )
                    else:
                        await bot.send_message(
                            chat_id=user.id, text=text_ru, reply_markup=kb,
                        )
                    sent += 1
                except Exception:
                    log.exception("failed trial ending notif for user %s", user.id)
                    continue
                user.trial_ending_notified = True
                await session.commit()

            # Trial expired — discount offer
            elif hours_left <= 0 and not user.trial_expired_notified:
                discount = TRIAL_DISCOUNT_PLAN
                text_ru = (
                    "🎁 <b>Пробный период закончился</b>\n\n"
                    "Если тебе зашёл полный формат Task Blo, можно "
                    "сохранить все ключевые возможности:\n"
                    "• 🎤 голосовой ввод\n"
                    "• ♾️ безлимитные задачи\n"
                    "• 🏷 свои категории\n\n"
                    "Сейчас для тебя действует цена на первый месяц:\n"
                    f"<b>💎 {discount['stars']} ⭐ вместо 99 ⭐</b>"
                )
                kb = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(
                        text=f"💎 Подключить за {discount['stars']} ⭐",
                        callback_data="trial_discount",
                    )],
                    [InlineKeyboardButton(
                        text="📋 Продолжить бесплатно",
                        callback_data="dismiss_trial",
                    )],
                ])
                try:
                    img = _asset_image("trial_expired_discount_ru.png")
                    if img:
                        await bot.send_photo(
                            chat_id=user.id, photo=img,
                            caption=text_ru, reply_markup=kb,
                        )
                    else:
                        await bot.send_message(
                            chat_id=user.id, text=text_ru, reply_markup=kb,
                        )
                    sent += 1
                except Exception:
                    log.exception("failed trial expired notif for user %s", user.id)
                    continue
                user.trial_expired_notified = True
                user.trial_ended_at = now
                await session.commit()

        # Last call — 24h after trial expired for users who haven't bought yet
        last_call_users = (
            await session.execute(
                select(User).where(
                    User.trial_ended_at.isnot(None),
                    User.trial_expired_notified.is_(True),
                    User.trial_last_call_sent.is_(False),
                )
            )
        ).scalars().all()

        for user in last_call_users:
            if user.trial_ended_at is None:
                continue
            hours_since_expired = (now - user.trial_ended_at).total_seconds() / 3600
            if hours_since_expired < 24:
                continue

            from app.subscription import TRIAL_DISCOUNT_PLAN, get_active_subscription

            sub = await get_active_subscription(session, user.id)
            if sub is not None:
                user.trial_last_call_sent = True
                await session.commit()
                continue

            discount = TRIAL_DISCOUNT_PLAN
            text_ru = (
                "⚡ <b>Сохрани полный доступ со скидкой</b>\n\n"
                "Оставь себе то, к чему уже успел привыкнуть:\n"
                "🎤 голосовой ввод, ♾️ безлимитные задачи и "
                "🏷 свои категории.\n\n"
                f"<b>Первый месяц — {discount['stars']} ⭐ вместо 99 ⭐</b>"
            )
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(
                    text=f"💎 Забрать за {discount['stars']} ⭐",
                    callback_data="trial_discount",
                )],
            ])
            try:
                await bot.send_message(
                    chat_id=user.id, text=text_ru, reply_markup=kb,
                )
                sent += 1
            except Exception:
                log.exception("failed trial last call for user %s", user.id)
                continue
            user.trial_last_call_sent = True
            await session.commit()

    return sent
