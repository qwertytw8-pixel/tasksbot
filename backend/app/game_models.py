"""Game-related SQLAlchemy models for the Pet / Gamification feature."""

from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class GameProfile(Base):
    __tablename__ = "game_profiles"

    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_coins_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_streak_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    perfect_days_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_perfect_day_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    tasks_completed_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tasks_ontime_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tasks_high_priority_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    items_purchased_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    daily_coins_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    daily_coins_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    active_pet_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active_background_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    pets: Mapped[list["GamePet"]] = relationship(back_populates="profile")


class GamePet(Base):
    __tablename__ = "game_pets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    character_type: Mapped[str] = mapped_column(String(32), nullable=False)
    rarity: Mapped[str] = mapped_column(String(16), nullable=False)
    name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    stage: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    accessory_item_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hatched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    profile: Mapped[GameProfile] = relationship(
        back_populates="pets", foreign_keys=[user_id],
        primaryjoin="GamePet.user_id == GameProfile.user_id",
    )


class GameItem(Base):
    __tablename__ = "game_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name_ru: Mapped[str] = mapped_column(String(64), nullable=False)
    name_en: Mapped[str] = mapped_column(String(64), nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    image_path: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class GameInventory(Base):
    __tablename__ = "game_inventory"
    __table_args__ = (UniqueConstraint("user_id", "item_id", name="uq_game_inventory_user_item"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("game_items.id", ondelete="CASCADE"), nullable=False
    )
    purchased_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )


class GameAchievement(Base):
    __tablename__ = "game_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name_ru: Mapped[str] = mapped_column(String(64), nullable=False)
    name_en: Mapped[str] = mapped_column(String(64), nullable=False)
    description_ru: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(16), nullable=False)
    condition_type: Mapped[str] = mapped_column(String(32), nullable=False)
    condition_value: Mapped[int] = mapped_column(Integer, nullable=False)
    reward_coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class GameUserAchievement(Base):
    __tablename__ = "game_user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_game_user_achievement"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("game_achievements.id", ondelete="CASCADE"), nullable=False
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )


class GameEggDrop(Base):
    __tablename__ = "game_egg_drops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    egg_slug: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    character_type: Mapped[str] = mapped_column(String(32), nullable=False)
    rarity: Mapped[str] = mapped_column(String(16), nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
