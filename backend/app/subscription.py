"""Subscription helpers: check premium status, enforce limits."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Subscription, Task, User

FREE_MAX_TASKS = 5
FREE_DAILY_LIMIT = 5
TRIAL_DAYS = 3
TRIAL_DISCOUNT_STARS = 69

# Pricing tiers: (label, days, stars)
PREMIUM_PLANS = [
    {"key": "1m", "label": "1 месяц", "days": 30, "stars": 99},
    {"key": "3m", "label": "3 месяца", "days": 90, "stars": 249, "save": "16%"},
    {"key": "12m", "label": "12 месяцев", "days": 365, "stars": 799, "save": "33%"},
]
PREMIUM_PRICE_STARS = 99  # default (1 month)

RENEWAL_DISCOUNT_PLAN = {"key": "renewal_1m", "label": "1 месяц (скидка)", "days": 30, "stars": 69}
TRIAL_DISCOUNT_PLAN = {
    "key": "trial_1m", "label": "1 месяц", "days": 30, "stars": TRIAL_DISCOUNT_STARS,
}


async def activate_trial(session: AsyncSession, user: User) -> None:
    now = datetime.now(UTC)
    expires_at = now + timedelta(days=TRIAL_DAYS)
    user.trial_started_at = now
    sub = Subscription(
        user_id=user.id,
        plan="trial",
        started_at=now,
        expires_at=expires_at,
        is_active=True,
        source="trial",
    )
    session.add(sub)
    await session.commit()


def is_trial_active(user: User) -> bool:
    if user.trial_started_at is None:
        return False
    if user.trial_ended_at is not None:
        return False
    now = datetime.now(UTC)
    return now < user.trial_started_at + timedelta(days=TRIAL_DAYS)


def trial_expires_at(user: User) -> datetime | None:
    if user.trial_started_at is None:
        return None
    return user.trial_started_at + timedelta(days=TRIAL_DAYS)


async def get_active_subscription(session: AsyncSession, user_id: int) -> Subscription | None:
    now = datetime.now(UTC)
    result = await session.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.is_active.is_(True),
        )
        .where(
            (Subscription.expires_at.is_(None)) | (Subscription.expires_at > now)
        )
        .order_by(Subscription.expires_at.desc().nulls_first())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def is_premium(session: AsyncSession, user_id: int) -> bool:
    sub = await get_active_subscription(session, user_id)
    return sub is not None


async def count_active_tasks(session: AsyncSession, user_id: int) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(Task)
        .where(
            Task.user_id == user_id,
            Task.is_done.is_(False),
            Task.archived_at.is_(None),
        )
    )
    return result.scalar_one()


async def count_tasks_created_today(session: AsyncSession, user_id: int, tz: str = "UTC") -> int:
    """Count tasks created today in the user's timezone."""
    try:
        from zoneinfo import ZoneInfo
        user_tz = ZoneInfo(tz)
    except (KeyError, ImportError):
        from zoneinfo import ZoneInfo
        user_tz = ZoneInfo("UTC")

    now_user = datetime.now(user_tz)
    start_of_day = now_user.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_day_utc = start_of_day.astimezone(UTC)

    result = await session.execute(
        select(func.count())
        .select_from(Task)
        .where(
            Task.user_id == user_id,
            Task.created_at >= start_of_day_utc,
        )
    )
    return result.scalar_one()


async def can_create_task(session: AsyncSession, user_id: int, tz: str = "UTC") -> bool:
    if await is_premium(session, user_id):
        return True
    count = await count_tasks_created_today(session, user_id, tz)
    return count < FREE_DAILY_LIMIT


async def can_create_category(session: AsyncSession, user_id: int) -> bool:
    return await is_premium(session, user_id)


async def is_admin_user(session: AsyncSession, user_id: int) -> bool:
    user = await session.get(User, user_id)
    return user is not None and user.is_admin
