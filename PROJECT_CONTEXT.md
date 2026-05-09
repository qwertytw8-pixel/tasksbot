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
- **Liquid Glass UI** — стеклянный дизайн (glassmorphism) с backdrop-blur, полупрозрачными градиентами, pill-бейджами
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
│   │   ├── api_game.py       # Game API: /api/game/* (профиль, хатч, питомцы, магазин, достижения, комбо, отчёт, удаление)
│   │   ├── api_subscription.py  # API подписки: status, plans, activate-promo, create-invoice
│   │   ├── api_admin.py      # API админки: stats, users, promos CRUD, grant, grant-coins, test-notification
│   │   ├── subscription.py   # Логика подписок: is_premium, can_create_task, лимиты, тарифы
│   │   ├── game.py           # Игровая логика: монеты, XP, стрик, эволюция, ачивки, комбо, анти-абуз
│   │   ├── game_models.py    # SQLAlchemy модели игры (7 таблиц)
│   │   ├── game_schemas.py   # Pydantic схемы игры (request/response, включая ReportOut)
│   │   ├── game_seed.py      # Сид-данные: предметы магазина, ачивки (24 шт, 4 тира), дропы яиц + ensure_game_schema() + авто-миграция
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
│   │   ├── App.tsx           # Роутинг, TabBar (5 вкладок), FAB (скрыт на /pet страницах)
│   │   ├── api.ts            # HTTP клиент к бэкенду (включая game API методы + gameReport)
│   │   ├── telegram.ts       # Telegram SDK helpers (getUserLanguage, haptic, etc.)
│   │   ├── theme.ts          # Управление темой (system/light/dark)
│   │   ├── useLocale.ts      # Лёгкий i18n хук: определение языка из Telegram, функция t(ru, en)
│   │   ├── icons.tsx         # SVG иконки (PawIcon, CoinIcon, FireIcon, ShopBagIcon, TrophyIcon, GridIcon, BarChartIcon, TrashXIcon, StarBadgeIcon, RocketIcon, TargetIcon, DiamondIcon, HeartIcon, CrownIcon, BoltIcon и др.)
│   │   ├── styles.css        # Все стили (CSS-переменные + Liquid Glass + стили игры + комбо + тиры + отчёт + премиальные анимации + toast-стили)
│   │   ├── pages/
│   │   │   ├── Today.tsx     # Задачи на сегодня + FocusWidget
│   │   │   ├── All.tsx       # Все задачи (active/archive табы, фильтр горизонта задач)
│   │   │   ├── Calendar.tsx  # Календарь
│   │   │   ├── Categories.tsx # Категории (доступна по прямому URL, убрана из навбара)
│   │   │   ├── TaskForm.tsx  # Создание/редактирование задачи (приоритет + инлайн-создание категорий)
│   │   │   ├── Profile.tsx   # Профиль (тема, язык, горизонт задач, промокод, поддержка, приватность, архив, отчёт, сброс онбординга)
│   │   │   ├── Report.tsx    # Отчёт за неделю/месяц (статистика задач, стрик, монеты)
│   │   │   ├── Subscription.tsx # Страница подписки (сравнение планов)
│   │   │   ├── Admin.tsx     # Админ-панель (статистика, промокоды, пользователи)
│   │   │   ├── Pet.tsx       # Главный экран питомца (Liquid Glass, Mood Widget, мини-фразы, комбо, статистика)
│   │   │   ├── PetHatch.tsx  # Экран вылупления яйца (премиальная анимация тряски + раскрытие + частицы + именование)
│   │   │   ├── PetAchievements.tsx # Достижения (SVG-иконки, тиры Бронза→Бриллиант, прогресс-бары)
│   │   │   ├── PetShop.tsx   # Магазин (яйца, фоны; аксессуары скрыты). Авто-экипировка фона после покупки
│   │   │   └── PetCollection.tsx # Коллекция: 2 вкладки (Питомцы + Фоны), выбор активного, удаление, экипировка/снятие фона
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
├── PROJECT_CONTEXT.md         # Этот файл — полный контекст проекта
├── DEPLOY.md                  # Инструкция по деплою на Amvera
├── README.md
├── Dockerfile.amvera          # Dockerfile для Amvera
├── amvera.yml                 # Конфиг Amvera
└── .github/workflows/
    ├── ci.yml                 # CI: ruff lint + tsc typecheck
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
| combo_count | INTEGER | Количество задач в текущем комбо (default 0) |
| combo_date | DATE | Дата текущего комбо (nullable) |
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
| tier | VARCHAR(16) | Тир: bronze / silver / gold / diamond (default bronze) |

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

