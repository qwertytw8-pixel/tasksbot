from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    color: str | None = Field(default=None, max_length=16)
    emoji: str | None = Field(default=None, max_length=16)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    color: str | None
    emoji: str | None


class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    category_id: int | None = None
    parent_task_id: int | None = None
    due_date: date | None = None
    has_time: bool = False
    due_at: datetime | None = None
    remind_minutes_before: int | None = Field(default=None, ge=0, le=10_080)
    is_done: bool = False


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    category_id: int | None
    parent_task_id: int | None
    due_date: date | None
    has_time: bool
    due_at: datetime | None
    remind_minutes_before: int | None
    is_done: bool
    done_at: datetime | None
    archived_at: datetime | None
    created_at: datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tz: str
    is_admin: bool = False


class UserUpdate(BaseModel):
    tz: str | None = Field(default=None, max_length=64)


class PrivacyInfo(BaseModel):
    support_label: str
    support_text: str
    privacy_summary: str


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plan: str
    started_at: datetime
    expires_at: datetime | None
    is_active: bool
    source: str


class SubscriptionStatus(BaseModel):
    is_premium: bool
    subscription: SubscriptionOut | None = None
    active_tasks_count: int = 0
    max_tasks: int = 5
    can_create_categories: bool = False


class PlanInfo(BaseModel):
    name: str
    price_stars: int
    features: list[str]


class PlansOut(BaseModel):
    free: PlanInfo
    premium: PlanInfo


class PromoActivateIn(BaseModel):
    code: str = Field(min_length=1, max_length=64)


class PromoActivateOut(BaseModel):
    success: bool
    message: str
    expires_at: datetime | None = None


class PromoCodeIn(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    duration_days: int = Field(default=14, ge=1, le=365)
    max_uses: int = Field(default=1, ge=1, le=100_000)


class PromoCodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    duration_days: int
    max_uses: int
    current_uses: int
    is_active: bool
    created_at: datetime


class AdminStatsOut(BaseModel):
    total_users: int
    premium_users: int
    total_tasks: int
    total_promo_codes: int
    total_promo_activations: int


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tz: str
    is_admin: bool
    created_at: datetime
    is_premium: bool = False
    subscription_expires: datetime | None = None


class AdminGrantIn(BaseModel):
    user_id: int
    duration_days: int | None = None  # None = unlimited
