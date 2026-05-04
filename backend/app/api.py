from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import TelegramUser, get_telegram_user_factory
from app.config import get_settings
from app.db import Category, Reminder, Task, User, get_session
from app.game import award_task_completion
from app.schemas import (
    CategoryIn,
    CategoryOut,
    PrivacyInfo,
    TaskIn,
    TaskOut,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/api", tags=["api"])

SUPPORT_LABEL = "Поддержка и приватность"
SUPPORT_TEXT = (
    "Если что-то не работает, напиши владельцу бота. Данные внутри Mini App хранятся отдельно "
    "для каждого Telegram-пользователя."
)
PRIVACY_SUMMARY = (
    "У каждого пользователя свои задачи, категории и подзадачи. Доступ к данным проверяется "
    "по Telegram initData и user id — чужие записи не смешиваются и не показываются другим."
)


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
        user = await session.get(User, tg.id)
        assert user is not None
    return user


def _date_to_due_at(value: date | None) -> datetime | None:
    if value is None:
        return None
    return datetime(value.year, value.month, value.day, tzinfo=UTC)


def _normalize_task_fields(
    payload: TaskIn,
) -> tuple[date | None, bool, datetime | None, int | None]:
    due_date = payload.due_date
    has_time = payload.has_time
    due_at = payload.due_at
    remind = payload.remind_minutes_before

    if due_at is not None:
        due_at = (
            due_at.replace(tzinfo=UTC) if due_at.tzinfo is None else due_at.astimezone(UTC)
        )
        due_date = due_at.date()
        has_time = True
    elif due_date is not None:
        due_at = _date_to_due_at(due_date) if has_time else None
    else:
        has_time = False
        due_at = None
        remind = None

    if not has_time:
        due_at = None
        remind = None

    return due_date, has_time, due_at, remind


async def _validate_category(
    session: AsyncSession, tg: TelegramUser, category_id: int | None
) -> None:
    if category_id is None:
        return
    cat = await session.get(Category, category_id)
    if cat is None or cat.user_id != tg.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad category_id")


async def _validate_parent(
    session: AsyncSession,
    tg: TelegramUser,
    task_id: int | None,
    parent_task_id: int | None,
) -> None:
    if parent_task_id is None:
        return
    parent = await session.get(Task, parent_task_id)
    if parent is None or parent.user_id != tg.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "bad parent_task_id")
    if task_id is not None and parent.id == task_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "task cannot be its own parent")


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
    if payload.onboarding_completed is not None:
        user.onboarding_completed = payload.onboarding_completed
    await session.commit()
    await session.refresh(user)
    return user


@router.get("/privacy", response_model=PrivacyInfo)
async def get_privacy_info(
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
) -> PrivacyInfo:
    await _ensure_user(session, tg)
    return PrivacyInfo(
        support_label=SUPPORT_LABEL,
        support_text=SUPPORT_TEXT,
        privacy_summary=PRIVACY_SUMMARY,
    )


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


async def _sync_reminders(session: AsyncSession, task: Task) -> None:
    await session.execute(delete(Reminder).where(Reminder.task_id == task.id))
    if (
        task.due_at
        and task.remind_minutes_before is not None
        and not task.is_done
        and task.archived_at is None
    ):
        fire_at = task.due_at - timedelta(minutes=task.remind_minutes_before)
        session.add(Reminder(task_id=task.id, fire_at=fire_at))


AUTO_ARCHIVE_AFTER = timedelta(hours=24)


async def _auto_archive_old_done(session: AsyncSession, user_id: int) -> None:
    """Move done-tasks older than 24h into the archive (set archived_at)."""
    cutoff = datetime.now(UTC) - AUTO_ARCHIVE_AFTER
    await session.execute(
        update(Task)
        .where(
            Task.user_id == user_id,
            Task.is_done.is_(True),
            Task.archived_at.is_(None),
            Task.done_at.is_not(None),
            Task.done_at < cutoff,
        )
        .values(archived_at=datetime.now(UTC))
    )
    # Drop any pending reminders for those archived tasks.
    await session.execute(
        delete(Reminder).where(
            Reminder.task_id.in_(
                select(Task.id).where(
                    Task.user_id == user_id,
                    Task.archived_at.is_not(None),
                    Reminder.sent.is_(False),
                )
            )
        )
    )


