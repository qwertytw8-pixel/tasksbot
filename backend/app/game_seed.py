"""Seed data for game items, achievements, and egg drops."""

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession

from app.game_models import GameAchievement, GameEggDrop, GameItem

ITEMS: list[dict] = [
    # --- Eggs ---
    {
        "slug": "egg_common", "name_ru": "Обычное яйцо", "name_en": "Common Egg",
        "type": "egg", "image_path": "/game/eggs/common.svg",
        "price": 0, "is_premium": False, "sort_order": 1,
    },
    {
        "slug": "egg_rare", "name_ru": "Редкое яйцо", "name_en": "Rare Egg",
        "type": "egg", "image_path": "/game/eggs/rare.svg",
        "price": 500, "is_premium": False, "sort_order": 2,
    },
    {
        "slug": "egg_epic", "name_ru": "Эпическое яйцо", "name_en": "Epic Egg",
        "type": "egg", "image_path": "/game/eggs/epic.svg",
        "price": 1500, "is_premium": False, "sort_order": 3,
    },
    # --- Accessories ---
    {
        "slug": "acc_cap", "name_ru": "Бейсболка", "name_en": "Baseball Cap",
        "type": "accessory", "image_path": "/game/acc/cap.svg",
        "price": 30, "is_premium": False, "sort_order": 10,
    },
    {
        "slug": "acc_glasses", "name_ru": "Очки", "name_en": "Glasses",
        "type": "accessory", "image_path": "/game/acc/glasses.svg",
        "price": 40, "is_premium": False, "sort_order": 11,
    },
    {
        "slug": "acc_bowtie", "name_ru": "Бантик", "name_en": "Bow Tie",
        "type": "accessory", "image_path": "/game/acc/bowtie.svg",
        "price": 35, "is_premium": False, "sort_order": 12,
    },
    {
        "slug": "acc_scarf", "name_ru": "Шарфик", "name_en": "Scarf",
        "type": "accessory", "image_path": "/game/acc/scarf.svg",
        "price": 50, "is_premium": False, "sort_order": 13,
    },
    {
        "slug": "acc_headphones", "name_ru": "Наушники", "name_en": "Headphones",
        "type": "accessory", "image_path": "/game/acc/headphones.svg",
        "price": 60, "is_premium": False, "sort_order": 14,
    },
    {
        "slug": "acc_crown", "name_ru": "Корона", "name_en": "Crown",
        "type": "accessory", "image_path": "/game/acc/crown.svg",
        "price": 100, "is_premium": False, "sort_order": 15,
    },
    {
        "slug": "acc_halo", "name_ru": "Нимб", "name_en": "Halo",
        "type": "accessory", "image_path": "/game/acc/halo.svg",
        "price": 120, "is_premium": True, "sort_order": 16,
    },
    {
        "slug": "acc_wings", "name_ru": "Крылья", "name_en": "Wings",
        "type": "accessory", "image_path": "/game/acc/wings.svg",
        "price": 150, "is_premium": True, "sort_order": 17,
    },
    {
        "slug": "acc_fire_aura", "name_ru": "Огненная аура", "name_en": "Fire Aura",
        "type": "accessory", "image_path": "/game/acc/fire_aura.svg",
        "price": 150, "is_premium": True, "sort_order": 18,
    },
    {
        "slug": "acc_rainbow", "name_ru": "Радужный шлейф", "name_en": "Rainbow Trail",
        "type": "accessory", "image_path": "/game/acc/rainbow.svg",
        "price": 120, "is_premium": True, "sort_order": 19,
    },
    # --- Backgrounds ---
    {
        "slug": "bg_meadow", "name_ru": "Поляна", "name_en": "Meadow",
        "type": "background", "image_path": "/game/bg/meadow.svg",
        "price": 0, "is_premium": False, "sort_order": 30,
    },
    {
        "slug": "bg_night", "name_ru": "Ночное небо", "name_en": "Night Sky",
        "type": "background", "image_path": "/game/bg/night.svg",
        "price": 50, "is_premium": False, "sort_order": 31,
    },
    {
        "slug": "bg_city", "name_ru": "Город", "name_en": "City",
        "type": "background", "image_path": "/game/bg/city.svg",
        "price": 80, "is_premium": False, "sort_order": 32,
    },
    {
        "slug": "bg_space", "name_ru": "Космос", "name_en": "Space",
        "type": "background", "image_path": "/game/bg/space.svg",
        "price": 120, "is_premium": True, "sort_order": 33,
    },
    {
        "slug": "bg_volcano", "name_ru": "Вулкан", "name_en": "Volcano",
        "type": "background", "image_path": "/game/bg/volcano.svg",
        "price": 150, "is_premium": True, "sort_order": 34,
    },
    {
        "slug": "bg_rainbow", "name_ru": "Радуга", "name_en": "Rainbow",
        "type": "background", "image_path": "/game/bg/rainbow.svg",
        "price": 100, "is_premium": False, "sort_order": 35,
    },
]

