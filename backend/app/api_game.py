"""Game API endpoints for the Pet / Gamification feature."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import TelegramUser, get_telegram_user_factory
from app.config import get_settings
from app.db import Task, get_session
from app.game import (
    CHARACTER_NAMES_EN,
    CHARACTER_NAMES_RU,
    EVOLUTION_THRESHOLDS,
    FREE_DAILY_CAP,
    PREMIUM_DAILY_CAP,
    RARITY_NAMES_EN,
    RARITY_NAMES_RU,
    STAGE_NAMES_EN,
    STAGE_NAMES_RU,
    hatch_egg,
)
from app.game_models import (
    GameAchievement,
    GameInventory,
    GameItem,
    GamePet,
    GameProfile,
    GameUserAchievement,
)
from app.game_schemas import (
    BuyRequest,
    DeletePetResponse,
    EquipRequest,
    GameAchievementOut,
    GameItemOut,
    GamePetOut,
    GameProfileOut,
    HatchRequest,
    HatchResponse,
    RenameRequest,
    SetBackgroundRequest,
)

FREE_EGG_WEEKLY_LIMIT = 3

router = APIRouter(prefix="/api/game", tags=["game"])

_CONDITION_ATTR_MAP = {
    "tasks_done": "tasks_completed_total",
    "streak": "streak_days",
    "perfect_days": "perfect_days_count",
    "ontime": "tasks_ontime_total",
    "high_priority": "tasks_high_priority_total",
    "items_bought": "items_purchased_total",
}


def _get_dep():
    return get_telegram_user_factory(get_settings().bot_token)


def _user_today(tz_name: str):
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo(tz_name)).date()
    except Exception:
        return datetime.now(UTC).date()


def _pet_to_out(pet: GamePet, inventory_item_slugs: dict[int, str] | None = None) -> GamePetOut:
    stage_idx = pet.stage - 1
    xp_for_next = (
        EVOLUTION_THRESHOLDS[pet.stage] if pet.stage < len(EVOLUTION_THRESHOLDS) else pet.xp
    )
    xp_current = EVOLUTION_THRESHOLDS[stage_idx] if stage_idx < len(EVOLUTION_THRESHOLDS) else 0
    acc_slug = None
    if pet.accessory_item_id and inventory_item_slugs:
        acc_slug = inventory_item_slugs.get(pet.accessory_item_id)
    return GamePetOut(
        id=pet.id,
        character_type=pet.character_type,
        rarity=pet.rarity,
        name=pet.name,
        xp=pet.xp,
        stage=pet.stage,
        stage_name_ru=STAGE_NAMES_RU[stage_idx] if stage_idx < len(STAGE_NAMES_RU) else "?",
        stage_name_en=STAGE_NAMES_EN[stage_idx] if stage_idx < len(STAGE_NAMES_EN) else "?",
        xp_for_next=xp_for_next,
        xp_current_stage=xp_current,
        accessory_slug=acc_slug,
        hatched_at=pet.hatched_at,
    )


async def _ensure_profile(session: AsyncSession, user_id: int) -> GameProfile:
    profile = await session.get(GameProfile, user_id)
    if profile is None:
        profile = GameProfile(user_id=user_id)
        session.add(profile)
        await session.flush()
    return profile


async def _get_item_slug_map(session: AsyncSession) -> dict[int, str]:
    rows = (await session.execute(select(GameItem.id, GameItem.slug))).all()
    return {r[0]: r[1] for r in rows}


# -------------------- GET /profile --------------------

@router.get("/profile", response_model=GameProfileOut)
async def get_profile(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    user = await _ensure_user(session, tg)
    profile = await _ensure_profile(session, tg.id)
    from app.subscription import is_premium as check_premium
    is_premium = await check_premium(session, tg.id)
    today = _user_today(user.tz)

    # Active pet
    active_pet_out = None
    if profile.active_pet_id:
        pet = await session.get(GamePet, profile.active_pet_id)
        if pet:
            slug_map = await _get_item_slug_map(session)
            active_pet_out = _pet_to_out(pet, slug_map)

    # Active background
    bg_slug = None
    if profile.active_background_id:
        bg_item = await session.get(GameItem, profile.active_background_id)
        if bg_item:
            bg_slug = bg_item.slug

    # Today stats
    today_done = (
        await session.execute(
            select(func.count(Task.id)).where(
                Task.user_id == tg.id,
                Task.due_date == today,
                Task.is_done.is_(True),
                Task.archived_at.is_(None),
            )
        )
    ).scalar_one()
    today_total = (
        await session.execute(
            select(func.count(Task.id)).where(
                Task.user_id == tg.id,
                Task.due_date == today,
                Task.archived_at.is_(None),
            )
        )
    ).scalar_one()

    daily_cap = PREMIUM_DAILY_CAP if is_premium else FREE_DAILY_CAP
    daily_earned = profile.daily_coins_earned if profile.daily_coins_date == today else 0

    await session.commit()

    return GameProfileOut(
        coins=profile.coins,
        total_coins_earned=profile.total_coins_earned,
        streak_days=profile.streak_days,
        last_streak_date=str(profile.last_streak_date) if profile.last_streak_date else None,
        perfect_days_count=profile.perfect_days_count,
        tasks_completed_total=profile.tasks_completed_total,
        daily_coins_earned=daily_earned,
        daily_cap=daily_cap,
        active_pet=active_pet_out,
        active_background_slug=bg_slug,
        today_tasks_done=today_done,
        today_tasks_total=today_total,
        has_pet=profile.active_pet_id is not None,
    )


# -------------------- POST /hatch --------------------

@router.post("/hatch", response_model=HatchResponse)
async def hatch(
    payload: HatchRequest,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    profile = await _ensure_profile(session, tg.id)

    # Check if user can afford the egg
    egg_item = (
        await session.execute(
            select(GameItem).where(GameItem.slug == payload.egg_slug, GameItem.type == "egg")
        )
    ).scalar_one_or_none()

    if egg_item is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "unknown egg type")

    # First egg is free (if user has no pets)
    pets_count = (
        await session.execute(
            select(func.count(GamePet.id)).where(GamePet.user_id == tg.id)
        )
    ).scalar_one()

    if pets_count == 0:
        if payload.egg_slug != "egg_common":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "first egg must be common")
    elif egg_item.price == 0:
        # Free egg weekly limit
        week_ago = datetime.now(UTC) - timedelta(days=7)
        free_hatches_this_week = (
            await session.execute(
                select(func.count(GamePet.id)).where(
                    GamePet.user_id == tg.id,
                    GamePet.hatched_at >= week_ago,
                )
            )
        ).scalar_one()
        if free_hatches_this_week >= FREE_EGG_WEEKLY_LIMIT:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                f"free egg limit reached ({FREE_EGG_WEEKLY_LIMIT}/week)",
            )
    else:
        if profile.coins < egg_item.price:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "not enough coins")
        profile.coins -= egg_item.price

    pet = await hatch_egg(session, tg.id, payload.egg_slug)
    slug_map = await _get_item_slug_map(session)
    pet_out = _pet_to_out(pet, slug_map)

    await session.commit()

    return HatchResponse(
        pet=pet_out,
        character_name_ru=CHARACTER_NAMES_RU.get(pet.character_type, pet.character_type),
        character_name_en=CHARACTER_NAMES_EN.get(pet.character_type, pet.character_type),
        rarity_name_ru=RARITY_NAMES_RU.get(pet.rarity, pet.rarity),
        rarity_name_en=RARITY_NAMES_EN.get(pet.rarity, pet.rarity),
    )


# -------------------- GET /pets --------------------

@router.get("/pets", response_model=list[GamePetOut])
async def list_pets(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    rows = (
        await session.execute(
            select(GamePet).where(GamePet.user_id == tg.id).order_by(GamePet.hatched_at)
        )
    ).scalars().all()
    slug_map = await _get_item_slug_map(session)
    return [_pet_to_out(p, slug_map) for p in rows]


# -------------------- POST /pets/{id}/activate --------------------

@router.post("/pets/{pet_id}/activate", response_model=GamePetOut)
async def activate_pet(
    pet_id: int,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    pet = await session.get(GamePet, pet_id)
    if pet is None or pet.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "pet not found")

    profile = await _ensure_profile(session, tg.id)
    profile.active_pet_id = pet.id
    await session.commit()
    slug_map = await _get_item_slug_map(session)
    return _pet_to_out(pet, slug_map)


# -------------------- POST /pets/{id}/rename --------------------

@router.post("/pets/{pet_id}/rename", response_model=GamePetOut)
async def rename_pet(
    pet_id: int,
    payload: RenameRequest,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    pet = await session.get(GamePet, pet_id)
    if pet is None or pet.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "pet not found")

    pet.name = payload.name
    await session.commit()
    slug_map = await _get_item_slug_map(session)
    return _pet_to_out(pet, slug_map)


# -------------------- DELETE /pets/{id} --------------------

@router.delete("/pets/{pet_id}", response_model=DeletePetResponse)
async def delete_pet(
    pet_id: int,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    pet = await session.get(GamePet, pet_id)
    if pet is None or pet.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "pet not found")

    profile = await _ensure_profile(session, tg.id)
    if profile.active_pet_id == pet.id:
        profile.active_pet_id = None

    await session.delete(pet)
    await session.commit()
    return DeletePetResponse()


# -------------------- GET /shop --------------------

@router.get("/shop", response_model=list[GameItemOut])
async def get_shop(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    profile = await _ensure_profile(session, tg.id)

    items = (
        await session.execute(select(GameItem).order_by(GameItem.sort_order))
    ).scalars().all()

    owned_ids = set(
        (
            await session.execute(
                select(GameInventory.item_id).where(GameInventory.user_id == tg.id)
            )
        ).scalars().all()
    )

    # Find equipped items
    equipped_acc_ids: set[int] = set()
    pets = (
        await session.execute(
            select(GamePet.accessory_item_id).where(
                GamePet.user_id == tg.id, GamePet.accessory_item_id.is_not(None)
            )
        )
    ).scalars().all()
    equipped_acc_ids = {pid for pid in pets if pid is not None}
    equipped_bg_id = profile.active_background_id

    result = []
    for item in items:
        is_equipped = (
            item.id in equipped_acc_ids
            or (item.type == "background" and item.id == equipped_bg_id)
        )
        result.append(
            GameItemOut(
                id=item.id,
                slug=item.slug,
                name_ru=item.name_ru,
                name_en=item.name_en,
                type=item.type,
                image_path=item.image_path,
                price=item.price,
                is_premium=item.is_premium,
                owned=item.id in owned_ids,
                equipped=is_equipped,
            )
        )

    return result


# -------------------- POST /buy --------------------

@router.post("/buy", response_model=GameItemOut)
async def buy_item(
    payload: BuyRequest,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    profile = await _ensure_profile(session, tg.id)
    from app.subscription import is_premium as check_premium
    is_premium = await check_premium(session, tg.id)

    item = await session.get(GameItem, payload.item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "item not found")

    if item.type == "egg":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "use /hatch to purchase eggs")

    if item.is_premium and not is_premium:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "premium required")

    # Check already owned
    already = (
        await session.execute(
            select(GameInventory.id).where(
                GameInventory.user_id == tg.id, GameInventory.item_id == item.id
            )
        )
    ).scalar_one_or_none()
    if already is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "already owned")

    if profile.coins < item.price:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "not enough coins")

    profile.coins -= item.price
    session.add(GameInventory(user_id=tg.id, item_id=item.id))
    profile.items_purchased_total += 1

    await session.commit()

    return GameItemOut(
        id=item.id,
        slug=item.slug,
        name_ru=item.name_ru,
        name_en=item.name_en,
        type=item.type,
        image_path=item.image_path,
        price=item.price,
        is_premium=item.is_premium,
        owned=True,
        equipped=False,
    )


# -------------------- POST /equip --------------------

@router.post("/equip", response_model=GamePetOut)
async def equip_accessory(
    payload: EquipRequest,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)

    pet = await session.get(GamePet, payload.pet_id)
    if pet is None or pet.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "pet not found")

    if payload.item_id is None:
        pet.accessory_item_id = None
    else:
        owned = (
            await session.execute(
                select(GameInventory.id).where(
                    GameInventory.user_id == tg.id, GameInventory.item_id == payload.item_id
                )
            )
        ).scalar_one_or_none()
        if owned is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "item not owned")
        item = await session.get(GameItem, payload.item_id)
        if item is None or item.type != "accessory":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "not an accessory")
        pet.accessory_item_id = payload.item_id

    await session.commit()
    slug_map = await _get_item_slug_map(session)
    return _pet_to_out(pet, slug_map)


# -------------------- POST /set-background --------------------

@router.post("/set-background", response_model=GameProfileOut)
async def set_background(
    payload: SetBackgroundRequest,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    profile = await _ensure_profile(session, tg.id)

    if payload.item_id is None:
        profile.active_background_id = None
    else:
        owned = (
            await session.execute(
                select(GameInventory.id).where(
                    GameInventory.user_id == tg.id, GameInventory.item_id == payload.item_id
                )
            )
        ).scalar_one_or_none()
        if owned is None:
            # Default background (price=0) doesn't need to be in inventory
            item = await session.get(GameItem, payload.item_id)
            if item is None or item.price != 0:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "item not owned")
        item = await session.get(GameItem, payload.item_id)
        if item is None or item.type != "background":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "not a background")
        profile.active_background_id = payload.item_id

    await session.commit()
    # Re-fetch to return updated profile
    return await get_profile(tg=tg, session=session)


# -------------------- GET /achievements --------------------

@router.get("/achievements", response_model=list[GameAchievementOut])
async def get_achievements(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    from app.api import _ensure_user
    await _ensure_user(session, tg)
    profile = await _ensure_profile(session, tg.id)

    all_ach = (
        await session.execute(select(GameAchievement).order_by(GameAchievement.sort_order))
    ).scalars().all()

    unlocked_map: dict[int, datetime] = {}
    rows = (
        await session.execute(
            select(GameUserAchievement).where(GameUserAchievement.user_id == tg.id)
        )
    ).scalars().all()
    for r in rows:
        unlocked_map[r.achievement_id] = r.unlocked_at

    result = []
    for ach in all_ach:
        attr_name = _CONDITION_ATTR_MAP.get(ach.condition_type)
        progress = getattr(profile, attr_name, 0) if attr_name else 0
        result.append(
            GameAchievementOut(
                id=ach.id,
                slug=ach.slug,
                name_ru=ach.name_ru,
                name_en=ach.name_en,
                description_ru=ach.description_ru,
                description_en=ach.description_en,
                icon=ach.icon,
                condition_type=ach.condition_type,
                condition_value=ach.condition_value,
                reward_coins=ach.reward_coins,
                unlocked=ach.id in unlocked_map,
                unlocked_at=unlocked_map.get(ach.id),
                progress=min(progress, ach.condition_value),
            )
        )

    return result