@router.get("/tasks", response_model=list[TaskOut])
async def list_tasks(
    done: bool | None = None,
    day: date | None = None,
    parent_id: int | None = None,
    top_level: bool | None = None,
    archived: bool | None = None,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_user(session, tg)
    await _auto_archive_old_done(session, tg.id)
    await session.commit()
    stmt = (
        select(Task)
        .options(selectinload(Task.children))
        .where(Task.user_id == tg.id)
        .order_by(
            Task.due_date.is_(None),
            Task.due_date,
            Task.due_at.is_(None),
            Task.due_at,
            Task.created_at.desc(),
        )
    )
    if archived is True:
        stmt = stmt.where(Task.archived_at.is_not(None)).order_by(Task.archived_at.desc())
    else:
        stmt = stmt.where(Task.archived_at.is_(None))
    if done is not None:
        stmt = stmt.where(Task.is_done == done)
    if day is not None:
        stmt = stmt.where(Task.due_date == day)
    if parent_id is not None:
        stmt = stmt.where(Task.parent_task_id == parent_id)
    elif top_level:
        stmt = stmt.where(Task.parent_task_id.is_(None))
    rows = await session.execute(stmt)
    return list(rows.scalars())


@router.post("/tasks", response_model=TaskOut, status_code=201)
async def create_task(
    payload: TaskIn,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    await _ensure_user(session, tg)
    await _validate_category(session, tg, payload.category_id)
    await _validate_parent(session, tg, None, payload.parent_task_id)
    due_date, has_time, due_at, remind = _normalize_task_fields(payload)

    task = Task(
        user_id=tg.id,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        parent_task_id=payload.parent_task_id,
        due_date=due_date,
        has_time=has_time,
        due_at=due_at,
        remind_minutes_before=remind,
        priority=payload.priority,
        is_done=payload.is_done,
        done_at=datetime.now(UTC) if payload.is_done else None,
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

    await _validate_category(session, tg, payload.category_id)
    await _validate_parent(session, tg, task_id, payload.parent_task_id)
    due_date, has_time, due_at, remind = _normalize_task_fields(payload)

    task.title = payload.title
    task.description = payload.description
    task.category_id = payload.category_id
    task.parent_task_id = payload.parent_task_id
    task.due_date = due_date
    task.has_time = has_time
    task.due_at = due_at
    task.remind_minutes_before = remind
    task.priority = payload.priority
    # Track when a task was marked done so we can auto-archive later.
    was_done = task.is_done
    if payload.is_done and not task.is_done:
        task.done_at = datetime.now(UTC)
    elif not payload.is_done:
        task.done_at = None
    task.is_done = payload.is_done
    await session.flush()
    await _sync_reminders(session, task)

    # Award coins/XP if task just completed
    if payload.is_done and not was_done:
        user = await session.get(User, tg.id)
        user_tz = user.tz if user else "UTC"
        is_premium = False  # TODO: integrate with subscription
        await award_task_completion(
            session, tg.id, task, is_premium=is_premium, user_tz=user_tz
        )

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


@router.post("/tasks/{task_id}/archive", response_model=TaskOut)
async def archive_task(
    task_id: int,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    task = await session.get(Task, task_id)
    if task is None or task.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "task not found")
    if task.archived_at is None:
        task.archived_at = datetime.now(UTC)
    await session.flush()
    await _sync_reminders(session, task)
    await session.commit()
    await session.refresh(task)
    return task


@router.post("/tasks/{task_id}/unarchive", response_model=TaskOut)
async def unarchive_task(
    task_id: int,
    tg: TelegramUser = Depends(_get_dep()),
    session: AsyncSession = Depends(get_session),
):
    task = await session.get(Task, task_id)
    if task is None or task.user_id != tg.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "task not found")
    task.archived_at = None
    await session.flush()
    await _sync_reminders(session, task)
    await session.commit()
    await session.refresh(task)
    return task
