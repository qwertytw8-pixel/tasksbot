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
    priority: int = Field(default=0, ge=0, le=3)
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
    priority: int
    is_done: bool
    done_at: datetime | None
    archived_at: datetime | None
    created_at: datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tz: str


class UserUpdate(BaseModel):
    tz: str | None = Field(default=None, max_length=64)


class PrivacyInfo(BaseModel):
    support_label: str
    support_text: str
    privacy_summary: str