> **Миграции** работают через `ensure_runtime_schema()` в `db.py` и `ensure_game_schema()` в `game_seed.py` — при старте приложения автоматически создаются недостающие таблицы и столбцы (CREATE TABLE IF NOT EXISTS, ALTER TABLE ADD COLUMN IF NOT EXISTS). Alembic не используется.

> **Миграция image_path** — `seed_game_data()` автоматически обновляет `image_path` для существующих предметов (если путь в БД отличается от seed-данных). Это обеспечивает переход `.svg` → `.png`.

> **Миграция egg_drops** — если количество записей в БД не совпадает с количеством в seed-данных, таблица дропов пересоздаётся (поддержка расширенных дропов).

---

## API Endpoints

### Основные (`api.py`)
- `GET /api/me` — текущий пользователь
- `PATCH /api/me` — обновить timezone, onboarding_completed (поддерживает `{onboarding_completed: false}` для сброса)
- `GET /api/tasks` — все задачи пользователя (с подзадачами, напоминаниями)
- `POST /api/tasks` — создать задачу (проверка дневного лимита 5 для free)
- `PATCH /api/tasks/{id}` — обновить задачу (**+ начисление монет/XP при is_done=true**)
- `DELETE /api/tasks/{id}` — удалить задачу
- `POST /api/tasks/{id}/archive` — архивировать
- `POST /api/tasks/{id}/unarchive` — разархивировать
- `GET /api/categories` — категории пользователя
- `POST /api/categories` — создать категорию (только Premium)
- `PUT /api/categories/{id}` — обновить
- `DELETE /api/categories/{id}` — удалить
- `GET /api/privacy` — информация о приватности

### Игра (`api_game.py`)
- `GET /api/game/profile` — игровой профиль (монеты, стрик, XP, активный питомец, фон, статистика дня, combo_count, combo_multiplier)
- `POST /api/game/hatch` — вылупить яйцо `{egg_slug: string}` (первое бесплатно, **лимит 3 бесплатных яйца в неделю**, HTTP 429 при превышении)
- `GET /api/game/pets` — все питомцы пользователя
- `POST /api/game/pets/{id}/activate` — сделать питомца активным
- `POST /api/game/pets/{id}/rename` — переименовать питомца `{name: string}`
- `DELETE /api/game/pets/{id}` — **удалить питомца** (если активный — сбрасывает active_pet_id)
- `GET /api/game/shop` — список предметов магазина (с пометкой owned/equipped)
- `POST /api/game/buy` — купить предмет `{item_id: int}` (яйца отклоняются — используй /hatch)
- `POST /api/game/equip` — надеть/снять аксессуар `{pet_id: int, item_id: int|null}`
- `POST /api/game/set-background` — установить фон `{item_id: int|null}` (**null = сбросить на дефолтный**)
- `GET /api/game/achievements` — список достижений (с прогрессом, locked/unlocked, тирами)
- `GET /api/game/daily-reward` — статус ежедневного бонуса `{current_day, claimed_today, rewards[]}`
- `POST /api/game/daily-reward` — забрать ежедневный бонус `{coins_earned, current_day, next_reward}`
- `GET /api/game/report?period=week|month` — **отчёт за неделю/месяц** (задачи, монеты, стрик, идеальные дни)

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

## UI: Ключевые элементы интерфейса

### Liquid Glass дизайн (Wave 1)
Все основные элементы интерфейса используют стеклянный дизайн (glassmorphism):
- **CSS-переменные:** `--tb-glass`, `--tb-glass-border`, `--tb-blur-light`, `--tb-blur-heavy`, `--tb-radius-sm`, `--tb-radius-md`
- **Header Pet-страницы** → стеклянные pill-бейджи (монеты, стрик)
- **Питомец** → анимация «дыхания» (мягкая scale-анимация) + floating particles по редкости
- **XP-бар** → shimmer-анимация
- **Статистика** → 2-колоночная сетка стеклянных карточек
- **Навигация** → glass pill кнопки
- **Shop, Achievements, Collection** — все обновлены (glass styling)

### Mood Widget (Wave 1)
Стеклянная карточка на экране питомца с эмодзи + текстом, меняется по количеству выполненных задач:
- 🔥 **«В ударе!»** / **«On fire!»** — 5+ задач + стрик активен
- 😊 **«Хороший день»** / **«Good day»** — 3-4 задачи
- 😐 **«Можно лучше»** / **«Could be better»** — 1-2 задачи
- 💤 **«Питомец скучает...»** / **«Your pet is bored...»** — 0 задач сегодня

