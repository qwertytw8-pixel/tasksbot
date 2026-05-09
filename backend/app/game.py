"""Core game logic: coin/XP awards, streaks, evolution, achievements."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Task
from app.game_models import (
    GameAchievement,
    GameDailyQuest,
    GameEggDrop,
    GamePet,
    GameProfile,
    GameUserAchievement,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PRIORITY_COINS = {0: 5, 1: 8, 2: 12, 3: 18}
ONTIME_BONUS = 3
PERFECT_DAY_BONUS = 15

EVOLUTION_THRESHOLDS = [0, 100, 350, 800, 1500]  # XP for stages 1-5

STAGE_NAMES_RU = ["Малыш", "Подросток", "Взрослый", "Мастер", "Легенда"]
STAGE_NAMES_EN = ["Baby", "Teen", "Adult", "Master", "Legend"]

RARITY_NAMES_RU = {"common": "обычный", "rare": "редкий", "epic": "эпический"}
RARITY_NAMES_EN = {"common": "Common", "rare": "Rare", "epic": "Epic"}

CHARACTER_NAMES_RU = {"cat": "Котёнок", "fox": "Лисёнок", "dragon": "Дракончик"}
CHARACTER_NAMES_EN = {"cat": "Kitty", "fox": "Foxy", "dragon": "Draco"}

# Anti-abuse
MIN_TITLE_LENGTH = 3
MIN_LIFETIME_SECONDS = 120  # 2 minutes
FREE_DAILY_CAP = 100
PREMIUM_DAILY_CAP = 200

# Streak multipliers for COINS: {min_days: (free_mult, premium_mult)}
STREAK_COIN_MULTS: list[tuple[int, float, float]] = [
    (30, 1.5, 2.0),
    (14, 1.3, 1.8),
    (7, 1.2, 1.5),
    (3, 1.1, 1.2),
    (1, 1.0, 1.0),
]

# Streak multipliers for XP
STREAK_XP_MULTS: list[tuple[int, float, float]] = [
    (30, 1.2, 1.7),
    (14, 1.15, 1.5),
    (7, 1.1, 1.3),
    (3, 1.05, 1.15),
    (1, 1.0, 1.0),
]

# Rarity multipliers: {rarity: (free, premium)}
RARITY_COIN_MULTS = {"common": (1.0, 1.0), "rare": (1.05, 1.1), "epic": (1.1, 1.2)}
RARITY_XP_MULTS = {"common": (1.0, 1.0), "rare": (1.05, 1.1), "epic": (1.1, 1.2)}

PREMIUM_COIN_BONUS = 1.5

# Combo multipliers: tasks completed today → coin multiplier
COMBO_COIN_MULTS: list[tuple[int, float]] = [
    (5, 1.5),
    (4, 1.3),
    (3, 1.2),
    (2, 1.1),
    (1, 1.0),
    (0, 1.0),
]


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class GameEvent:
    coins_earned: int = 0
    xp_earned: int = 0
    streak_days: int = 0
    streak_lost: bool = False
    streak_lost_previous: int = 0
    new_stage: int | None = None
    stage_name_ru: str | None = None
    stage_name_en: str | None = None
    perfect_day: bool = False
    achievements_unlocked: list[dict] = field(default_factory=list)
    daily_cap_reached: bool = False
    combo_count: int = 0
    combo_multiplier: float = 1.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_streak_mult(
    streak_days: int, table: list[tuple[int, float, float]], is_premium: bool
) -> float:
    for min_days, free_m, prem_m in table:
        if streak_days >= min_days:
            return prem_m if is_premium else free_m
    return 1.0


def _get_combo_mult(combo_count: int) -> float:
    for min_count, mult in COMBO_COIN_MULTS:
        if combo_count >= min_count:
            return mult
    return 1.0


def _compute_stage(xp: int) -> int:
    stage = 1
    for i, threshold in enumerate(EVOLUTION_THRESHOLDS):
        if xp >= threshold:
            stage = i + 1
    return min(stage, 5)


def _user_today(tz_name: str) -> date:
    """Get today's date in the user's timezone."""
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo(tz_name)).date()
    except Exception:
        return datetime.now(UTC).date()


# ---------------------------------------------------------------------------
# Main award function
# ---------------------------------------------------------------------------

async def award_task_completion(
    session: AsyncSession,
    user_id: int,
    task: Task,
    is_premium: bool,
    user_tz: str = "UTC",
) -> GameEvent:
    """Award coins and XP when a task is marked done. Returns game events."""
    event = GameEvent()
    today = _user_today(user_tz)

    # Get or create game profile
    profile = await session.get(GameProfile, user_id)
    if profile is None:
        profile = GameProfile(user_id=user_id)
        session.add(profile)
        await session.flush()

    # --- Anti-abuse checks ---
    if len(task.title.strip()) < MIN_TITLE_LENGTH:
        return event

    if task.done_at and task.created_at:
        lifetime = (task.done_at - task.created_at).total_seconds()
        if lifetime < MIN_LIFETIME_SECONDS:
            return event

    # Deduplication: same title same day (timezone-aware range)
    try:
        from zoneinfo import ZoneInfo
        tz = ZoneInfo(user_tz)
    except Exception:
        tz = UTC
    day_start_utc = datetime.combine(today, datetime.min.time(), tzinfo=tz).astimezone(UTC)
    day_end_utc = day_start_utc + timedelta(days=1)
    dup_count = (
        await session.execute(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.title == task.title,
                Task.is_done.is_(True),
                Task.id != task.id,
                Task.done_at >= day_start_utc,
                Task.done_at < day_end_utc,
            )
        )
    ).scalar_one()
    if dup_count > 0:
        return event

    # --- Update streak ---
    previous_streak = profile.streak_days
    if profile.last_streak_date is None:
        profile.streak_days = 1
    elif profile.last_streak_date == today:
        pass  # already counted today
    elif profile.last_streak_date == today - timedelta(days=1):
        profile.streak_days += 1
    else:
        event.streak_lost = True
        event.streak_lost_previous = previous_streak
        profile.streak_days = 1
    profile.last_streak_date = today

    event.streak_days = profile.streak_days

    # --- Reset daily cap if new day ---
    if profile.daily_coins_date != today:
        profile.daily_coins_earned = 0
        profile.daily_coins_date = today

    # --- Combo tracking ---
    if profile.combo_date != today:
        profile.combo_count = 0
        profile.combo_date = today
    combo_mult = _get_combo_mult(profile.combo_count)
    profile.combo_count += 1
    event.combo_count = profile.combo_count
    event.combo_multiplier = combo_mult

    # --- Calculate base coins ---
    base_coins = PRIORITY_COINS.get(task.priority, 5)

    # On-time bonus
    is_ontime = False
    if task.due_at and task.done_at and task.done_at <= task.due_at:
        base_coins += ONTIME_BONUS
        is_ontime = True

    # --- Get active pet for rarity multiplier ---
    active_pet: GamePet | None = None
    if profile.active_pet_id:
        active_pet = await session.get(GamePet, profile.active_pet_id)

    rarity = active_pet.rarity if active_pet else "common"

    # --- Coin multipliers ---
    streak_coin_m = _get_streak_mult(profile.streak_days, STREAK_COIN_MULTS, is_premium)
    rarity_coin_m = RARITY_COIN_MULTS.get(rarity, (1.0, 1.0))
    rarity_coin = rarity_coin_m[1] if is_premium else rarity_coin_m[0]
    premium_bonus = PREMIUM_COIN_BONUS if is_premium else 1.0

    final_coins = math.floor(base_coins * streak_coin_m * premium_bonus * rarity_coin * combo_mult)

    # --- Daily cap ---
    daily_cap = PREMIUM_DAILY_CAP if is_premium else FREE_DAILY_CAP
    remaining_cap = max(0, daily_cap - profile.daily_coins_earned)
    if final_coins > remaining_cap:
        final_coins = remaining_cap
        event.daily_cap_reached = True

    # --- XP multipliers ---
    streak_xp_m = _get_streak_mult(profile.streak_days, STREAK_XP_MULTS, is_premium)
    rarity_xp_m = RARITY_XP_MULTS.get(rarity, (1.0, 1.0))
    rarity_xp = rarity_xp_m[1] if is_premium else rarity_xp_m[0]
    final_xp = math.floor(base_coins * streak_xp_m * rarity_xp)

    # --- Apply ---
    profile.coins += final_coins
    profile.total_coins_earned += final_coins
    profile.daily_coins_earned += final_coins
    event.coins_earned = final_coins
    event.xp_earned = final_xp

    # Update stats
    profile.tasks_completed_total += 1
    if is_ontime:
        profile.tasks_ontime_total += 1
    if task.priority == 3:
        profile.tasks_high_priority_total += 1

    # --- XP to active pet ---
    if active_pet:
        old_stage = active_pet.stage
        active_pet.xp += final_xp
        new_stage = _compute_stage(active_pet.xp)
        if new_stage > old_stage:
            active_pet.stage = new_stage
            event.new_stage = new_stage
            idx = new_stage - 1
            event.stage_name_ru = STAGE_NAMES_RU[idx] if idx < len(STAGE_NAMES_RU) else None
            event.stage_name_en = STAGE_NAMES_EN[idx] if idx < len(STAGE_NAMES_EN) else None

    # --- Check perfect day ---
    # Count all tasks due today that are not done yet
    undone_today = (
        await session.execute(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.due_date == today,
                Task.is_done.is_(False),
                Task.archived_at.is_(None),
            )
        )
    ).scalar_one()

    done_today = (
        await session.execute(
            select(func.count(Task.id)).where(
                Task.user_id == user_id,
                Task.due_date == today,
                Task.is_done.is_(True),
                Task.archived_at.is_(None),
            )
        )
    ).scalar_one()

    if undone_today == 0 and done_today > 0 and profile.last_perfect_day_date != today:
        event.perfect_day = True
        profile.perfect_days_count += 1
        profile.last_perfect_day_date = today
        # Perfect day bonus (not subject to daily cap)
        perfect_coins = math.floor(
            PERFECT_DAY_BONUS * streak_coin_m * premium_bonus * rarity_coin
        )
        profile.coins += perfect_coins
        profile.total_coins_earned += perfect_coins
        event.coins_earned += perfect_coins
        if active_pet:
            perfect_xp = math.floor(PERFECT_DAY_BONUS * streak_xp_m * rarity_xp)
            active_pet.xp += perfect_xp
            event.xp_earned += perfect_xp
            new_stage = _compute_stage(active_pet.xp)
            if new_stage > active_pet.stage:
                active_pet.stage = new_stage
                event.new_stage = new_stage
                idx = new_stage - 1
                event.stage_name_ru = (
                    STAGE_NAMES_RU[idx] if idx < len(STAGE_NAMES_RU) else None
                )
                event.stage_name_en = (
                    STAGE_NAMES_EN[idx] if idx < len(STAGE_NAMES_EN) else None
                )

    # --- Check achievements ---
    event.achievements_unlocked = await _check_achievements(session, profile)

    return event


# ---------------------------------------------------------------------------
# Achievements checker
# ---------------------------------------------------------------------------

_CONDITION_MAP = {
    "tasks_done": "tasks_completed_total",
    "streak": "streak_days",
    "perfect_days": "perfect_days_count",
    "ontime": "tasks_ontime_total",
    "high_priority": "tasks_high_priority_total",
    "items_bought": "items_purchased_total",
}


async def _check_achievements(
    session: AsyncSession, profile: GameProfile
) -> list[dict]:
    """Check and unlock any new achievements. Returns list of newly unlocked."""
    already = set(
        (
            await session.execute(
                select(GameUserAchievement.achievement_id).where(
                    GameUserAchievement.user_id == profile.user_id
                )
            )
        ).scalars().all()
    )

    all_achievements = (
        await session.execute(select(GameAchievement).order_by(GameAchievement.sort_order))
    ).scalars().all()

    newly_unlocked: list[dict] = []

    for ach in all_achievements:
        if ach.id in already:
            continue
        attr_name = _CONDITION_MAP.get(ach.condition_type)
        if attr_name is None:
            continue
        current_value = getattr(profile, attr_name, 0)
        if current_value >= ach.condition_value:
            session.add(
                GameUserAchievement(user_id=profile.user_id, achievement_id=ach.id)
            )
            profile.coins += ach.reward_coins
            profile.total_coins_earned += ach.reward_coins
            newly_unlocked.append({
                "slug": ach.slug,
                "name_ru": ach.name_ru,
                "name_en": ach.name_en,
                "icon": ach.icon,
                "reward_coins": ach.reward_coins,
            })

    return newly_unlocked


# ---------------------------------------------------------------------------
# Hatch egg
# ---------------------------------------------------------------------------

async def hatch_egg(
    session: AsyncSession, user_id: int, egg_slug: str
) -> GamePet:
    """Hatch an egg and create a new pet. Returns the new pet."""
    drops = (
        await session.execute(
            select(GameEggDrop).where(GameEggDrop.egg_slug == egg_slug)
        )
    ).scalars().all()

    if not drops:
        raise ValueError(f"Unknown egg: {egg_slug}")

    # Weighted random selection
    total_weight = sum(d.weight for d in drops)
    roll = random.randint(1, total_weight)
    cumulative = 0
    chosen = drops[0]
    for drop in drops:
        cumulative += drop.weight
        if roll <= cumulative:
            chosen = drop
            break

    pet = GamePet(
        user_id=user_id,
        character_type=chosen.character_type,
        rarity=chosen.rarity,
        xp=0,
        stage=1,
    )
    session.add(pet)
    await session.flush()

    # If user has no active pet, set this one
    profile = await session.get(GameProfile, user_id)
    if profile and profile.active_pet_id is None:
        profile.active_pet_id = pet.id

    return pet


# ---------------------------------------------------------------------------
# Daily Quests
# ---------------------------------------------------------------------------

QUEST_POOL: list[dict] = [
    {
        "slug": "complete_3_tasks",
        "desc_ru": "Выполни 3 задачи",
        "desc_en": "Complete 3 tasks",
        "target": 3,
        "reward": 20,
        "condition": "tasks_done_today",
    },
    {
        "slug": "complete_5_tasks",
        "desc_ru": "Выполни 5 задач",
        "desc_en": "Complete 5 tasks",
        "target": 5,
        "reward": 35,
        "condition": "tasks_done_today",
    },
    {
        "slug": "complete_high_priority",
        "desc_ru": "Выполни важную задачу",
        "desc_en": "Complete a high priority task",
        "target": 1,
        "reward": 25,
        "condition": "high_priority_today",
    },
    {
        "slug": "complete_2_on_time",
        "desc_ru": "Выполни 2 задачи вовремя",
        "desc_en": "Complete 2 tasks on time",
        "target": 2,
        "reward": 30,
        "condition": "ontime_today",
    },
    {
        "slug": "keep_streak",
        "desc_ru": "Сохрани серию",
        "desc_en": "Keep your streak",
        "target": 1,
        "reward": 15,
        "condition": "streak_active",
    },
    {
        "slug": "perfect_day",
        "desc_ru": "Идеальный день",
        "desc_en": "Perfect day",
        "target": 1,
        "reward": 50,
        "condition": "perfect_day",
    },
    {
        "slug": "earn_combo",
        "desc_ru": "Достигни комбо x3",
        "desc_en": "Reach combo x3",
        "target": 3,
        "reward": 25,
        "condition": "combo_today",
    },
]

REROLL_COST = 10


async def generate_daily_quests(
    session: AsyncSession, user_id: int, today: date
) -> list[GameDailyQuest]:
    """Generate 3 random daily quests for a user if they don't exist yet."""
    existing = (
        await session.execute(
            select(GameDailyQuest).where(
                GameDailyQuest.user_id == user_id,
                GameDailyQuest.quest_date == today,
            )
        )
    ).scalars().all()

    if existing:
        return list(existing)

    chosen = random.sample(QUEST_POOL, min(3, len(QUEST_POOL)))
    quests: list[GameDailyQuest] = []
    for q in chosen:
        quest = GameDailyQuest(
            user_id=user_id,
            quest_slug=q["slug"],
            target_value=q["target"],
            reward_coins=q["reward"],
            quest_date=today,
        )
        session.add(quest)
        quests.append(quest)

    await session.flush()
    return quests


