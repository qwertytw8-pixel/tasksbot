"""Subscription API: status, plans, promo activation."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import TelegramUser, get_telegram_user_factory
from app.config import get_settings
from app.db import PromoActivation, PromoCode, Subscription, User, get_session
from app.schemas import (
    PlanInfo,
    PlansOut,
    PromoActivateIn,
    PromoActivateOut,
    SubscriptionOut,
    SubscriptionStatus,
)
from app.subscription import (
    FREE_DAILY_LIMIT,
    FREE_MAX_TASKS,
    PREMIUM_PLANS,
    PREMIUM_PRICE_STARS,
    can_create_category,
    count_active_tasks,
    count_tasks_created_today,
    get_active_subscription,
    is_premium,
)

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


def _get_dep():
    return get_telegram_user_factory(get_settings().bot_token)


async def _ensure_user(session: AsyncSession, tg: TelegramUser) -> User:
    user = await session.get(User, tg.id)
    if user is None:
        user = User(id=tg.id)
        session.add(user)
        await session.commit()
        user = await session.get(User, tg.id)
        assert user is not None
    return user


@router.get("/status", response_model=SubscriptionStatus)
async def get_subscription_status(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> SubscriptionStatus:
    user = await _ensure_user(session, tg)
    premium = await is_premium(session, tg.id)
    sub = await get_active_subscription(session, tg.id)
    active_count = await count_active_tasks(session, tg.id)
    daily_count = await count_tasks_created_today(session, tg.id, user.tz)
    can_cats = await can_create_category(session, tg.id)

    sub_out = SubscriptionOut.model_validate(sub) if sub else None

    return SubscriptionStatus(
        is_premium=premium,
        subscription=sub_out,
        active_tasks_count=active_count,
        max_tasks=999_999 if premium else FREE_MAX_TASKS,
        daily_tasks_count=daily_count,
        max_daily_tasks=999_999 if premium else FREE_DAILY_LIMIT,
        can_create_categories=can_cats,
    )


@router.get("/plans", response_model=PlansOut)
async def get_plans(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> PlansOut:
    await _ensure_user(session, tg)
    return PlansOut(
        free=PlanInfo(
            name="Free",
            price_stars=0,
            features=[
                f"До {FREE_DAILY_LIMIT} задач в день",
                "4 стандартные категории",
                "Напоминания",
                "Светлая и тёмная тема",
            ],
        ),
        premium=PlanInfo(
            name="Premium",
            price_stars=PREMIUM_PRICE_STARS,
            features=[
                "Безлимитные задачи",
                "Создание своих категорий",
                "AI-парсинг текстовых сообщений",
                "AI-парсинг голосовых сообщений",
                "Подзадачи без ограничений",
                "Напоминания",
                "Светлая и тёмная тема",
            ],
        ),
    )


@router.post("/activate-promo", response_model=PromoActivateOut)
async def activate_promo(
    payload: PromoActivateIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> PromoActivateOut:
    await _ensure_user(session, tg)

    promo = await session.execute(
        select(PromoCode).where(
            PromoCode.code == payload.code.strip().upper(),
            PromoCode.is_active.is_(True),
        )
    )
    promo_row = promo.scalar_one_or_none()
    if promo_row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Промокод не найден или неактивен")

    if promo_row.current_uses >= promo_row.max_uses:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Промокод исчерпан")

    already = await session.execute(
        select(PromoActivation).where(
            PromoActivation.promo_id == promo_row.id,
            PromoActivation.user_id == tg.id,
        )
    )
    if already.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ты уже использовал этот промокод")

    now = datetime.now(UTC)
    expires_at = now + timedelta(days=promo_row.duration_days)

    sub = Subscription(
        user_id=tg.id,
        plan="premium",
        started_at=now,
        expires_at=expires_at,
        is_active=True,
        source="promo",
    )
    session.add(sub)

    activation = PromoActivation(
        promo_id=promo_row.id,
        user_id=tg.id,
        activated_at=now,
    )
    session.add(activation)

    promo_row.current_uses += 1

    await session.commit()

    return PromoActivateOut(
        success=True,
        message=f"Premium активирован на {promo_row.duration_days} дней!",
        expires_at=expires_at,
    )


@router.post("/create-invoice")
async def create_invoice(
    request: Request,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Create a Telegram Stars invoice link for in-app payment."""
    body = await request.json()
    plan_key = body.get("plan", "1m")

    plan = next(
        (p for p in PREMIUM_PLANS if p["key"] == plan_key),
        None,
    )
    if plan is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Неизвестный тариф",
        )

    await _ensure_user(session, tg)
    if await is_premium(session, tg.id):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "У тебя уже есть активная подписка",
        )

    from aiogram import Bot

    bot: Bot = request.app.state.bot
    link = await bot.create_invoice_link(
        title="Task Blo Premium",
        description=(
            f"Premium {plan['label']}: "
            "безлимитные задачи, "
            "свои категории, AI."
        ),
        payload=json.dumps({
            "type": f"premium_{plan_key}",
            "user_id": tg.id,
            "days": plan["days"],
        }),
        currency="XTR",
        prices=[
            {"label": f"Premium {plan['label']}", "amount": plan["stars"]}
        ],
    )
    return {"invoice_url": link}
