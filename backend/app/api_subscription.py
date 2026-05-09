"""Subscription API: status, plans, promo activation."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import TelegramUser, get_telegram_user_factory
from app.config import get_settings
from app.db import PromoActivation, PromoCode, Referral, Subscription, User, get_session
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
    RENEWAL_DISCOUNT_PLAN,
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
                "Напоминания только вовремя",
            ],
        ),
        premium=PlanInfo(
            name="Premium",
            price_stars=PREMIUM_PRICE_STARS,
            features=[
                "Безлимитные задачи каждый день",
                "Свои категории",
                "Создавай задачи прямо из чата",
                "Создавай задачи голосовым сообщением",
                "Напоминания заранее",
                "Подзадачи без ограничений",
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

    all_plans = [*PREMIUM_PLANS, RENEWAL_DISCOUNT_PLAN]
    plan = next(
        (p for p in all_plans if p["key"] == plan_key),
        None,
    )
    if plan is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Неизвестный тариф",
        )

    await _ensure_user(session, tg)

    from aiogram import Bot

    bot: Bot = request.app.state.bot
    active_sub = await get_active_subscription(session, tg.id)
    ext = ""
    if active_sub and active_sub.expires_at:
        from datetime import timedelta as td
        ext_date = (active_sub.expires_at + td(days=plan["days"])).strftime("%d.%m.%Y")
        ext = f" (продлит до {ext_date})"
    desc = (
        f"Premium {plan['label']}: "
        "безлимитные задачи, "
        f"свои категории и все возможности.{ext}"
    )
    link = await bot.create_invoice_link(
        title="Task Blo Premium",
        description=desc,
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


# -------------------- Referral system --------------------

REFERRAL_BONUS_DAYS = 3


@router.get("/referral")
async def get_referral_info(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Return referral link and stats for current user."""
    from sqlalchemy import func

    await _ensure_user(session, tg)
    settings = get_settings()
    bot_username = settings.bot_username

    ref_link = f"https://t.me/{bot_username}?start=ref_{tg.id}"

    total_invited = (
        await session.execute(
            select(func.count(Referral.id)).where(Referral.referrer_id == tg.id)
        )
    ).scalar_one()

    rewarded_count = (
        await session.execute(
            select(func.count(Referral.id)).where(
                Referral.referrer_id == tg.id,
                Referral.rewarded.is_(True),
            )
        )
    ).scalar_one()

    total_days_earned = rewarded_count * REFERRAL_BONUS_DAYS

    return {
        "referral_link": ref_link,
        "total_invited": total_invited,
        "rewarded_count": rewarded_count,
        "total_days_earned": total_days_earned,
        "bonus_days_per_invite": REFERRAL_BONUS_DAYS,
    }