def get_quest_description(slug: str) -> tuple[str, str]:
    """Return (desc_ru, desc_en) for a quest slug."""
    for q in QUEST_POOL:
        if q["slug"] == slug:
            return q["desc_ru"], q["desc_en"]
    return "Квест", "Quest"


def get_quest_condition(slug: str) -> str:
    """Return the condition type for a quest slug."""
    for q in QUEST_POOL:
        if q["slug"] == slug:
            return q["condition"]
    return ""


async def update_quest_progress(
    session: AsyncSession,
    user_id: int,
    today: date,
    profile: GameProfile,
    tasks_done_today: int,
    high_priority_today: int,
    ontime_today: int,
    is_perfect_day: bool,
) -> list[GameDailyQuest]:
    """Update progress on all daily quests. Returns newly completed quests."""
    quests = (
        await session.execute(
            select(GameDailyQuest).where(
                GameDailyQuest.user_id == user_id,
                GameDailyQuest.quest_date == today,
                GameDailyQuest.is_completed.is_(False),
            )
        )
    ).scalars().all()

    completed: list[GameDailyQuest] = []
    combo = profile.combo_count if profile.combo_date == today else 0

    for q in quests:
        condition = get_quest_condition(q.quest_slug)
        if condition == "tasks_done_today":
            q.progress = min(tasks_done_today, q.target_value)
        elif condition == "high_priority_today":
            q.progress = min(high_priority_today, q.target_value)
        elif condition == "ontime_today":
            q.progress = min(ontime_today, q.target_value)
        elif condition == "streak_active":
            q.progress = 1 if profile.streak_days >= 1 else 0
        elif condition == "perfect_day":
            q.progress = 1 if is_perfect_day else 0
        elif condition == "combo_today":
            q.progress = min(combo, q.target_value)

        if q.progress >= q.target_value and not q.is_completed:
            q.is_completed = True
            profile.coins += q.reward_coins
            profile.total_coins_earned += q.reward_coins
            completed.append(q)

    return completed


