"""Pydantic schemas for the game API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GameProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    coins: int
    total_coins_earned: int
    streak_days: int
    last_streak_date: str | None = None
    perfect_days_count: int
    tasks_completed_total: int
    daily_coins_earned: int
    daily_cap: int
    combo_count: int = 0
    combo_multiplier: float = 1.0
    active_pet: "GamePetOut | None" = None
    active_background_slug: str | None = None
    today_tasks_done: int = 0
    today_tasks_total: int = 0
    has_pet: bool = False


class GamePetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    character_type: str
    rarity: str
    name: str | None
    xp: int
    stage: int
    stage_name_ru: str
    stage_name_en: str
    xp_for_next: int
    xp_current_stage: int
    accessory_slug: str | None = None
    hatched_at: datetime


class HatchRequest(BaseModel):
    egg_slug: str = Field(min_length=1, max_length=64)


class HatchResponse(BaseModel):
    pet: GamePetOut
    character_name_ru: str
    character_name_en: str
    rarity_name_ru: str
    rarity_name_en: str


class RenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class BuyRequest(BaseModel):
    item_id: int


class EquipRequest(BaseModel):
    pet_id: int
    item_id: int | None = None


class SetBackgroundRequest(BaseModel):
    item_id: int | None = None


class GameItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name_ru: str
    name_en: str
    type: str
    image_path: str
    price: int
    is_premium: bool
    owned: bool = False
    equipped: bool = False


class GameAchievementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name_ru: str
    name_en: str
    description_ru: str
    description_en: str
    icon: str
    condition_type: str
    condition_value: int
    reward_coins: int
    tier: str = "bronze"
    unlocked: bool = False
    unlocked_at: datetime | None = None
    progress: int = 0


class DailyRewardStatus(BaseModel):
    current_day: int = 0
    claimed_today: bool = False
    rewards: list[int] = []


class DailyRewardClaim(BaseModel):
    coins_earned: int
    current_day: int
    next_reward: int | None = None


class DeletePetResponse(BaseModel):
    deleted: bool = True
    message: str = "pet deleted"


class GameEventOut(BaseModel):
    coins_earned: int = 0
    xp_earned: int = 0
    streak_days: int = 0
    streak_lost: bool = False
    streak_lost_previous: int = 0
    new_stage: int | None = None
    stage_name_ru: str | None = None
    stage_name_en: str | None = None
    perfect_day: bool = False
    achievements_unlocked: list[dict] = []
    daily_cap_reached: bool = False
    combo_count: int = 0
    combo_multiplier: float = 1.0


class ReportOut(BaseModel):
    period: str
    period_start: str
    period_end: str
    tasks_completed: int
    tasks_created: int
    tasks_on_time: int
    tasks_high_priority: int
    current_streak: int
    total_coins: int
    perfect_days_total: int
    tasks_completed_total: int
