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
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    premium_interest_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notif_interest_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trial_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    trial_ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    trial_ending_notified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trial_expired_notified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trial_last_call_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    categories: Mapped[list["Category"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    promo_activations: Mapped[list["PromoActivation"]] = relationship(
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
    recurrence: Mapped[str | None] = mapped_column(
        String(16), nullable=True
    )  # "daily", "weekly", "monthly" or null
    priority: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )  # 0=none, 1=low, 2=medium, 3=high
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


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan: Mapped[str] = mapped_column(String(16), nullable=False, default="premium")
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    source: Mapped[str] = mapped_column(
        String(16), nullable=False, default="stars"
    )  # stars / promo / admin_grant
    stars_payment_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    notif_3d_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notif_0d_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notif_discount_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    notif_post_expiry_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    user: Mapped[User] = relationship(back_populates="subscriptions")


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False, default=14)
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    current_uses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )
    created_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    activations: Mapped[list["PromoActivation"]] = relationship(
        back_populates="promo", cascade="all, delete-orphan"
    )


class PromoActivation(Base):
    __tablename__ = "promo_activations"
    __table_args__ = (
        UniqueConstraint("promo_id", "user_id", name="uq_promo_activation_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    promo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    activated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    promo: Mapped[PromoCode] = relationship(back_populates="activations")
    user: Mapped[User] = relationship(back_populates="promo_activations")


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
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0",
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        (
            "UPDATE tasks SET "
            "due_date = COALESCE(due_date, CAST(due_at AT TIME ZONE 'UTC' AS DATE)), "
            "has_time = CASE WHEN due_at IS NOT NULL THEN TRUE ELSE has_time END"
        ),
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence VARCHAR(16)",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE",
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " premium_interest_at TIMESTAMPTZ"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " notif_interest_sent BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        # Premium subscription tables
        (
            "CREATE TABLE IF NOT EXISTS subscriptions ("
            "  id SERIAL PRIMARY KEY,"
            "  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
            "  plan VARCHAR(16) NOT NULL DEFAULT 'premium',"
            "  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),"
            "  expires_at TIMESTAMPTZ,"
            "  is_active BOOLEAN NOT NULL DEFAULT TRUE,"
            "  source VARCHAR(16) NOT NULL DEFAULT 'stars',"
            "  stars_payment_id VARCHAR(128)"
            ")"
        ),
        "CREATE INDEX IF NOT EXISTS ix_subscriptions_user_id ON subscriptions (user_id)",
        (
            "CREATE TABLE IF NOT EXISTS promo_codes ("
            "  id SERIAL PRIMARY KEY,"
            "  code VARCHAR(64) NOT NULL UNIQUE,"
            "  duration_days INTEGER NOT NULL DEFAULT 14,"
            "  max_uses INTEGER NOT NULL DEFAULT 1,"
            "  current_uses INTEGER NOT NULL DEFAULT 0,"
            "  is_active BOOLEAN NOT NULL DEFAULT TRUE,"
            "  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),"
            "  created_by BIGINT"
            ")"
        ),
        (
            "CREATE TABLE IF NOT EXISTS promo_activations ("
            "  id SERIAL PRIMARY KEY,"
            "  promo_id INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,"
            "  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,"
            "  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),"
            "  UNIQUE(promo_id, user_id)"
            ")"
        ),
        "CREATE INDEX IF NOT EXISTS ix_promo_activations_promo_id ON promo_activations (promo_id)",
        "CREATE INDEX IF NOT EXISTS ix_promo_activations_user_id ON promo_activations (user_id)",
        (
            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS"
            " notif_3d_sent BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        (
            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS"
            " notif_0d_sent BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        (
            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS"
            " notif_discount_sent BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        (
            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS"
            " notif_post_expiry_sent BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        # Trial tracking fields on users
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " trial_started_at TIMESTAMPTZ"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " trial_ended_at TIMESTAMPTZ"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " trial_ending_notified BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " trial_expired_notified BOOLEAN NOT NULL DEFAULT FALSE"
        ),
        (
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS"
            " trial_last_call_sent BOOLEAN NOT NULL DEFAULT FALSE"
        ),
    ]
    for stmt in statements:
        await conn.execute(text(stmt))

    settings = get_settings()
    if settings.admin_user_id:
        await conn.execute(
            text(
                "UPDATE users SET is_admin = TRUE WHERE id = :uid AND is_admin = FALSE"
            ),
            {"uid": settings.admin_user_id},
        )