ACHIEVEMENTS: list[dict] = [
    # Tasks
    {
        "slug": "tasks_1", "icon": "\U0001f4cb",
        "name_ru": "Первые шаги", "name_en": "First Steps",
        "description_ru": "Выполни 1 задачу", "description_en": "Complete 1 task",
        "condition_type": "tasks_done", "condition_value": 1, "reward_coins": 10, "sort_order": 1,
    },
    {
        "slug": "tasks_10", "icon": "\U0001f4cb",
        "name_ru": "Разогрев", "name_en": "Warming Up",
        "description_ru": "Выполни 10 задач", "description_en": "Complete 10 tasks",
        "condition_type": "tasks_done", "condition_value": 10, "reward_coins": 25, "sort_order": 2,
    },
    {
        "slug": "tasks_50", "icon": "\U0001f4cb",
        "name_ru": "Трудяга", "name_en": "Hard Worker",
        "description_ru": "Выполни 50 задач", "description_en": "Complete 50 tasks",
        "condition_type": "tasks_done", "condition_value": 50, "reward_coins": 75, "sort_order": 3,
    },
    {
        "slug": "tasks_100", "icon": "\U0001f4cb",
        "name_ru": "Марафонец", "name_en": "Marathon Runner",
        "description_ru": "Выполни 100 задач", "description_en": "Complete 100 tasks",
        "condition_type": "tasks_done", "condition_value": 100,
        "reward_coins": 150, "sort_order": 4,
    },
    {
        "slug": "tasks_500", "icon": "\U0001f4cb",
        "name_ru": "Легенда", "name_en": "Legend",
        "description_ru": "Выполни 500 задач", "description_en": "Complete 500 tasks",
        "condition_type": "tasks_done", "condition_value": 500,
        "reward_coins": 500, "sort_order": 5,
    },
    # Streak
    {
        "slug": "streak_3", "icon": "\U0001f525",
        "name_ru": "На старте", "name_en": "Getting Started",
        "description_ru": "Серия 3 дня подряд", "description_en": "3-day streak",
        "condition_type": "streak", "condition_value": 3, "reward_coins": 15, "sort_order": 10,
    },
    {
        "slug": "streak_7", "icon": "\U0001f525",
        "name_ru": "Неделя огня", "name_en": "Week of Fire",
        "description_ru": "Серия 7 дней подряд", "description_en": "7-day streak",
        "condition_type": "streak", "condition_value": 7, "reward_coins": 50, "sort_order": 11,
    },
    {
        "slug": "streak_14", "icon": "\U0001f525",
        "name_ru": "Двухнедельный марафон", "name_en": "Two-Week Marathon",
        "description_ru": "Серия 14 дней подряд", "description_en": "14-day streak",
        "condition_type": "streak", "condition_value": 14, "reward_coins": 100, "sort_order": 12,
    },
    {
        "slug": "streak_30", "icon": "\U0001f525",
        "name_ru": "Месяц дисциплины", "name_en": "Month of Discipline",
        "description_ru": "Серия 30 дней подряд", "description_en": "30-day streak",
        "condition_type": "streak", "condition_value": 30, "reward_coins": 250, "sort_order": 13,
    },
    {
        "slug": "streak_60", "icon": "\U0001f525",
        "name_ru": "Несгибаемый", "name_en": "Unstoppable",
        "description_ru": "Серия 60 дней подряд", "description_en": "60-day streak",
        "condition_type": "streak", "condition_value": 60, "reward_coins": 500, "sort_order": 14,
    },
    # Perfect days
    {
        "slug": "perfect_1", "icon": "\u2b50",
        "name_ru": "Идеальный день", "name_en": "Perfect Day",
        "description_ru": "1 идеальный день", "description_en": "1 perfect day",
        "condition_type": "perfect_days", "condition_value": 1,
        "reward_coins": 15, "sort_order": 20,
    },
    {
        "slug": "perfect_7", "icon": "\u2b50",
        "name_ru": "Идеальная неделя", "name_en": "Perfect Week",
        "description_ru": "7 идеальных дней", "description_en": "7 perfect days",
        "condition_type": "perfect_days", "condition_value": 7,
        "reward_coins": 100, "sort_order": 21,
    },
    {
        "slug": "perfect_30", "icon": "\u2b50",
        "name_ru": "Перфекционист", "name_en": "Perfectionist",
        "description_ru": "30 идеальных дней", "description_en": "30 perfect days",
        "condition_type": "perfect_days", "condition_value": 30,
        "reward_coins": 300, "sort_order": 22,
    },
    # On-time
    {
        "slug": "ontime_5", "icon": "\u23f0",
        "name_ru": "Вовремя", "name_en": "On Time",
        "description_ru": "5 задач до дедлайна", "description_en": "5 tasks before deadline",
        "condition_type": "ontime", "condition_value": 5, "reward_coins": 20, "sort_order": 30,
    },
    {
        "slug": "ontime_25", "icon": "\u23f0",
        "name_ru": "Часовой механизм", "name_en": "Clockwork",
        "description_ru": "25 задач до дедлайна", "description_en": "25 tasks before deadline",
        "condition_type": "ontime", "condition_value": 25, "reward_coins": 80, "sort_order": 31,
    },
    {
        "slug": "ontime_100", "icon": "\u23f0",
        "name_ru": "Мастер времени", "name_en": "Time Master",
        "description_ru": "100 задач до дедлайна", "description_en": "100 tasks before deadline",
        "condition_type": "ontime", "condition_value": 100,
        "reward_coins": 200, "sort_order": 32,
    },
    # Priority
    {
        "slug": "priority_10", "icon": "\U0001f3af",
        "name_ru": "Важные дела", "name_en": "Important Matters",
        "description_ru": "10 задач с высоким приоритетом",
        "description_en": "10 high priority tasks",
        "condition_type": "high_priority", "condition_value": 10,
        "reward_coins": 40, "sort_order": 40,
    },
    {
        "slug": "priority_50", "icon": "\U0001f3af",
        "name_ru": "Приоритетный боец", "name_en": "Priority Fighter",
        "description_ru": "50 задач с высоким приоритетом",
        "description_en": "50 high priority tasks",
        "condition_type": "high_priority", "condition_value": 50,
        "reward_coins": 150, "sort_order": 41,
    },
    # Shop
    {
        "slug": "shop_1", "icon": "\U0001f6cd\ufe0f",
        "name_ru": "Первая покупка", "name_en": "First Purchase",
        "description_ru": "Купи 1 предмет", "description_en": "Buy 1 item",
        "condition_type": "items_bought", "condition_value": 1,
        "reward_coins": 10, "sort_order": 50,
    },
    {
        "slug": "shop_10", "icon": "\U0001f6cd\ufe0f",
        "name_ru": "Коллекционер", "name_en": "Collector",
        "description_ru": "Купи 10 предметов", "description_en": "Buy 10 items",
        "condition_type": "items_bought", "condition_value": 10,
        "reward_coins": 50, "sort_order": 51,
    },
]