# ---------------------------------------------------------------------------
# Lucky Spin
# ---------------------------------------------------------------------------

SPIN_REWARDS: list[tuple[dict, int]] = [
    ({"type": "coins", "amount": 5, "ru": "+5 монет", "en": "+5 coins"}, 30),
    ({"type": "coins", "amount": 10, "ru": "+10 монет", "en": "+10 coins"}, 25),
    ({"type": "coins", "amount": 25, "ru": "+25 монет", "en": "+25 coins"}, 15),
    ({"type": "coins", "amount": 50, "ru": "+50 монет", "en": "+50 coins"}, 8),
    ({"type": "coins", "amount": 100, "ru": "+100 монет", "en": "+100 coins"}, 2),
    ({"type": "xp", "amount": 10, "ru": "+10 XP", "en": "+10 XP"}, 10),
    ({"type": "xp", "amount": 25, "ru": "+25 XP", "en": "+25 XP"}, 7),
    ({"type": "xp", "amount": 50, "ru": "+50 XP", "en": "+50 XP"}, 3),
]


def spin_wheel() -> dict:
    """Spin the lucky wheel and return a reward."""
    total = sum(w for _, w in SPIN_REWARDS)
    roll = random.randint(1, total)
    cumulative = 0
    for reward, weight in SPIN_REWARDS:
        cumulative += weight
        if roll <= cumulative:
            return reward
    return SPIN_REWARDS[0][0]