### Мини-фразы питомца (Wave 1)
Речевой пузырь рядом с питомцем (ru/en) — питомец «говорит» в зависимости от настроения/продуктивности.

### Комбо-система (Wave 2)
Стеклянная карточка на Pet-странице, показывает текущее комбо:
- Показывается только при `combo_count > 0`
- Множитель монет за серию задач в день: 0-1 → ×1.0, 2 → ×1.1, 3 → ×1.2, 4 → ×1.3, 5+ → ×1.5
- Иконка молнии ⚡ + «Комбо x{count}» + бейдж множителя

### Многоуровневые достижения (Wave 2)
24 достижения с 4 тирами:
- **Бронза** (#CD7F32) — +25 монет
- **Серебро** (#C0C0C0) — +50 монет
- **Золото** (#FFD700) — +100 монет
- **Бриллиант** (#B9F2FF) — +250 монет

Тиры отображаются цветными бейджами на карточках достижений (локализованы: ru/en).

### Отчёт за неделю/месяц (Wave 2)
Страница `/profile/report` — доступна по кнопке в Профиле:
- Переключатель Неделя / Месяц
- Основная сетка (стеклянные карточки): задач выполнено, вовремя, высокий приоритет, монеты
- Итого: задач создано, стрик, идеальных дней, всего задач

### Вкладка «Когда» в TaskForm
Две кнопки-сегмента при создании/редактировании задачи:
- **Без даты** — задача без привязки ко времени (иконка Layers)
- **Дата** — дата + опциональный toggle «Добавить время» (анимированный, при включении появляется WheelTimePicker + выбор напоминания)

### Приоритет задач (цветные рамки)
Четыре кнопки-сегмента «Важность» в TaskForm:
- **Без** (серый, `var(--tb-hint)`) — priority = 0
- **Низкий** (зелёный, `var(--tb-priority-low)`) — priority = 1
- **Средний** (оранжевый, `var(--tb-priority-med)`) — priority = 2
- **Высокий** (красный, `var(--tb-priority-high)`) — priority = 3

В списке задач (TaskRow) приоритет отображается **цветной рамкой** (`border: 1.5px solid` + `border-left: 3.5px solid`) + лёгкий тонированный фон.

### Навигация (TabBar) — 5 вкладок
- **Все** (`/all`) — все задачи
- **Питомец** (`/pet`) — игра: питомец, монеты, XP, стрик
- **Сегодня** (`/today`) — задачи на сегодня
- **Календарь** (`/calendar`) — календарь по дням
- **Профиль** (`/profile`) — настройки, подписка, тема, отчёт

FAB (кнопка «+») — скрыт на всех `/pet` страницах.

### Свайп-действия (Swipe Actions) — эффект стекла
При свайпе влево на задаче раскрываются кнопки действий:
- **Завтра** (жёлтая) — перенести на завтра. **Скрывается, если задача уже на завтра**
- **Готово/Вернуть** (зелёная) — отметить выполненной / снять отметку
- **Архив** (синяя) — архивировать
- **Удалить** (красная) — удалить

Стиль кнопок — glassmorphism: `backdrop-filter: blur(16px) saturate(1.4)`, полупрозрачные градиенты.

### Онбординг-тур (OnboardingTour)
7 шагов: Приветствие → Навигация (табы) → FAB «+» → Питомец → «Сегодня» → «Календарь» → «Профиль».
Все тексты переведены (i18n), spotlight-подсветка элементов, прогресс-бар, сброс через кнопку в профиле.

### Toast-система (in-app уведомления)
4 типа: `success` (зелёный), `error` (красный), `info` (синий), `achievement` (золотой).
Авто-скрытие через 3.5 сек, клик для мгновенного закрытия.

### Интерактивный питомец (тап-реакция)
При тапе на питомца: bounce-анимация + haptic feedback + эмодзи-частицы (✨❤️⭐💫🌟). Чисто визуальная — не даёт монеты/XP.

---

## Интернационализация (i18n) — русский + английский

**Полностью реализовано.** Приложение двуязычное (ru/en).

**Фронтенд (webapp):**
- Система i18n: React Context (`I18nProvider`) + хук `useI18n()`, 200+ ключей перевода в файле `i18n.tsx`
- Лёгкий `useLocale.ts` для игровых страниц: `getLocale()` определяет язык из Telegram, `t(ru, en)` выбирает перевод
- Автоопределение языка из Telegram `language_code` (ru → русский, остальное → английский)
- Настройки в Профиле: переключатель языка (Русский / English) + горизонт задач (7/14/30/90/Все)
- Переведены **все** страницы и компоненты

**Бот (backend):**
- Все команды и сообщения двуязычные
- Язык определяется по `message.from_user.language_code`

---

## NLP парсинг — два режима

### Режим 1: AI-парсинг (`nlp_ai.py`)
Использует **Groq Llama 3.3 70B** для разбора задач из произвольного текста/голоса:
- Понимает любую форму речи — «привет, мне сегодня надо помыть посуду, и ещё сделать сценарий для мультика в 13:00» → 2 задачи
- Поддержка глобальных модификаторов приоритета
- Fallback на regex-парсер при ошибке
- Latency: ~500ms на запрос

### Режим 2: Regex-парсинг (`nlp.py`) — fallback
Парсит русский текст → одну или несколько задач:
- Разбивка на несколько задач (`. `, `;`, союзы «потом», «затем», запятая)
- Глобальный контекст даты (наследование даты первой задачи)
- Фильтрация приветствий и вводных фраз
- Приоритет голосом («важность средняя», «приоритет высокий»)
- Диапазон времени («с 9 до 13»)

---

## Голосовые сообщения
1. Скачивает OGG файл через Telegram Bot API
2. Конвертирует в WAV через ffmpeg
3. Транскрибирует: Whisper API (если `OPENAI_API_KEY`) или Google Speech Recognition (бесплатно)
4. Текст → `smart_parse_tasks()` → AI-парсинг через Groq (или fallback на regex)
5. Каждая задача создаётся отдельно, бот отправляет сводку

---

## Геймификация — полная реализация

### Ядро игровой механики
1. **Монеты за задачи** — базовые: без приоритета=5, низкий=8, средний=12, высокий=18; +3 за выполнение до дедлайна; +15 за «идеальный день»; множители стрика/Premium/редкости; дневной кэп: Free 100, Premium 200
2. **XP за задачи** — аналогично монетам, но с другими множителями, без Premium-бонуса
3. **Стрик** — серия дней подряд с ≥1 выполненной задачей
4. **Комбо-система** — множитель монет за серию задач в один день (×1.0 → ×1.5)
5. **Яйца и вылупление** — 3 типа, расширенные дропы (19 записей), лимит 3 бесплатных/неделю
6. **3 персонажа:** Котёнок (cat), Лисёнок (fox), Дракончик (dragon) × 3 редкости × 5 стадий
7. **Эволюция** — 5 стадий по XP: Малыш (0) → Подросток (100) → Взрослый (350) → Мастер (800) → Легенда (1500)
8. **Магазин** — яйца, фоны (6 шт), аксессуары (10 шт, скрыты из UI)
9. **24 достижения** в 6 категориях с 4 тирами (Бронза → Бриллиант)
10. **Daily Reward** — ежедневный бонус, 7-дневный цикл [5, 10, 15, 20, 30, 40, 75 монет]
11. **Отчёт** — статистика за неделю/месяц (страница в Mini App)

### Анти-абуз — 4+ защит
- Заголовок задачи ≥ 3 символов
- Задача «жила» ≥ 2 минут (created_at → done_at)
- Дедупликация (одинаковый title в один день, timezone-aware)
- Дневной кэп монет (100 Free / 200 Premium)
- Первое яйцо только обычное
- Perfect day бонус только 1 раз в день
- Лимит бесплатных яиц — 3/неделю (HTTP 429)

### Уведомления бота о игровых событиях
- 🏆 «Достижение разблокировано!» — при unlock ачивки
- ✨ «Питомец эволюционировал!» — при смене стадии
- 💔 «Стрик потерян!» — при сбросе стрика (если был ≥ 3 дней)
- 🔥 «Стрик в опасности!» — в 21:00 если стрик ≥ 2 дней и нет задач за день

### Структура файлов артов
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

## Фронтенд страницы

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/all` | All.tsx | Все задачи (active/archive табы, фильтр горизонта задач) |
| `/pet` | Pet.tsx | Питомец: Liquid Glass, Mood Widget, мини-фразы, комбо, статистика |
| `/pet/hatch` | PetHatch.tsx | Вылупление яйца (премиальные анимации) |
| `/pet/shop` | PetShop.tsx | Магазин (яйца и фоны) |
| `/pet/achievements` | PetAchievements.tsx | Достижения с тирами Бронза→Бриллиант |
| `/pet/collection` | PetCollection.tsx | Коллекция: Питомцы + Фоны |
| `/today` | Today.tsx | Задачи на сегодня + FocusWidget |
| `/calendar` | Calendar.tsx | Календарь (список + timeline по часам) |
| `/categories` | Categories.tsx | Категории (доступна по прямому URL) |
| `/new` | TaskForm.tsx | Новая задача |
| `/edit/:id` | TaskForm.tsx | Редактирование |
| `/profile` | Profile.tsx | Профиль (тема, язык, горизонт задач, отчёт, промокод) |
| `/profile/report` | Report.tsx | Отчёт за неделю/месяц |
| `/profile/subscription` | Subscription.tsx | Страница подписки |
| `/profile/privacy` | Profile.tsx | Приватность |
| `/profile/archive` | Profile.tsx | Архив задач |
| `/admin` | Admin.tsx | Админ-панель |

---

## Premium подписка — детали

- **Тарифы:** 1 мес = 99 Stars, 3 мес = 249 Stars (-16%), 12 мес = 799 Stars (-33%)
- **Скидка на продление:** 1 мес = 69 Stars (предлагается через 1 день после истечения)
- **Оплата в боте:** `/premium` → картинка (ru) или текст (en) + 3 кнопки тарифов → Stars invoice
- **Оплата в Mini App:** Subscription page → выбор тарифа → `Telegram.WebApp.openInvoice()`
- **Уведомления об истечении:** за 3 дня, в день истечения, скидка через 1 день
- **Персональные предложения:** через 24ч после первого нажатия «Premium», через 24ч после истечения подписки

### Описания Premium (человеческий язык)
- «Безлимитные задачи каждый день»
- «Свои категории»
- «Создавай задачи прямо из чата»
- «Создавай задачи голосовым сообщением»
- «Напоминания заранее»
- «Подзадачи без ограничений»

---

## Команды бота (двуязычные)

- `/start` — приветствие с картинкой (ru) / текстовое приветствие (en)
- `/app` — открыть Mini App
- `/premium` — информация и покупка Premium
- `/new <текст>` — создать задачу(и) из текста (только Premium, multi-task)
- `/help` — список команд
- `/privacy` — приватность
- `/support` — поддержка

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
| `GROQ_API_KEY` | Нет | Для AI-парсинга задач (Groq Llama 3.3 70B). Без него используется regex-парсер |

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): `ruff check` + `tsc --noEmit` при каждом push/PR
- **Cron** (`.github/workflows/cron-tick.yml`): вызывает `/cron/tick` каждые 5 минут
- **Фронтенд:** Vercel (авто-деплой из main, URL: https://tasksbot-five.vercel.app)
- **Бэкенд:** Amvera (URL: https://tasksbot-bloodtrvil.amvera.io, авто-деплой при пуше в main)

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

## Инфраструктура

| Сервис | URL | Аккаунт |
|--------|-----|---------|
| GitHub (репо) | https://github.com/qwertytw8-pixel/tasksbot | qwertytw8-pixel |
| Vercel (фронтенд) | https://tasksbot-five.vercel.app | qwertytw8-pixel |
| Amvera (бэкенд) | https://tasksbot-bloodtrvil.amvera.io | — |
| Amvera (БД) | tasksbot-db (PostgreSQL) | — |

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
| PawIcon | Лапка | TabBar (вкладка «Питомец») |
| HelpIcon | Помощь | Поддержка |
| ShopBagIcon | Сумка | Pet навигация (Магазин) |
| TrophyIcon | Кубок | Pet навигация (Достижения) |
| GridIcon | Сетка | Pet навигация (Коллекция) |
| CoinIcon | Монета ($) | Pet (монеты), Достижения (награды) |
| FireIcon | Огонь | Pet (стрик) |
| TrashXIcon | Корзина с X | PetCollection (удаление питомца) |
| FlagIcon | Флаг | Приоритет |
| StarBadgeIcon | Звезда-бейдж | Достижения (задачи) |
| RocketIcon | Ракета | Достижения (стрик) |
| TargetIcon | Мишень | Достижения (пунктуальность) |
| DiamondIcon | Алмаз | Достижения (идеальные дни) |
| HeartIcon | Сердце | Достижения |
| CrownIcon | Корона | Достижения (покупки) |
| BoltIcon | Молния | Достижения (приоритеты) |
| BarChartIcon | Диаграмма | Профиль (кнопка «Отчёт») |

---

## Что НЕ нужно делать

- **НЕ добавлять аксессуары в UI** — отложены
- **НЕ менять core game mechanics** (монеты, XP, стрик) без согласования
- **НЕ коммитить секреты и .env файлы**
- **НЕ force push в main/master**

---

## История обновлений

### Wave 1 — Liquid Glass + Mood Widget (PR #65)
- Полный редизайн Pet-вкладки: стеклянные карточки, pill-бейджи, анимации
- Mood Widget — индикатор настроения дня на основе выполненных задач
- Мини-фразы питомца — речевой пузырь (ru/en)
- Анимация «дыхания» питомца + floating particles по редкости
- XP-бар с shimmer-анимацией
- Статистика → 2-колоночная стеклянная сетка
- Навигация → glass pill кнопки
- Shop, Achievements, Collection — обновлены (glass styling)

### Wave 2 — Комбо + Тиры + Отчёт (PR #66)
- **Комбо-система** — множитель монет за серию задач в день (×1.0 → ×1.5), бэкенд + фронтенд
- **Многоуровневые достижения** — 24 ачивки с тирами Бронза/Серебро/Золото/Бриллиант, цветные бейджи
- **Отчёт за неделю/месяц** — новый эндпоинт `GET /api/game/report`, страница Report.tsx, кнопка в Профиле
- Новые поля в БД: `combo_count`, `combo_date` (game_profiles), `tier` (game_achievements)

---

## Планы на будущее

### Wave 3 — Engagement (следующий этап)
1. **Ежедневные квесты (Daily Quests)** — 3 случайных задания каждый день с наградами (+20-50 монет). Реролл 1 раз в день за 10 монет. Обновление в 00:00 UTC.
2. **Lucky Spin (колесо удачи)** — бесплатный спин 1 раз в день. Награды: монеты, XP, редкое яйцо (малый шанс). Ещё одна причина зайти каждый день.
3. **Секретные достижения (Easter Eggs)** — скрытые ачивки, которые не отображаются до разблокировки:
   - «Погладил до дыр» — тапнуть по питомцу 10 раз подряд (+25 монет)
   - «Сова» — выполнить задачу в 3:00 ночи (+15 монет)
   - «Не сдавайся» — потерять стрик 3 раза (+30 монет)
   - «Голосовой мастер» — создать 10 задач голосом (+50 монет)
   - «Спидраннер» — выполнить 5 задач за 1 час (+40 монет)
   - «Перфекционист» — 7 идеальных дней подряд (+200 монет)
   - «Коллекционер» — собрать всех питомцев одного типа (+150 монет)
4. **Реакции питомца на задачи (Pet Reactions)** — питомец подпрыгивает / аплодирует / показывает эмоции при выполнении задач.

### Wave 4 — Монетизация + Бот-меню
1. **Premium-воронка:**
   - Мягкие баннеры при 3/5 задачах
   - Premium-предпросмотр на 1 день бесплатно
   - Эмоциональные пуши («Питомец скучает...»)
2. **Бот-меню:**
   - Inline-кнопки для управления задачами без Mini App
   - Reply keyboard для быстрого создания задач
   - Меню с основными действиями

### Backlog (отложено)
| Фича | Причина откладывания |
|------|---------------------|
| Аксессуары для питомцев | Требует пиксельной привязки, сложная реализация |
| Лидерборд | Нужна большая аудитория, приватность |
| Дуэли между пользователями | Сложная архитектура, риск спама |
| Временные бустеры в магазине | Может сломать экономику |
| Звуки | Опционально, низкий приоритет |
| Красная Панда (4-й персонаж) | Нужны новые промпты и ассеты |
| Крафтинг питомцев (Fusion) | Требует баланса экономики, нужна база пользователей |
| Streak Freeze | Заморозка стрика за монеты — отложено |
| Тайм-челленджи / Pomodoro с питомцем | Связать FocusWidget с игровой механикой — отложено |
| Эмоциональные состояния (Mood System с ассетами) | Нужны 15 PNG (5 эмоций × 3 персонажа) |
| Smart-напоминания (AI-анализ) | Анализ паттернов пользователя — на будущее |
| Шаблоны задач (Templates) | На будущее |
| Голосовой дневник / рефлексия | На будущее |
| Интеграция с Telegram-чатами | На будущее |

---

*Последнее обновление: 2026-05-08*
