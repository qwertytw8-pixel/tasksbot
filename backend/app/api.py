from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import TelegramUser, get_telegram_user_factory
from app.config import get_settings
from app.db import Category, Reminder, Task, User, get_session
from app.schemas import (
    CategoryIn,
    CategoryOut,
    TaskIn,
    TaskOut,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/api", tags=["api"])


def _get_dep():
    return get_telegram_user_factory(get_settings().bot_token)


DEFAULT_CATEGORIES: list[tuple[str, str, str]] = [
    ("Работа", "#3B82F6", "💼"),
    ("Личное", "#10B981", "🌿"),
    ("Учёба", "#F59E0B", "📚"),
    ("Созвоны", "#8B5CF6", "📞"),
]


async def _ensure_user(session: AsyncSession, tg: TelegramUser) -> User:
    user = await session.get(User, tg.id)
    if user is None:
        user = User(id=tg.id)
        session.add(user)
        for name, color, emoji in DEFAULT_CATEGORIES:
            session.add(Category(user_id=tg.id, name=name, color=color, emoji=emoji))
        await session.commit()
        # re-fetch
        user = await session.get(User, tg.id)
        assert user is not None
    return user


# -------------------- /me --------------------


@router.get("/me", response_model=UserOut)
async def get_me(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> User:
    return await _ensure_user(session, tg)


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> User:
    user = await _ensure_user(session, tg)
    if payload.tz is not None:
        user.tz = payload.tz
    await session.commit()
    await session.refresh(user)
    return user


# -------------------- categories --------------------


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_user(session, tg)
    rows = await session.execute(
        select(Category).where(Category.user_id == tg.id).order_by(Category.id)
    )
    return list(rows.scalars())


@router.post("/categories", response_model=CategoryOut, status_code=201)
async def create_category(
    payload: CategoryIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_user(session, tg)
    cat = Category(user_id=tg.id, name=payload.name, color=payload.color, emoji=payload.emoji)
    session.add(cat)
    try:
        await session.commit()
    except Exception:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "category already exists") from None
    await session.refresh(cat)
    return cat


@router.patch("/categories/{cat_id}", response_model=CategoryOut)
async def update_category(
    cat_id: int,
    payload: CategoryIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    cat = await session.get(Category, cat_id)
    if cat is None or cat.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "category not found")
    cat.name = payload.name
    cat.color = payload.color
    cat.emoji = payload.emoji
    await session.commit()
    await session.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", status_code=204)
async def delete_category(
    cat_id: int,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    cat = await session.get(Category, cat_id)
    if cat is None or cat.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "category not found")
    await session.delete(cat)
    await session.commit()


# -------------------- tasks --------------------


def _due_to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


async def _sync_reminders(session: AsyncSession, task: Task) -> None:
    """Recreate reminders for a task based on due_at + remind_minutes_before."""
    await session.execute(delete(Reminder).where(Reminder.task_id == task.id))
    if task.due_at and task.remind_minutes_before is not None and not task.is_done:
        fire_at = task.due_at - timedelta(minutes=task.remind_minutes_before)
        session.add(Reminder(task_id=task.id, fire_at=fire_at))


@router.get("/tasks", response_model=list[TaskOut])
async def list_tasks(
    done: bool | None = None,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_user(session, tg)
    stmt = select(Task).where(Task.user_id == tg.id).order_by(
        Task.due_at.is_(None), Task.due_at, Task.created_at.desc()
    )
    if done is not None:
        stmt = stmt.where(Task.is_done == done)
    rows = await session.execute(stmt)
    return list(rows.scalars())


@router.post("/tasks", response_model=TaskOut, status_code=201)
async def create_task(
    payload: TaskIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_user(session, tg)
    if payload.category_id is not None:
        cat = await session.get(Category, payload.category_id)
        if cat is None or cat.user_id != tg.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad category_id")

    task = Task(
        user_id=tg.id,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        due_at=_due_to_utc(payload.due_at),
        remind_minutes_before=payload.remind_minutes_before,
        is_done=payload.is_done,
    )
    session.add(task)
    await session.flush()
    await _sync_reminders(session, task)
    await session.commit()
    await session.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: int,
    payload: TaskIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    task = await session.get(Task, task_id)
    if task is None or task.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "task not found")
    if payload.category_id is not None:
        cat = await session.get(Category, payload.category_id)
        if cat is None or cat.user_id != tg.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad category_id")

    task.title = payload.title
    task.description = payload.description
    task.category_id = payload.category_id
    task.due_at = _due_to_utc(payload.due_at)
    task.remind_minutes_before = payload.remind_minutes_before
    task.is_done = payload.is_done
    await session.flush()
    await _sync_reminders(session, task)
    await session.commit()
    await session.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    task = await session.get(Task, task_id)
    if task is None or task.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "task not found")
    await session.delete(task)
    await session.commit()
