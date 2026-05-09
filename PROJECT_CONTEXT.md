# Task Blo — Полный контекст проекта

> **Этот файл — универсальный промт.** Скопируй его целиком в любую нейросеть (ChatGPT, Claude, Gemini и т.д.), и она поймёт весь проект и сможет с ним работать.

---

## Инструкция для нейросети

Ты работаешь с проектом **Task Blo** — Telegram-бот + Mini App для управления задачами. Проект находится на GitHub. Попроси у пользователя **GitHub Personal Access Token** (с правами `repo`) чтобы получить доступ к репозиторию. Репозиторий **приватный**.

- **Репозиторий:** `https://github.com/qwertytw8-pixel/tasksbot`
- **Владелец:** @ficsyk (Telegram ID: `522370840`)
- **Хостинг бэкенда:** Amvera (русский хостинг, https://amvera.ru)
- **Хостинг фронтенда:** Vercel (https://tasksbot-five.vercel.app)

> **Примечание:** Репозиторий был перенесён с аккаунта `ClampSerfScoop` на `qwertytw8-pixel`. В git-истории остались старые авторы коммитов — это нормально. Новые коммиты идут от нового аккаунта.

---

## Стек технологий

### Backend (`backend/`)
- **Python 3.12**
- **aiogram 3** — Telegram Bot API (webhooks, не polling)
- **FastAPI** — REST API для Mini App
- **SQLAlchemy 2** (async, asyncpg) — ORM
- **PostgreSQL** — база данных
- **APScheduler** — планировщик (напоминания, daily summary, уведомления о подписке)
- **Pydantic v2** — валидация данных
- **Ruff** — линтер (line-length=100, target py312)
- **SpeechRecognition + ffmpeg** — транскрибация голосовых (Google бесплатно)
- **OpenAI Whisper** — транскрибация (если задан OPENAI_API_KEY, платно, лучше качество)
- **Groq Llama 3.3 70B** — AI-парсинг задач из текста (модуль `nlp_ai.py`, fallback на regex)

### Frontend (`webapp/`)
- **React 18** + **TypeScript**
- **Vite** — сборщик
- **React Router v6** — маршрутизация
- **@telegram-apps/sdk-react** — Telegram Mini Apps SDK
- **@telegram-apps/telegram-ui** — UI компоненты
- Стили: обычный CSS (`styles.css`), поддержка тёмной/светлой темы через CSS-переменные
- **i18n** — своя система интернационализации (React Context + хук `useI18n()`) + лёгкий `useLocale.ts` для игровых страниц
- **Toast-система** — in-app уведомления (компонент `Toast.tsx`, контекст `ToastProvider` + хук `useToast()`)

---

## Структура проекта

```
tasksbot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI приложение, lifespan, webhook endpoint
│   │   ├── config.py         # Pydantic Settings (env переменные)
│   │   ├── db.py             # SQLAlchemy модели + ensure_runtime_schema (автомиграции)
│   │   ├── schemas.py        # Pydantic схемы (request/response)
│   │   ├── auth.py           # Проверка Telegram initData (HMAC валидация)
│   │   ├── api.py            # REST API: /api/me, /api/tasks CRUD, /api/categories, /api/privacy
│   │   ├── api_game.py       # Game API: /api/game/* (профиль, хатч, питомцы, магазин, достижения, квесты, спин, удаление)
│   │   ├── api_subscription.py  # API подписки: status, plans, activate-promo, create-invoice
│   │   ├── api_admin.py      # API админки: stats, users, promos CRUD, grant, grant-coins, test-notification
│   │   ├── subscription.py   # Логика подписок: is_premium, can_create_task, лимиты, тарифы
│   │   ├── game.py           # Игровая логика: монеты, XP, стрик, эволюция, ачивки, комбо, квесты, спин, анти-абуз
│   │   ├── game_models.py    # SQLAlchemy модели игры (8 таблиц)
│   │   ├── game_schemas.py   # Pydantic схемы игры (request/response, включая квесты, спин)
│   │   ├── game_seed.py      # Сид-данные: предметы магазина, ачивки (включая секретные), дропы яиц + ensure_game_schema() + авто-миграция
│   │   ├── bot.py            # Telegram бот: handlers, /premium, Stars payment, NLP, голосовые, multi-task (двуязычный: ru/en)
│   │   ├── nlp.py            # NLP парсинг (regex): текст → задачи (русский, multi-task, приоритет, время)
│   │   ├── nlp_ai.py         # AI-парсинг (Groq Llama 3.3 70B): текст → задачи (любая форма речи, fallback на regex)
│   │   └── scheduler.py      # APScheduler: напоминания, daily summary, уведомления подписки
│   ├── assets/               # welcome.png, premium.png, premium_success.png
│   ├── Dockerfile
│   └── pyproject.toml
├── webapp/
│   ├── src/
│   │   ├── main.tsx          # Entry point (обёрнут в I18nProvider + ToastProvider)
│   │   ├── App.tsx           # Роутинг, TabBar (5 вкладок), FAB (скрыт на /pet страницах), PetReactionOverlay
│   │   ├── api.ts            # HTTP клиент к бэкенду (включая game API: профиль, квесты, спин, отчёт и др.)
│   │   ├── telegram.ts       # Telegram SDK helpers (getUserLanguage, haptic, etc.)
│   │   ├── theme.ts          # Управление темой (system/light/dark)
│   │   ├── useLocale.ts      # Лёгкий i18n хук: определение языка из Telegram, функция t(ru, en)
│   │   ├── icons.tsx         # SVG иконки (PawIcon, CoinIcon, FireIcon, ScrollIcon, GiftIcon, LockIcon, RefreshIcon и др.)
│   │   ├── styles.css        # Все стили (CSS-переменные + Liquid Glass + стили игры + премиальные анимации + toast-стили)
│   │   ├── pages/
│   │   │   ├── Today.tsx     # Задачи на сегодня + FocusWidget
│   │   │   ├── All.tsx       # Все задачи (active/archive табы, фильтр горизонта задач)
│   │   │   ├── Calendar.tsx  # Календарь
│   │   │   ├── Categories.tsx # Категории (доступна по прямому URL, убрана из навбара)
│   │   │   ├── TaskForm.tsx  # Создание/редактирование задачи (приоритет + инлайн-создание категорий)
│   │   │   ├── Profile.tsx   # Профиль (тема, язык, горизонт задач, промокод, поддержка, приватность, архив, сброс онбординга)
│   │   │   ├── Subscription.tsx # Страница подписки (сравнение планов)
│   │   │   ├── Admin.tsx     # Админ-панель (статистика, промокоды, пользователи)
│   │   │   ├── Report.tsx    # **[Wave 2]** Отчёт за неделю/месяц (статистика задач, монет, стрика, идеальных дней)
│   │   │   ├── Pet.tsx       # Главный экран питомца (Liquid Glass, Mood Widget, мини-фразы, комбо, навигация 5 кнопок)
│   │   │   ├── PetHatch.tsx  # Экран вылупления яйца (премиальная анимация тряски + раскрытие + частицы + именование)
│   │   │   ├── PetAchievements.tsx # Достижения (тиры Бронза-Бриллиант, секретные ачивки с замком)
│   │   │   ├── PetShop.tsx   # Магазин (яйца, фоны; аксессуары скрыты). Авто-экипировка фона после покупки
│   │   │   ├── PetCollection.tsx # Коллекция: 2 вкладки (Питомцы + Фоны), выбор активного, удаление, экипировка/снятие фона
│   │   │   ├── DailyQuests.tsx # **[Wave 3]** Ежедневные квесты (3 квеста/день, прогресс-бар, переброс за монеты)
│   │   │   └── LuckySpin.tsx  # **[Wave 3]** Колесо удачи (8-сегментное колесо, CSS-анимация вращения, раз в день)
│   │   ├── components/
│   │   │   ├── TaskRow.tsx   # Компонент задачи (swipe actions с эффектом стекла, checkbox, цветная рамка приоритета)
│   │   │   ├── HourlyTimeline.tsx # iPhone-style timeline по часам (для Calendar)
│   │   │   ├── OnboardingTour.tsx # Онбординг-тур (7 шагов включая «Питомец», spotlight, i18n)
│   │   │   ├── PetView.tsx   # Компонент отображения питомцев — `<img>` с PNG-артами (+ фон)
│   │   │   ├── DailyRewardModal.tsx # Попап ежедневного бонуса (7-дневный календарь, монетки)
│   │   │   ├── DatePicker.tsx # Кастомный выбор даты
│   │   │   ├── WheelTimePicker.tsx # Выбор времени (колесо)
│   │   │   ├── LimitModal.tsx # Попап лимита/Premium (SVG иконки, два варианта)
│   │   │   ├── Toast.tsx     # Toast-уведомления (ToastProvider + useToast, 4 типа: success/error/info/achievement)
│   │   │   ├── Confetti.tsx  # Анимация конфетти
│   │   │   └── FocusWidget.tsx # Виджет фокуса
│   │   └── utils/
│   │       └── date.ts       # Утилиты для дат
│   ├── public/
│   │   └── game/             # Все PNG-арты игры (см. структуру ниже)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── DEPLOY.md                  # Инструкция по деплою на Amvera
├── README.md
├── Dockerfile.amvera          # Dockerfile для Amvera
├── amvera.yml                 # Конфиг Amvera
└── .github/workflows/
    ├── ci.yml                 # CI: ruff lint + tsc typecheck + npm build при каждом push/PR
    └── cron-tick.yml          # Cron для /cron/tick endpoint
```

---

## База данных (PostgreSQL)

### Таблицы

**users**
| Поле | Тип | Описание |
|------|-----|----------|
| id | BIGINT PK | Telegram user ID |
| tz | VARCHAR(64) | Часовой пояс (default "UTC") |
| is_admin | BOOLEAN | Флаг админа |
| onboarding_completed | BOOLEAN | Прошёл ли онбординг-тур (default false) |
| premium_interest_at | TIMESTAMPTZ | Когда впервые нажал «Premium» (nullable) |
| notif_interest_sent | BOOLEAN | Персональное предложение после интереса отправлено |
| created_at | TIMESTAMPTZ | Дата создания |

**categories**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| user_id | BIGINT FK → users | |
| name | VARCHAR(64) | Название категории |
| color | VARCHAR(16) | Цвет (nullable) |
| emoji | VARCHAR(16) | Эмодзи (nullable) |

**tasks**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| user_id | BIGINT FK → users | |
| category_id | INT FK → categories | Nullable |
| parent_task_id | INT FK → tasks | Подзадача (nullable) |
| title | VARCHAR(255) | |
| description | VARCHAR(2000) | Nullable (используется для хранения доп. инфо, например «до 13:00» из диапазона времени) |
| due_date | DATE | Дата (nullable) |
| has_time | BOOLEAN | Есть ли точное время |
| due_at | TIMESTAMPTZ | Дата+время (nullable) |
| remind_minutes_before | INT | Напоминание за N минут (0 = вовремя, >0 = заранее, только Premium) |
| recurrence | VARCHAR(16) | "daily" / "weekly" / "monthly" / null |
| priority | INTEGER | Приоритет: 0=без, 1=низкий, 2=средний, 3=высокий (default 0) |
| is_done | BOOLEAN | Выполнена |
| done_at | TIMESTAMPTZ | Когда выполнена |
| archived_at | TIMESTAMPTZ | Когда архивирована |
| created_at | TIMESTAMPTZ | |

**reminders**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| task_id | INT FK → tasks | |
| fire_at | TIMESTAMPTZ | Когда сработать |
| fired | BOOLEAN | Уже сработало |

**subscriptions**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| user_id | BIGINT FK → users | |
| plan | VARCHAR(16) | "premium" |
| started_at | TIMESTAMPTZ | |
| expires_at | TIMESTAMPTZ | Nullable (null = бессрочная) |
| is_active | BOOLEAN | |
| source | VARCHAR(16) | "stars" / "promo" / "admin_grant" |
| stars_payment_id | VARCHAR(128) | ID платежа Telegram |
| notif_3d_sent | BOOLEAN | Уведомление «за 3 дня» отправлено |
| notif_0d_sent | BOOLEAN | Уведомление «истекла» отправлено |
| notif_discount_sent | BOOLEAN | Уведомление со скидкой отправлено |
| notif_post_expiry_sent | BOOLEAN | Персональное предложение после истечения отправлено |

**promo_codes**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| code | VARCHAR(64) UNIQUE | Код промокода |
| duration_days | INT | Длительность (default 14) |
| max_uses | INT | Макс. активаций |
| current_uses | INT | Текущее кол-во |
| is_active | BOOLEAN | Активен ли |
| created_at | TIMESTAMPTZ | |
| created_by | BIGINT | Кто создал |

**promo_activations**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| promo_id | INT FK → promo_codes | |
| user_id | BIGINT FK → users | |
| activated_at | TIMESTAMPTZ | |
| UNIQUE(promo_id, user_id) | | Один промокод = один раз на юзера |

### Игровые таблицы

**game_profiles**
| Поле | Тип | Описание |
|------|-----|----------|
| user_id | BIGINT PK FK → users | |
| coins | INTEGER | Текущий баланс монет |
| total_coins_earned | INTEGER | Всего заработано монет |
| streak_days | INTEGER | Текущий стрик (дней подряд) |
| last_streak_date | DATE | Последний день стрика |
| perfect_days_count | INTEGER | Количество идеальных дней |
| last_perfect_day_date | DATE | Дата последнего идеального дня (защита от абуза) |
| tasks_completed_total | INTEGER | Всего задач выполнено |
| tasks_ontime_total | INTEGER | Задач выполнено вовремя |
| tasks_high_priority_total | INTEGER | Задач с высоким приоритетом |
| items_purchased_total | INTEGER | Предметов куплено |
| daily_coins_earned | INTEGER | Монет заработано сегодня |
| daily_coins_date | DATE | Дата последнего сброса дневного кэпа |
| active_pet_id | INTEGER | ID активного питомца |
| active_background_id | INTEGER | ID активного фона |
| daily_login_day | DATE | Дата последнего ежедневного бонуса (nullable) |
| daily_login_streak | INTEGER | Текущий стрик ежедневного бонуса (0-7, default 0) |
| combo_count | INTEGER | **[Wave 2]** Количество задач в текущем комбо (default 0) |
| combo_date | DATE | **[Wave 2]** Дата текущего комбо (nullable) |
| last_spin_date | DATE | **[Wave 3]** Дата последнего спина колеса удачи (nullable) |
| created_at | TIMESTAMPTZ | |

**game_pets**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| user_id | BIGINT FK → users | |
| character_type | VARCHAR(32) | "cat" / "fox" / "dragon" |
| rarity | VARCHAR(16) | "common" / "rare" / "epic" |
| name | VARCHAR(64) | Имя питомца (задаётся при вылуплении или позже) |
| xp | INTEGER | Текущий опыт |
| stage | INTEGER | Стадия эволюции (1-5) |
| accessory_item_id | INTEGER | Надетый аксессуар |
| hatched_at | TIMESTAMPTZ | Дата вылупления |

**game_items**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| slug | VARCHAR(64) UNIQUE | Уникальный идентификатор |
| name_ru | VARCHAR(128) | Название (рус) |
| name_en | VARCHAR(128) | Название (англ) |
| type | VARCHAR(32) | "egg" / "accessory" / "background" |
| image_path | VARCHAR(256) | Путь к PNG-изображению (авто-мигрируется из .svg в .png при старте) |
| price | INTEGER | Цена в монетах |
| is_premium | BOOLEAN | Только для Premium |

**game_inventory**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| user_id | BIGINT FK → users | |
| item_id | INTEGER FK → game_items | |
| UNIQUE(user_id, item_id) | | |

**game_achievements**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| slug | VARCHAR(64) UNIQUE | |
| name_ru | VARCHAR(128) | |
| name_en | VARCHAR(128) | |
| description_ru | VARCHAR(256) | |
| description_en | VARCHAR(256) | |
| icon | VARCHAR(16) | Эмодзи (в UI заменены на SVG-иконки) |
| condition_type | VARCHAR(32) | Тип условия (tasks_done, streak, etc.) |
| condition_value | INTEGER | Значение для разблокировки |
| reward_coins | INTEGER | Награда монетами |
| tier | VARCHAR(16) | **[Wave 2]** Тир достижения: "bronze" / "silver" / "gold" / "diamond" (nullable) |
| is_secret | BOOLEAN | **[Wave 3]** Секретное достижение — скрыто до разблокировки (default false) |

**game_user_achievements**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| user_id | BIGINT FK → users | |
| achievement_id | INTEGER FK → game_achievements | |
| unlocked_at | TIMESTAMPTZ | |
| UNIQUE(user_id, achievement_id) | | |

**game_egg_drops**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| egg_slug | VARCHAR(64) | Тип яйца (egg_common, egg_rare, egg_epic) |
| character_type | VARCHAR(32) | Персонаж |
| rarity | VARCHAR(16) | Редкость |
| weight | INTEGER | Вес вероятности |

**game_daily_quests** — **[Wave 3] НОВАЯ ТАБЛИЦА**
| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PK | |
| user_id | BIGINT FK → users | |
| quest_date | DATE | Дата квеста |
| quest_slug | VARCHAR(64) | Тип квеста (complete_tasks, complete_high_priority и др.) |
| target_value | INTEGER | Целевое значение |
| progress | INTEGER | Текущий прогресс (default 0) |
| reward_coins | INTEGER | Награда монетами |
| is_completed | BOOLEAN | Выполнен ли (default false) |
| is_rerolled | BOOLEAN | Был ли переброшен (default false) |

> **Миграции** работают через `ensure_runtime_schema()` в `db.py` и `ensure_game_schema()` в `game_seed.py` — при старте приложения автоматически создаются недостающие таблицы и столбцы (CREATE TABLE IF NOT EXISTS). Alembic не используется.

> **Миграция image_path** — `seed_game_data()` автоматически обновляет `image_path` для существующих предметов (если путь в БД отличается от seed-данных). Это обеспечивает переход `.svg` → `.png`.

> **Миграция egg_drops** — если количество записей в БД не совпадает с количеством в seed-данных, таблица дропов пересоздаётся (поддержка расширенных дропов).

---

## API Endpoints

### Основные (`api.py`)
- `GET /api/me` — текущий пользователь
- `PATCH /api/me` — обновить timezone, onboarding_completed (поддерживает `{onboarding_completed: false}` для сброса)
- `GET /api/tasks` — все задачи пользователя (с подзадачами, напоминаниями)
- `POST /api/tasks` — создать задачу (проверка дневного лимита 5 для free)
- `PATCH /api/tasks/{id}` — обновить задачу (**+ начисление монет/XP при is_done=true + комбо**)
- `DELETE /api/tasks/{id}` — удалить задачу
- `POST /api/tasks/{id}/archive` — архивировать
- `POST /api/tasks/{id}/unarchive` — разархивировать
- `GET /api/categories` — категории пользователя
- `POST /api/categories` — создать категорию (только Premium)
- `PUT /api/categories/{id}` — обновить
- `DELETE /api/categories/{id}` — удалить
- `GET /api/privacy` — информация о приватности

### Игра (`api_game.py`) — Phase 1+2+3 + Wave 1+2+3 реализовано
- `GET /api/game/profile` — игровой профиль (монеты, стрик, XP, комбо, активный питомец, фон, статистика дня)
- `POST /api/game/hatch` — вылупить яйцо `{egg_slug: string}` (первое бесплатно, **лимит 3 бесплатных яйца в неделю**, HTTP 429 при превышении)
- `GET /api/game/pets` — все питомцы пользователя
- `POST /api/game/pets/{id}/activate` — сделать питомца активным
- `POST /api/game/pets/{id}/rename` — переименовать питомца `{name: string}`
- `DELETE /api/game/pets/{id}` — **удалить питомца** (если активный — сбрасывает active_pet_id)
- `GET /api/game/shop` — список предметов магазина (с пометкой owned/equipped)
- `POST /api/game/buy` — купить предмет `{item_id: int}` (яйца отклоняются — используй /hatch)
- `POST /api/game/equip` — надеть/снять аксессуар `{pet_id: int, item_id: int|null}`
- `POST /api/game/set-background` — установить фон `{item_id: int|null}` (**null = сбросить на дефолтный**)
- `GET /api/game/achievements` — список достижений (с прогрессом, locked/unlocked, **тиры**, **секретные ачивки**)
- `GET /api/game/daily-reward` — статус ежедневного бонуса `{current_day, claimed_today, rewards[]}`
- `POST /api/game/daily-reward` — забрать ежедневный бонус `{coins_earned, current_day, next_reward}`
- `GET /api/game/report?period=week|month` — **[Wave 2]** отчёт за неделю/месяц (задачи, монеты, стрик, идеальные дни)
- `GET /api/game/quests` — **[Wave 3]** ежедневные квесты (3 квеста/день, автогенерация)
- `POST /api/game/quests/{id}/reroll` — **[Wave 3]** переброс квеста за 10 монет (1 раз в день)
- `POST /api/game/spin` — **[Wave 3]** колесо удачи (раз в день, случайная награда: монеты 5-50 или XP 5-10)

### Подписка (`api_subscription.py`)
- `GET /api/subscription/status` — статус подписки (is_premium, active_tasks, max_tasks, daily_created, daily_limit)
- `GET /api/subscription/plans` — описание планов Free/Premium
- `POST /api/subscription/activate-promo` — активировать промокод `{code: string}`
- `POST /api/subscription/create-invoice` — создать инвойс для оплаты `{plan: "1m"/"3m"/"12m"/"renewal_1m"}`

### Админка (`api_admin.py`) — только для is_admin=true
- `GET /api/admin/stats` — статистика (users, premium, tasks, promos)
- `GET /api/admin/users` — список пользователей (?premium_only=true)
- `GET /api/admin/promos` — все промокоды
- `POST /api/admin/promos` — создать промокод `{code, duration_days, max_uses}`
- `DELETE /api/admin/promos/{id}` — деактивировать промокод (soft delete)
- `POST /api/admin/grant` — выдать подписку `{user_id, duration_days?}`
- `POST /api/admin/grant-coins` — выдать монеты `{user_id: int, coins: int}` (1-100000)
- `POST /api/admin/test-notification` — отправить тестовое уведомление всем админам в Telegram

### Системные
- `POST /tg/webhook` — Telegram webhook
- `POST /cron/tick` — cron endpoint (напоминания, daily summary, уведомления о подписке, персональные предложения)
- `POST /admin/migrate` — ручной запуск миграций

---

## Бизнес-логика

### Подписки (Free vs Premium)
| Фича | Free | Premium |
|-------|------|---------|
| Задачи | Макс. 5 в день (дневной лимит, считаются все созданные за сутки) | Безлимит |
| Категории | Только стандартные 4 | Свои категории |
| Ввод задач из чата | --- | Создавай задачи прямо из чата (текст/голосовые) |
| Голосовые → задачи | --- | Создавай задачи голосом (несколько задач в одном сообщении) |
| Команда /new | --- | Быстрое создание задач через /new <текст> |
| Напоминания | Только «Вовремя» (ровно в назначенное время) | + «Заранее» (за 5/15/30 мин, 1ч, 3ч, 1 день, кастом) |
| Подзадачи | С ограничениями | Без ограничений |
| Рекуррентные задачи | Да | Да |
| Темы | Да | Да |
| **Игра: монеты** | **Множитель до ×1.5, кэп 100/день** | **Множитель до ×3.0, кэп 200/день** |
| **Игра: XP** | **Множитель до ×1.2** | **Множитель до ×1.7** |
| **Игра: предметы** | **Базовый набор** | **+ Premium-эксклюзивы** |

- **Тарифы:** 1 мес = 99 Stars, 3 мес = 249 Stars (-16%), 12 мес = 799 Stars (-33%)
- **Тариф со скидкой (renewal):** 1 мес = 69 Stars — предлагается через 1 день после истечения подписки
- **Промокоды:** дают Premium на N дней (по умолчанию 14)
- **Дневной лимит 5 задач** считается по всем задачам, созданным за сегодня (по часовому поясу пользователя), включая выполненные и архивированные
- Оплата через **Telegram Stars** (валюта XTR, официальный Payments API)
- Оплата доступна и в боте (/premium), и в Mini App (openInvoice)

### Уведомления о подписке
Отправляются через cron tick (`run_subscription_notifications`):
- **За 3 дня до истечения** — «Подписка скоро закончится» + кнопка «Продлить Premium»
- **В день истечения** — «Подписка истекла» + кнопка «Продлить Premium»
- **Через 1 день после истечения** — «Специальное предложение!» — скидка 69 Stars вместо 99 Stars + кнопка «Продлить за 69 Stars»
- Каждое уведомление отправляется **один раз** (трекинг через `notif_3d_sent`, `notif_0d_sent`, `notif_discount_sent` на модели Subscription)

### Персональные предложения «69 Stars»
Отправляются через cron tick (`run_personal_offers`). Два триггера, каждый срабатывает **один раз**:
- **Триггер 1 — Первый интерес к Premium:** при нажатии на кнопку «Premium» (callback `show_premium`) записывается `premium_interest_at`. Через 24 часа, если пользователь НЕ оформил подписку, ему приходит персональное предложение 69 Stars. Трекинг: `User.notif_interest_sent`
- **Триггер 2 — Подписка истекла:** если подписка истекла и пользователь не продлил, через 24 часа после истечения приходит персональное предложение 69 Stars. Трекинг: `Subscription.notif_post_expiry_sent`
- Оба предложения используют тариф `RENEWAL_DISCOUNT_PLAN` (69 Stars) и callback `renew_discount`

### Напоминания (ограничения по подписке)
- **Free:** можно выбрать только «Без» или «Вовремя» (remind_minutes_before = 0)
- **Premium:** + «Заранее» (remind_minutes_before > 0) — за 5/15/30 мин, 1ч, 3ч, 1 день, или кастомное время
- В UI кнопка «Заранее Premium» для Free-пользователей — по нажатию попап о Premium
- Блок выбора конкретного времени (5/15/30 мин...) скрыт для Free
- **Бэкенд enforce:** если Free-пользователь каким-то образом отправит remind > 0, сервер принудительно ставит remind = 0 (и при создании, и при редактировании)
- При редактировании старых задач с кастомным напоминанием, Free-пользователям напоминание сбрасывается на «Вовремя»

### Попап лимита задач (LimitModal)
- Два варианта: `daily_limit` (при достижении дневного лимита) и `premium_feature` (при попытке использовать Premium-функцию)
- **SVG иконки:** треугольник-предупреждение (для лимита) и звезда (для Premium-функций) — с оранжево-красным градиентом
- Кнопка «Купить подписку» → переход на страницу подписки
- Тексты на простом человеческом языке (не «AI-парсинг», а «Создавай задачи прямо из чата»)

---

## UI: Ключевые элементы

### Liquid Glass стилизация — [Wave 1] РЕАЛИЗОВАНО (PR #65)
Вся Pet-вкладка стилизована в стиле Liquid Glass (glassmorphism):
- **Header** → стеклянные pill-бейджи (монеты, стрик) с blur-эффектом
- **Питомец** → анимация «дыхания» (мягкая scale-анимация) + floating particles по редкости
- **XP-бар** → shimmer-анимация (бегущий блик)
- **Статистика** → 2-колоночная адаптивная сетка стеклянных карточек
- **Навигация** → glass pill кнопки
- Shop, Achievements, Collection — тоже обновлены (glass styling)
- CSS-переменные: `--tb-glass`, `--tb-glass-border`, `--tb-blur-light`, `--tb-shadow-soft` и др.

### Mood Widget — [Wave 1] РЕАЛИЗОВАНО (PR #65)
Стеклянная карточка на экране питомца с эмодзи + текстом, меняется по количеству задач за день:
- 🔥 **«В ударе!»** / **«On fire!»** — 5+ задач + стрик активен
- 😊 **«Хороший день»** / **«Good day»** — 3-4 задачи
- 😐 **«Можно лучше»** / **«Could be better»** — 1-2 задачи
- 💤 **«Питомец скучает...»** / **«Your pet is bored...»** — 0 задач сегодня

### Мини-фразы питомца — [Wave 1] РЕАЛИЗОВАНО (PR #65)
Речевой пузырь над питомцем (ru/en) по настроению — зависит от Mood Widget.

### Комбо-карточка — [Wave 2] РЕАЛИЗОВАНО (PR #66)
Стеклянная карточка на Pet-странице, показывающая текущий множитель комбо:
- 1 задача → x1 (базовый)
- 3 задачи → x1.1
- 5 задач → x1.2
- 7 задач → x1.3
- 10+ задач → x1.5

### Отчёт за неделю/месяц — [Wave 2] РЕАЛИЗОВАНО (PR #66)
Кнопка в Профиле → страница Report.tsx:
- Переключатель Неделя/Месяц
- Стеклянные карточки со статистикой: задачи, монеты, лучший стрик, идеальные дни
- Двуязычный (ru/en)

### Многоуровневые достижения — [Wave 2] РЕАЛИЗОВАНО (PR #66)
24 достижения с тирами:
- **Бронза** → +25 монет
- **Серебро** → +50 монет
- **Золото** → +100 монет
- **Бриллиант** → +250 монет
- Цветные бейджи тиров на карточках достижений

### Ежедневные квесты — [Wave 3] РЕАЛИЗОВАНО (PR #68)
Страница DailyQuests.tsx (доступна через навигацию Pet):
- 3 случайных квеста в день из пула (complete_tasks, complete_high_priority, perfect_day, visit_shop, hatch_egg, earn_coins)
- Карточки с прогресс-баром (progress / target)
- Переброс за 10 монет (1 раз в день на любой квест)
- Квесты обновляются в 00:00 по часовому поясу пользователя

### Колесо удачи (Lucky Spin) — [Wave 3] РЕАЛИЗОВАНО (PR #68)
Страница LuckySpin.tsx (доступна через навигацию Pet):
- 8-сегментное колесо с CSS-анимацией вращения
- Взвешенные награды: монеты (5, 10, 15, 20, 50) или XP (5, 10)
- Раз в день (проверка last_spin_date)
- Награда отображается после остановки колеса

### Секретные достижения — [Wave 3] РЕАЛИЗОВАНО (PR #68)
В PetAchievements.tsx:
- Секретные ачивки показываются как «???» с иконкой замка (LockIcon)
- Пунктирная рамка (dashed border) вместо обычной
- 4 секретных достижения в seed-данных: «Погладил до дыр» (10 тапов), «Сова» (задача в 3:00), «Спидраннер» (5 задач за час), «Не сдавайся» (потерять стрик 3 раза)

### Pet Reactions — [Wave 3] РЕАЛИЗОВАНО (PR #68)
Emoji-анимация при выполнении задачи с начислением монет:
- Случайный эмодзи из массива: 🎉, ⭐, 🌟, 🔥, 💪, 😍, 🥳
- CSS-анимация: pop-in 1.2s + fade-out с движением вверх
- PetReactionOverlay компонент в App.tsx
- Триггерится через custom event `show-pet-reaction` из `toggleTask()` в api.ts

### Навигация (TabBar) — 5 вкладок
- **Все** (`/all`) — все задачи
- **Питомец** (`/pet`) — игра: питомец, монеты, XP, стрик
- **Сегодня** (`/today`) — задачи на сегодня
- **Календарь** (`/calendar`) — календарь по дням
- **Профиль** (`/profile`) — настройки, подписка, тема

### Навигация питомца — 5 кнопок [обновлено Wave 3]
- **Магазин** (ShopBagIcon) → `/pet/shop`
- **Квесты** (ScrollIcon) → `/pet/quests` **[Wave 3]**
- **Достижения** (TrophyIcon) → `/pet/achievements`
- **Удача** (GiftIcon) → `/pet/spin` **[Wave 3]**
- **Коллекция** (GridIcon) → `/pet/collection`

CSS-класс: `pet-nav--five` (grid-template-columns: repeat(5, 1fr)).

### Свайп-действия (Swipe Actions) — эффект стекла
При свайпе влево на задаче раскрываются кнопки действий:
- **Завтра** (жёлтая) — перенести на завтра. **Скрывается, если задача уже на завтра**
- **Готово/Вернуть** (зелёная) — отметить выполненной / снять отметку
- **Архив** (синяя) — архивировать
- **Удалить** (красная) — удалить

**Стиль кнопок — эффект стекла (glassmorphism):**
- `backdrop-filter: blur(16px) saturate(1.4)` — размытие фона за кнопками
- Полупрозрачные градиенты (opacity ~0.82)
- Скруглённые углы

### Интернационализация (i18n) — русский + английский
**Полностью реализовано.** Приложение двуязычное (ru/en).

**Фронтенд (webapp):**
- Система i18n: React Context (`I18nProvider`) + хук `useI18n()`, 200+ ключей перевода в файле `i18n.tsx`
- Лёгкий `useLocale.ts` для игровых страниц: `getLocale()` определяет язык из Telegram, `t(ru, en)` выбирает перевод
- Автоопределение языка из Telegram `language_code` (ru → русский, остальное → английский)

**Бот (backend):**
- Все команды и сообщения двуязычные: `/start`, `/help`, `/privacy`, `/support`, `/premium`, `/new`, `/app`
- Язык определяется по `message.from_user.language_code`

---

## Фронтенд страницы

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/all` | All.tsx | Все задачи (active/archive табы, фильтр горизонта задач) |
| `/pet` | Pet.tsx | **Питомец: Liquid Glass, Mood Widget, мини-фразы, комбо-карточка, навигация 5 кнопок, интерактивный тап** |
| `/pet/hatch` | PetHatch.tsx | **Вылупление яйца (премиальные анимации: тряска, вспышка, частицы, раскрытие → экран именования)** |
| `/pet/shop` | PetShop.tsx | **Магазин (яйца и фоны; аксессуары скрыты). Авто-экипировка фона. Toast при лимите 429** |
| `/pet/achievements` | PetAchievements.tsx | **Достижения: тиры (Бронза-Бриллиант), секретные ачивки с замком, SVG-иконки, прогресс-бары** |
| `/pet/collection` | PetCollection.tsx | **Коллекция: 2 вкладки (Питомцы + Фоны)** |
| `/pet/quests` | DailyQuests.tsx | **[Wave 3] Ежедневные квесты: 3 квеста/день, прогресс-бар, переброс за монеты** |
| `/pet/spin` | LuckySpin.tsx | **[Wave 3] Колесо удачи: 8 сегментов, CSS-анимация, раз в день** |
| `/today` | Today.tsx | Задачи на сегодня + FocusWidget |
| `/calendar` | Calendar.tsx | Календарь (список + timeline по часам) |
| `/categories` | Categories.tsx | Категории (доступна по прямому URL, убрана из навбара) |
| `/new` | TaskForm.tsx | Новая задача (с инлайн-созданием категорий) |
| `/edit/:id` | TaskForm.tsx | Редактирование |
| `/profile` | Profile.tsx | Профиль (тема, язык, горизонт задач, промокод, поддержка, сброс онбординга) |
| `/profile/report` | Report.tsx | **[Wave 2] Отчёт за неделю/месяц** |
| `/profile/subscription` | Subscription.tsx | Страница подписки (сравнение планов) |
| `/profile/privacy` | Profile.tsx | Приватность |
| `/profile/archive` | Profile.tsx | Архив задач |
| `/admin` | Admin.tsx | Админ-панель |

---

## NLP парсинг — два режима

### Режим 1: AI-парсинг (`nlp_ai.py`)
Использует **Groq Llama 3.3 70B** для разбора задач из произвольного текста/голоса:
- **Промт:** Системный промпт объясняет модели формат вывода (JSON-массив задач)
- **Извлекает:** title, date, time, priority, reminder, category
- **Понимает любую форму речи** — «привет, мне сегодня надо помыть посуду, и ещё сделать сценарий для мультика в 13:00» → 2 задачи с правильными датами/временем
- **Fallback:** если Groq недоступен или вернул ошибку — автоматически используется regex-парсер
- **Функция:** `smart_parse_tasks(text, groq_api_key, tz_name)` — единая точка входа
- **Конфигурация:** env var `GROQ_API_KEY`, модель `llama-3.3-70b-versatile`

### Режим 2: Regex-парсинг (`nlp.py`) — fallback
Парсит русский текст → одну или несколько задач. Поддерживает:
- Даты: «сегодня», «завтра», «послезавтра», «в понедельник», «25 мая»
- Время: «в 15:00», «в 3 часа»
- Приоритет: «!» или «важно», голосовые фразы «приоритет высокий»
- Разбивка на несколько задач по разделителям (`.`, `;`, запятые, союзы)
- Глобальный контекст даты — «завтра купить молоко, позвонить маме» → обе на завтра
- Диапазон времени — «с 9 до 13» → due_at=09:00, описание «до 13:00»
- Фильтрация приветствий и вводных фраз

---

## Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `BOT_TOKEN` | Да | Токен Telegram бота |
| `DATABASE_URL` | Да | PostgreSQL connection string |
| `PUBLIC_URL` | Да | Публичный URL бэкенда (для webhook) |
| `WEBAPP_URL` | Да | URL фронтенда (Mini App) |
| `WEBHOOK_SECRET` | Желательно | Секрет для webhook (default: change-me) |
| `CRON_SECRET` | Желательно | Секрет для /cron/tick (default: change-me) |
| `CORS_ORIGINS` | Нет | CORS origins (default: *) |
| `LOG_LEVEL` | Нет | Уровень логов (default: INFO) |
| `ADMIN_USER_ID` | Нет | Telegram ID админа (auto-promote при старте) |
| `OPENAI_API_KEY` | Нет | Для Whisper транскрибации (лучше качество) |
| `GROQ_API_KEY` | Нет | **Для AI-парсинга задач (Groq Llama 3.3 70B). Без него используется regex-парсер** |

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): `ruff check` + `tsc --noEmit` + `npm run build` при каждом push/PR
- **Cron** (`.github/workflows/cron-tick.yml`): вызывает `/cron/tick` каждые 5 минут
- **Фронтенд:** Vercel (авто-деплой из main, URL: https://tasksbot-five.vercel.app)
- **Бэкенд:** Amvera (URL: https://tasksbot-bloodtrvil.amvera.io, ручной деплой или через git push)

---

## Как запустить локально

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
# создай .env с переменными выше
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd webapp
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

---

## Команды для проверки кода

```bash
# Backend lint
cd backend && ruff check app/

# Backend auto-fix
cd backend && ruff check --fix app/

# Frontend typecheck
cd webapp && npx tsc --noEmit

# Frontend build
cd webapp && npm run build
```

---

## Текущее состояние (май 2026)

### Волны разработки (Waves)

#### Wave 1 — UI/UX: Liquid Glass + Mood Widget — РЕАЛИЗОВАНО (PR #65)
- **Liquid Glass стилизация** всей Pet-вкладки (glass-карточки, pill-бейджи, blur-эффекты)
- **Mood Widget** — стеклянная карточка настроения (💤/😐/😊/🔥) по кол-ву задач
- **Мини-фразы питомца** — речевой пузырь (ru/en) по настроению
- **Анимация «дыхания»** питомца + floating particles по редкости
- **XP-бар с shimmer-эффектом** (бегущий блик)
- **Статистика** → адаптивная стеклянная сетка

#### Wave 2 — Геймификация: Комбо + Ачивки + Отчёт — РЕАЛИЗОВАНО (PR #66)
- **Комбо-система** — множитель монет за серию задач в день (1x → 1.1x → 1.2x → 1.3x → 1.5x)
- **Многоуровневые достижения** — 24 ачивки с тирами Бронза/Серебро/Золото/Бриллиант
- **Отчёт за неделю/месяц** — страница Report.tsx в Профиле (стеклянные карточки, переключатель период)

#### Wave 3 — Engagement: Квесты + Lucky Spin + Пасхалки + Реакции — РЕАЛИЗОВАНО (PR #68)
- **Ежедневные квесты (Daily Quests)** — 3 случайных квеста/день, прогресс-бар, переброс за 10 монет
- **Колесо удачи (Lucky Spin)** — 8-сегментное колесо, CSS-анимация, взвешенные награды (монеты/XP), раз в день
- **Секретные достижения** — скрыты до разблокировки (???), 4 секретных ачивки в seed-данных
- **Pet Reactions** — emoji-анимация при выполнении задачи (🎉⭐🌟🔥💪😍🥳)
- **Навигация питомца** расширена до 5 кнопок (+Квесты, +Удача)
- **SVG-иконки** перерисованы (CoinIcon, FireIcon, PawIcon) в стилистике TabBar (stroke-based, consistent)
- **Адаптивная сетка статистики** — расширена для корректного отображения

### Что уже работает (полный список)
- Полный CRUD задач с подзадачами, напоминаниями, архивом
- Рекуррентные задачи (daily/weekly/monthly)
- Приоритет задач (4 уровня) с цветными рамками
- Premium подписка с 3 тарифами + скидочный тариф renewal
- Оплата через Telegram Stars — и в боте, и в Mini App
- Промокоды с лимитом активаций
- Админ-панель (статистика, CRUD промокодов, управление пользователями, выдача монет)
- AI-парсинг задач через Groq (multi-task, приоритеты, время, fallback на regex)
- Голосовая транскрибация (Google/Whisper)
- Полная геймификация: монеты, XP, стрик, эволюция, ачивки (с тирами), комбо-система
- 3 персонажа (кот, лиса, дракон) × 3 редкости × 5 стадий = 45 PNG-артов
- Магазин, коллекция, вылупление яиц (с анимациями)
- Ежедневный бонус (Daily Reward, 7-дневный цикл)
- Ежедневные квесты (3 квеста/день, переброс)
- Колесо удачи (Lucky Spin, раз в день)
- Секретные достижения (скрыты до разблокировки)
- Pet Reactions (emoji при выполнении задач)
- Liquid Glass стилизация + Mood Widget + мини-фразы питомца
- Отчёт за неделю/месяц
- Навигация 5 вкладок + 5-кнопочная навигация питомца
- Toast-система (4 типа уведомлений)
- Интерактивный питомец (тап = bounce + haptic + эмодзи-частицы)
- Онбординг-тур (7 шагов)
- Полная интернационализация (ru/en)
- Тёмная/светлая/системная тема

---

## SVG-иконки (полный список в `icons.tsx`)

| Иконка | Компонент | Где используется |
|--------|-----------|-----------------|
| SparkIcon | Декоративная | Спарклы |
| ListIcon | Список | Calendar (переключатель вида) |
| TagIcon | Тег | Категории |
| PlusIcon | Плюс | FAB кнопка |
| CheckIcon | Чекмарк | TaskRow |
| ClockIcon | Часы | Calendar (timeline), TaskForm |
| BellIcon | Колокольчик | Напоминания |
| ArchiveIcon | Архив | Swipe-действия |
| RotateCcwIcon | Повтор | Swipe-действия (вернуть) |
| AlertTriangleIcon | Предупреждение | LimitModal |
| InboxIcon | Почтовый ящик | Пустые состояния |
| ArrowRightIcon | Стрелка | Навигация |
| FolderIcon | Папка | Категории |
| CalendarIcon | Календарь | TabBar |
| ChevronLeftIcon | Шеврон влево | Навигация |
| ChevronRightIcon | Шеврон вправо | Навигация |
| ShieldIcon | Щит | Приватность |
| LayersIcon | Слои | TaskForm (без даты) |
| CornerDownRightIcon | Стрелка вниз-вправо | Подзадачи |
| UserIcon | Пользователь | Профиль |
| SunIcon | Солнце | Светлая тема |
| MoonIcon | Луна | Тёмная тема |
| MonitorIcon | Монитор | Системная тема |
| TrashIcon | Корзина | Удаление |
| SunriseIcon | Рассвет | Swipe (завтра) |
| **PawIcon** | **Лапка** | **TabBar (вкладка «Питомец»)** |
| HelpIcon | Помощь | Поддержка |
| **ShopBagIcon** | **Сумка** | **Pet навигация (Магазин)** |
| **TrophyIcon** | **Кубок** | **Pet навигация (Достижения)** |
| **GridIcon** | **Сетка** | **Pet навигация (Коллекция)** |
| **CoinIcon** | **Монета** | **Pet (монеты), Достижения (награды)** |
| **FireIcon** | **Огонь** | **Pet (стрик)** |
| **TrashXIcon** | **Корзина с X** | **PetCollection (удаление питомца)** |
| FlagIcon | Флаг | Приоритет |
| **StarBadgeIcon** | **Звезда-бейдж** | **Достижения (задачи)** |
| **RocketIcon** | **Ракета** | **Достижения (стрик)** |
| **TargetIcon** | **Мишень** | **Достижения (пунктуальность)** |
| **DiamondIcon** | **Алмаз** | **Достижения (идеальные дни)** |
| **HeartIcon** | **Сердце** | **Достижения** |
| **CrownIcon** | **Корона** | **Достижения (покупки)** |
| **BoltIcon** | **Молния** | **Достижения (приоритеты)** |
| **ScrollIcon** | **Свиток** | **[Wave 3] Pet навигация (Квесты)** |
| **RefreshIcon** | **Обновить** | **[Wave 3] Переброс квеста** |
| **GiftIcon** | **Подарок** | **[Wave 3] Pet навигация (Удача/Спин)** |
| **LockIcon** | **Замок** | **[Wave 3] Секретные достижения** |

Все SVG-иконки используют единый стиль: `strokeWidth="1.8"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `viewBox="0 0 24 24"`.

---

## Структура файлов артов

```
webapp/public/game/
├── pets/
│   ├── cat/
│   │   ├── common/   (stage1.png ... stage5.png)
│   │   ├── rare/     (stage1.png ... stage5.png)
│   │   └── epic/     (stage1.png ... stage5.png)
│   ├── fox/
│   │   ├── common/ rare/ epic/  (stage1-5.png в каждой)
│   └── dragon/
│       ├── common/ rare/ epic/  (stage1-5.png в каждой)
├── eggs/
│   ├── common.png, rare.png, epic.png
├── bg/
│   ├── meadow.png, night.png, city.png, space.png, volcano.png, rainbow.png
└── accessories/
    ├── bow.png, crown.png, scarf.png, glasses.png, hat.png,
    │   bowtie.png, chain.png, headphones.png, horns.png, halo.png
```

---

## Инфраструктура

| Сервис | URL | Аккаунт |
|--------|-----|---------|
| GitHub (репо) | https://github.com/qwertytw8-pixel/tasksbot | qwertytw8-pixel |
| Vercel (фронтенд) | https://tasksbot-five.vercel.app | qwertytw8-pixel |
| Amvera (бэкенд) | https://tasksbot-bloodtrvil.amvera.io | — |
| Amvera (БД) | tasksbot-db (PostgreSQL) | — |

### Amvera env-переменные:
- `BOT_TOKEN` — токен Telegram бота
- `WEBHOOK_SECRET` — секрет для webhook
- `ADMIN_USER_ID` — Telegram ID админа (522370840)
- `PUBLIC_URL` — https://tasksbot-bloodtrvil.amvera.io
- `CRON_SECRET` — секрет для /cron/tick
- `DATABASE_URL` — PostgreSQL connection string
- `WEBAPP_URL` — https://tasksbot-five.vercel.app
- `GROQ_API_KEY` — ключ для AI-парсинга задач (Groq)

### Vercel env-переменные:
- `VITE_API_BASE` — https://tasksbot-bloodtrvil.amvera.io

---

## Будущие планы — Wave 4: Монетизация + Бот-меню

### 4.1 Premium-воронка (engagement → конверсия)
- Мягкие баннеры при 3/5 задачах («С Premium — безлимит»)
- Premium-предпросмотр на 1 день бесплатно
- Эмоциональные push-уведомления («Питомец скучает по тебе...»)
- Интерактивный онбординг Premium (показать, что даёт подписка)

### 4.2 Бот-меню (управление без Mini App)
- Inline-кнопки в боте для быстрого управления задачами
- Reply keyboard с основными действиями
- Быстрое создание задач через inline-запросы

### 4.3 Другие идеи (из ROADMAP)
- Эмоциональные состояния питомца (Mood System) — 5 эмоций с PNG-ассетами
- Крафтинг питомцев (Fusion) — объединение дубликатов
- Pomodoro с питомцем — связать FocusWidget с игровой механикой
- Красная Панда как 4-й персонаж
- Аксессуары (наложение поверх питомцев — пиксельная привязка)
- Smart-напоминания (AI-анализ паттернов пользователя)
- Шаблоны задач (Templates)
- Статистика и аналитика (Insights — графики продуктивности)
- Challenge Mode — режим вызова

### Что НЕ нужно делать:
- **НЕ добавлять аксессуары в UI** — отложены
- **НЕ менять core game mechanics** (монеты, XP, стрик)
- **НЕ коммитить секреты и .env файлы**
- **НЕ force push в main/master**

---

**Когда будешь работать с этим проектом, попроси у пользователя GitHub Personal Access Token с правами `repo` для доступа к репозиторию.**

---

*Последнее обновление: 2026-05-09*
