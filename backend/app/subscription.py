"""Subscription helpers: check premium status, enforce limits."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Subscription, Task, User

FREE_MAX_TASKS = 5
PREMIUM_PRICE_STARS = 99


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


async def can_create_task(session: AsyncSession, user_id: int) -> bool:
    if await is_premium(session, user_id):
        return True
    count = await count_active_tasks(session, user_id)
    return count < FREE_MAX_TASKS


async def can_create_category(session: AsyncSession, user_id: int) -> bool:
    return await is_premium(session, user_id)


async def is_admin_user(session: AsyncSession, user_id: int) -> bool:
    user = await session.get(User, user_id)
    return user is not None and user.is_admin