EGG_DROPS: list[dict] = [
    # Common egg: 70% common, 25% rare, 5% epic
    {"egg_slug": "egg_common", "character_type": "cat", "rarity": "common", "weight": 70},
    {"egg_slug": "egg_common", "character_type": "fox", "rarity": "rare", "weight": 25},
    {"egg_slug": "egg_common", "character_type": "dragon", "rarity": "epic", "weight": 5},
    # Rare egg: 75% rare, 25% epic
    {"egg_slug": "egg_rare", "character_type": "fox", "rarity": "rare", "weight": 75},
    {"egg_slug": "egg_rare", "character_type": "dragon", "rarity": "epic", "weight": 25},
    # Epic egg: 100% epic
    {"egg_slug": "egg_epic", "character_type": "dragon", "rarity": "epic", "weight": 100},
]


async def ensure_game_schema(conn: AsyncConnection) -> None:
    """Create game tables if they don't exist (additive, no drops)."""
    stmts = [
        """
        CREATE TABLE IF NOT EXISTS game_profiles (
            user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            coins INTEGER NOT NULL DEFAULT 0,
            total_coins_earned INTEGER NOT NULL DEFAULT 0,
            streak_days INTEGER NOT NULL DEFAULT 0,
            last_streak_date DATE,
            perfect_days_count INTEGER NOT NULL DEFAULT 0,
            last_perfect_day_date DATE,
            tasks_completed_total INTEGER NOT NULL DEFAULT 0,
            tasks_ontime_total INTEGER NOT NULL DEFAULT 0,
            tasks_high_priority_total INTEGER NOT NULL DEFAULT 0,
            items_purchased_total INTEGER NOT NULL DEFAULT 0,
            daily_coins_earned INTEGER NOT NULL DEFAULT 0,
            daily_coins_date DATE,
            active_pet_id INTEGER,
            active_background_id INTEGER,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS game_pets (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            character_type VARCHAR(32) NOT NULL,
            rarity VARCHAR(16) NOT NULL,
            name VARCHAR(64),
            xp INTEGER NOT NULL DEFAULT 0,
            stage INTEGER NOT NULL DEFAULT 1,
            accessory_item_id INTEGER,
            hatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_game_pets_user_id ON game_pets (user_id)",
        """
        CREATE TABLE IF NOT EXISTS game_items (
            id SERIAL PRIMARY KEY,
            slug VARCHAR(64) UNIQUE NOT NULL,
            name_ru VARCHAR(64) NOT NULL,
            name_en VARCHAR(64) NOT NULL,
            type VARCHAR(16) NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            price INTEGER NOT NULL,
            is_premium BOOLEAN NOT NULL DEFAULT FALSE,
            sort_order INTEGER NOT NULL DEFAULT 0
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS game_inventory (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            item_id INTEGER NOT NULL REFERENCES game_items(id) ON DELETE CASCADE,
            purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(user_id, item_id)
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_game_inventory_user_id ON game_inventory (user_id)",
        """
        CREATE TABLE IF NOT EXISTS game_achievements (
            id SERIAL PRIMARY KEY,
            slug VARCHAR(64) UNIQUE NOT NULL,
            name_ru VARCHAR(64) NOT NULL,
            name_en VARCHAR(64) NOT NULL,
            description_ru VARCHAR(255) NOT NULL,
            description_en VARCHAR(255) NOT NULL,
            icon VARCHAR(16) NOT NULL,
            condition_type VARCHAR(32) NOT NULL,
            condition_value INTEGER NOT NULL,
            reward_coins INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS game_user_achievements (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            achievement_id INTEGER NOT NULL REFERENCES game_achievements(id) ON DELETE CASCADE,
            unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(user_id, achievement_id)
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_game_user_ach_user ON game_user_achievements (user_id)",
        """
        CREATE TABLE IF NOT EXISTS game_egg_drops (
            id SERIAL PRIMARY KEY,
            egg_slug VARCHAR(64) NOT NULL,
            character_type VARCHAR(32) NOT NULL,
            rarity VARCHAR(16) NOT NULL,
            weight INTEGER NOT NULL DEFAULT 1
        )
        """,
        "CREATE INDEX IF NOT EXISTS ix_game_egg_drops_slug ON game_egg_drops (egg_slug)",
    ]
    for s in stmts:
        await conn.execute(text(s))


async def seed_game_data(session: AsyncSession) -> None:
    """Insert seed data for items, achievements, and egg drops if missing."""
    # Items
    existing_items = set(
        (await session.execute(select(GameItem.slug))).scalars().all()
    )
    for item_data in ITEMS:
        if item_data["slug"] not in existing_items:
            session.add(GameItem(**item_data))

    # Achievements
    existing_achievements = set(
        (await session.execute(select(GameAchievement.slug))).scalars().all()
    )
    for ach_data in ACHIEVEMENTS:
        if ach_data["slug"] not in existing_achievements:
            session.add(GameAchievement(**ach_data))

    # Egg drops
    existing_drops = (await session.execute(select(GameEggDrop.id))).scalars().all()
    if not existing_drops:
        for drop_data in EGG_DROPS:
            session.add(GameEggDrop(**drop_data))

    await session.commit()
