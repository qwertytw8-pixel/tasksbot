"""Admin API: stats, user management, promo codes, subscription grants."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import TelegramUser, get_telegram_user_factory
from app.config import get_settings
from app.db import PromoActivation, PromoCode, Subscription, Task, User, get_session
from app.game_models import GameProfile
from app.schemas import (
    AdminGrantCoinsIn,
    AdminGrantIn,
    AdminStatsOut,
    AdminUserOut,
    PromoCodeIn,
    PromoCodeOut,
)
from app.subscription import get_active_subscription, is_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _get_dep():
    return get_telegram_user_factory(get_settings().bot_token)


async def _require_admin(session: AsyncSession, tg: TelegramUser) -> None:
    if not await is_admin_user(session, tg.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")


@router.get("/stats", response_model=AdminStatsOut)
async def admin_stats(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> AdminStatsOut:
    await _require_admin(session, tg)
    now = datetime.now(UTC)

    total_users = (await session.execute(select(func.count()).select_from(User))).scalar_one()

    premium_sub = (
        select(Subscription.user_id)
        .where(
            Subscription.is_active.is_(True),
            (Subscription.expires_at.is_(None)) | (Subscription.expires_at > now),
        )
        .distinct()
    )
    premium_users = (
        await session.execute(select(func.count()).select_from(premium_sub.subquery()))
    ).scalar_one()

    total_tasks = (await session.execute(select(func.count()).select_from(Task))).scalar_one()
    total_promos = (
        await session.execute(select(func.count()).select_from(PromoCode))
    ).scalar_one()
    total_activations = (
        await session.execute(select(func.count()).select_from(PromoActivation))
    ).scalar_one()

    return AdminStatsOut(
        total_users=total_users,
        premium_users=premium_users,
        total_tasks=total_tasks,
        total_promo_codes=total_promos,
        total_promo_activations=total_activations,
    )


@router.get("/users", response_model=list[AdminUserOut])
async def admin_list_users(
    premium_only: bool = False,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> list[AdminUserOut]:
    await _require_admin(session, tg)
    stmt = select(User).order_by(User.created_at.desc())
    rows = await session.execute(stmt)
    users = list(rows.scalars())

    result: list[AdminUserOut] = []
    for u in users:
        sub = await get_active_subscription(session, u.id)
        is_prem = sub is not None
        if premium_only and not is_prem:
            continue
        result.append(
            AdminUserOut(
                id=u.id,
                tz=u.tz,
                is_admin=u.is_admin,
                created_at=u.created_at,
                is_premium=is_prem,
                subscription_expires=sub.expires_at if sub else None,
            )
        )
    return result


@router.get("/promos", response_model=list[PromoCodeOut])
async def admin_list_promos(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> list[PromoCodeOut]:
    await _require_admin(session, tg)
    rows = await session.execute(
        select(PromoCode).order_by(PromoCode.created_at.desc())
    )
    return [PromoCodeOut.model_validate(p) for p in rows.scalars()]


@router.post("/promos", response_model=PromoCodeOut, status_code=201)
async def admin_create_promo(
    payload: PromoCodeIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> PromoCodeOut:
    await _require_admin(session, tg)

    existing = await session.execute(
        select(PromoCode).where(PromoCode.code == payload.code.strip().upper())
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Промокод с таким кодом уже существует")

    promo = PromoCode(
        code=payload.code.strip().upper(),
        duration_days=payload.duration_days,
        max_uses=payload.max_uses,
        is_active=True,
        created_by=tg.id,
    )
    session.add(promo)
    await session.commit()
    await session.refresh(promo)
    return PromoCodeOut.model_validate(promo)


@router.delete("/promos/{promo_id}", status_code=204)
async def admin_delete_promo(
    promo_id: int,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> None:
    await _require_admin(session, tg)
    promo = await session.get(PromoCode, promo_id)
    if promo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Промокод не найден")
    promo.is_active = False
    await session.commit()


@router.post("/grant", response_model=dict)
async def admin_grant_subscription(
    payload: AdminGrantIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> dict:
    await _require_admin(session, tg)

    user = await session.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")

    now = datetime.now(UTC)
    expires_at = now + timedelta(days=payload.duration_days) if payload.duration_days else None

    sub = Subscription(
        user_id=payload.user_id,
        plan="premium",
        started_at=now,
        expires_at=expires_at,
        is_active=True,
        source="admin_grant",
    )
    session.add(sub)
    await session.commit()

    return {
        "success": True,
        "message": f"Premium выдан пользователю {payload.user_id}"
        + (f" на {payload.duration_days} дней" if payload.duration_days else " навсегда"),
    }


@router.post("/grant-coins", response_model=dict)
async def admin_grant_coins(
    payload: AdminGrantCoinsIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> dict:
    await _require_admin(session, tg)

    user = await session.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")

    profile = await session.get(GameProfile, payload.user_id)
    if profile is None:
        profile = GameProfile(user_id=payload.user_id)
        session.add(profile)
        await session.flush()

    profile.coins += payload.coins
    profile.total_coins_earned += payload.coins
    await session.commit()

    return {
        "success": True,
        "message": f"Выдано {payload.coins} монет пользователю {payload.user_id}",
        "new_balance": profile.coins,
    }


@router.post("/test-notification", response_model=dict)
async def admin_test_notification(
    request: Request,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> dict:
    await _require_admin(session, tg)

    from aiogram import Bot

    bot: Bot = request.app.state.bot

    admins = (
        await session.execute(
            select(User).where(User.is_admin.is_(True))
        )
    ).scalars().all()

    sent = 0
    for admin in admins:
        try:
            await bot.send_message(
                chat_id=admin.id,
                text=(
                    "🔔 <b>Тестовое уведомление</b>\n\n"
                    "Если ты видишь это сообщение — "
                    "отправка уведомлений работает!"
                ),
            )
            sent += 1
        except Exception:
            pass

    return {
        "success": True,
        "message": f"Отправлено {sent} из {len(admins)} админам",
    }
