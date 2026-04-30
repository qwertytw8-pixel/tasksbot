from collections.abc import AsyncIterator
from datetime import date, datetime
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.config import get_settings


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)  # telegram user id
    tz: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    categories: Mapped[list["Category"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_categories_user_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    color: Mapped[str | None] = mapped_column(String(16), nullable=True)
    emoji: Mapped[str | None] = mapped_column(String(16), nullable=True)

    user: Mapped[User] = relationship(back_populates="categories")
    tasks: Mapped[list["Task"]] = relationship(back_populates="category")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    parent_task_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    has_time: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    remind_minutes_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_done: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    done_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    user: Mapped[User] = relationship(back_populates="tasks")
    category: Mapped[Category | None] = relationship(back_populates="tasks")
    parent: Mapped["Task | None"] = relationship(remote_side="Task.id", back_populates="children")
    children: Mapped[list["Task"]] = relationship(back_populates="parent")
    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fire_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    task: Mapped[Task] = relationship(back_populates="reminders")


_engine = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def _normalize_async_url(url: str) -> str:
    """Coerce a libpq-style Postgres URL into one asyncpg can use.

    Neon and most managed Postgres providers hand out plain `postgresql://...`
    URLs with libpq-only parameters such as `sslmode=require` and
    `channel_binding=require`. SQLAlchemy's async engine needs an async driver,
    and asyncpg does not understand those parameters at all.
    """
    parsed = urlparse(url)
    scheme = parsed.scheme
    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+asyncpg"

    # Drop libpq-only query params that asyncpg rejects, translate `sslmode`.
    params = parse_qsl(parsed.query, keep_blank_values=True)
    libpq_only = {"channel_binding", "gssencmode", "target_session_attrs", "options"}
    new_params: list[tuple[str, str]] = []
    for k, v in params:
        if k in libpq_only:
            continue
        if k == "sslmode":
            new_params.append(("ssl", v))
            continue
        new_params.append((k, v))
    return urlunparse(parsed._replace(scheme=scheme, query=urlencode(new_params)))


def get_engine():
    global _engine, _sessionmaker
    if _engine is None:
        settings = get_settings()
        url = _normalize_async_url(settings.database_url)
        _engine = create_async_engine(url, pool_pre_ping=True)
        _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    if _sessionmaker is None:
        get_engine()
    assert _sessionmaker is not None
    return _sessionmaker


async def get_session() -> AsyncIterator[AsyncSession]:
    sm = get_sessionmaker()
    async with sm() as session:
        yield session


async def ensure_runtime_schema(conn: AsyncConnection) -> None:
    """Apply small additive schema updates without a full Alembic flow yet."""
    statements = [
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id INTEGER",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_time BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ",
        "CREATE INDEX IF NOT EXISTS ix_tasks_parent_task_id ON tasks (parent_task_id)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_due_date ON tasks (due_date)",
        "CREATE INDEX IF NOT EXISTS ix_tasks_archived_at ON tasks (archived_at)",
        (
            "UPDATE tasks SET "
            "due_date = COALESCE(due_date, CAST(due_at AT TIME ZONE 'UTC' AS DATE)), "
            "has_time = CASE WHEN due_at IS NOT NULL THEN TRUE ELSE has_time END"
        ),
    ]
    for stmt in statements:
        await conn.execute(text(stmt))
