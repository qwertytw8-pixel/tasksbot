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
│   │   ├── api_game.py       # Game API: /api/game/* (профиль, хатч, питомцы, магазин, достижения, удаление)
│   │   ├── api_subscription.py  # API подписки: status, plans, activate-promo, create-invoice
│   │   ├── api_admin.py      # API админки: stats, users, promos CRUD, grant, grant-coins, test-notification
│   │   ├── subscription.py   # Логика подписок: is_premium, can_create_task, лимиты, тарифы
│   │   ├── game.py           # Игровая логика: монеты, XP, стрик, эволюция, ачивки, анти-абуз
│   │   ├── game_models.py    # SQLAlchemy модели игры (7 таблиц)
│   │   ├── game_schemas.py   # Pydantic схемы игры (request/response, включая DeletePetResponse)
│   │   ├── game_seed.py      # Сид-данные: предметы магазина, ачивки, дропы яиц + ensure_game_schema() + авто-миграция image_path
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
│   │   ├── api.ts            # HTTP клиент к бэкенду (включая 11 game API методов + gameDeletePet)
│   │   ├── telegram.ts       # Telegram SDK helpers (getUserLanguage, haptic, etc.)
│   │   ├── theme.ts          # Управление темой (system/light/dark)
│   │   ├── useLocale.ts      # Лёгкий i18n хук: определение языка из Telegram, функция t(ru, en)
│   │   ├── icons.tsx         # SVG иконки (PawIcon, CoinIcon, FireIcon, ShopBagIcon, TrophyIcon, GridIcon, TrashXIcon, StarBadgeIcon, RocketIcon, TargetIcon, DiamondIcon, HeartIcon, CrownIcon, BoltIcon и др.)
│   │   ├── styles.css        # Все стили (CSS-переменные + стили игры + премиальные анимации + toast-стили)
│   │   ├── pages/
│   │   │   ├── Today.tsx     # Задачи на сегодня + FocusWidget
│   │   │   ├── All.tsx       # Все задачи (active/archive табы, фильтр горизонта задач)
│   │   │   ├── Calendar.tsx  # Календарь
│   │   │   ├── Categories.tsx # Категории (доступна по прямому URL, убрана из навбара)
│   │   │   ├── TaskForm.tsx  # Создание/редактирование задачи (приоритет + инлайн-создание категорий)
│   │   │   ├── Profile.tsx   # Профиль (тема, язык, горизонт задач, промокод, поддержка, приватность, архив, сброс онбординга)
│   │   │   ├── Subscription.tsx # Страница подписки (сравнение планов)
│   │   │   ├── Admin.tsx     # Админ-панель (статистика, промокоды, пользователи)
│   │   │   ├── Pet.tsx       # Главный экран питомца (SVG-иконки монет/огня, стрик, XP, навигация с SVG-иконками, интерактивный тап)
│   │   │   ├── PetHatch.tsx  # Экран вылупления яйца (премиальная анимация тряски + раскрытие + частицы + именование)
│   │   │   ├── PetAchievements.tsx # Список достижений (SVG-иконки, прогресс-бары, locked/unlocked, CoinIcon в наградах)
│   │   │   ├── PetShop.tsx   # Магазин (яйца, фоны; аксессуары скрыты). Авто-экипировка фона после покупки
│   │   │   └── PetCollection.tsx # Коллекция: 2 вкладки (Питомцы + Фоны), выбор активного, удаление, экипировка/снятие фона
│   │   ├── components/
│   │   │   ├── TaskRow.tsx   # Компонент задачи (swipe actions с эффектом стекла, checkbox, цветная рамка приоритета)
│   │   │   ├── HourlyTimeline.tsx # iPhone-style timeline по часам (для Calendar)
│   │   │   ├── OnboardingTour.tsx # Онбординг-тур (7 шагов включая «Питомец», spotlight, i18n)
│   │   │   ├── PetView.tsx   # Компонент отображения питомцев — `<img>` с PNG-артами (+ фон)
│   │   │   ├── DailyRewardModal.tsx # **[NEW]** Попап ежедневного бонуса (7-дневный календарь, монетки)
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

### Игровые таблицы (Phase 1 — реализовано)

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
| daily_login_day | DATE | **[NEW]** Дата последнего ежедневного бонуса (nullable) |
| daily_login_streak | INTEGER | **[NEW]** Текущий стрик ежедневного бонуса (0-7, default 0) |
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
- `PATCH /api/tasks/{id}` — обновить задачу (**+ начисление монет/XP при is_done=true**)
- `DELETE /api/tasks/{id}` — удалить задачу
- `POST /api/tasks/{id}/archive` — архивировать
- `POST /api/tasks/{id}/unarchive` — разархивировать
- `GET /api/categories` — категории пользователя
- `POST /api/categories` — создать категорию (только Premium)
- `PUT /api/categories/{id}` — обновить
- `DELETE /api/categories/{id}` — удалить
- `GET /api/privacy` — информация о приватности

### Игра (`api_game.py`) — Phase 1+2+3 реализовано
- `GET /api/game/profile` — игровой профиль (монеты, стрик, XP, активный питомец, фон, статистика дня)
- `POST /api/game/hatch` — вылупить яйцо `{egg_slug: string}` (первое бесплатно, **лимит 3 бесплатных яйца в неделю**, HTTP 429 при превышении)
- `GET /api/game/pets` — все питомцы пользователя
- `POST /api/game/pets/{id}/activate` — сделать питомца активным
- `POST /api/game/pets/{id}/rename` — переименовать питомца `{name: string}`
- `DELETE /api/game/pets/{id}` — **удалить питомца** (если активный — сбрасывает active_pet_id)
- `GET /api/game/shop` — список предметов магазина (с пометкой owned/equipped)
- `POST /api/game/buy` — купить предмет `{item_id: int}` (яйца отклоняются — используй /hatch)
- `POST /api/game/equip` — надеть/снять аксессуар `{pet_id: int, item_id: int|null}`
- `POST /api/game/set-background` — установить фон `{item_id: int|null}` (**null = сбросить на дефолтный**)
- `GET /api/game/achievements` — список достижений (с прогрессом, locked/unlocked)
- `GET /api/game/daily-reward` — **[NEW]** статус ежедневного бонуса `{current_day, claimed_today, rewards[]}`
- `POST /api/game/daily-reward` — **[NEW]** забрать ежедневный бонус `{coins_earned, current_day, next_reward}`

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
- `POST /api/admin/grant-coins` — **[NEW]** выдать монеты `{user_id: int, coins: int}` (1-100000)
- `POST /api/admin/test-notification` — **[NEW]** отправить тестовое уведомление всем админам в Telegram

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

### UI: вкладка «Когда» в TaskForm
Две кнопки-сегмента при создании/редактировании задачи:
- **Без даты** — задача без привязки ко времени (иконка Layers)
- **Дата** — дата + опциональный toggle «Добавить время» (анимированный, при включении появляется WheelTimePicker + выбор напоминания)

### UI: Приоритет задач (цветные рамки)
Четыре кнопки-сегмента «Важность» в TaskForm:
- **Без** (серый, `var(--tb-hint)`) — priority = 0
- **Низкий** (зелёный, `var(--tb-priority-low)`) — priority = 1
- **Средний** (оранжевый, `var(--tb-priority-med)`) — priority = 2
- **Высокий** (красный, `var(--tb-priority-high)`) — priority = 3

В списке задач (TaskRow) приоритет отображается **цветной рамкой** (`border: 1.5px solid` + `border-left: 3.5px solid`) + лёгкий тонированный фон:
- Низкий — зелёная рамка + зеленоватый фон
- Средний — жёлтая/оранжевая рамка + желтоватый фон
- Высокий — красная рамка + красноватый фон
- Без приоритета — обычный вид карточки (без рамки и подсветки)

CSS-переменные приоритетов определены в `:root` и `[data-theme="dark"]` для корректного отображения в обеих темах.

### UI: Навигация (TabBar) — 5 вкладок
**Обновлено (Phase 1 Gamification):** Добавлена вкладка «Питомец». Теперь 5 вкладок:
- **Все** (`/all`) — все задачи
- **Питомец** (`/pet`) — игра: питомец, монеты, XP, стрик
- **Сегодня** (`/today`) — задачи на сегодня
- **Календарь** (`/calendar`) — календарь по дням
- **Профиль** (`/profile`) — настройки, подписка, тема

CSS-класс: `tabbar--five` (grid-template-columns: repeat(5, 1fr)).
Иконка вкладки «Питомец»: PawIcon (SVG лапка — анатомические подушечки с полупрозрачной заливкой).
Страница `/categories` по-прежнему доступна по прямому URL, но убрана из навигации.

**FAB (кнопка «+»)** — скрыт на всех `/pet` страницах (чтобы не перекрывать кнопку «Коллекция»).

### UI: Свайп-действия (Swipe Actions) — эффект стекла
При свайпе влево на задаче раскрываются кнопки действий:
- **Завтра** (жёлтая) — перенести на завтра. **Скрывается, если задача уже на завтра** (`task.due_date === tomorrowISO()`)
- **Готово/Вернуть** (зелёная) — отметить выполненной / снять отметку
- **Архив** (синяя) — архивировать
- **Удалить** (красная) — удалить

**Стиль кнопок — эффект стекла (glassmorphism):**
- `backdrop-filter: blur(16px) saturate(1.4)` — размытие фона за кнопками
- Полупрозрачные градиенты (opacity ~0.82)
- Скруглённые углы: первая кнопка `border-radius: 14px 0 0 14px`, последняя `0 14px 14px 0`
- Небольшой gap между кнопками (2px)

### UI: Создание категории из формы задачи (TaskForm)
В секции «Категория» формы создания/редактирования задачи добавлена кнопка **«+ Новая»**. При нажатии разворачивается инлайн-форма создания категории:
- Поле «Название» (input)
- Поле «Эмодзи» (input, max 4 символа)
- Палитра цветов (8 цветов, такая же как на странице Categories)
- Кнопка «Добавить» — создаёт категорию через `api.createCategory()` и сразу выбирает её

### UI: Календарь — режим Timeline
В Calendar.tsx при выбранной дате доступен переключатель вида:
- **Список** (иконка ListIcon) — обычный список задач
- **По часам** (иконка ClockIcon) — iPhone-style вертикальный timeline (HourlyTimeline.tsx):
  - Сетка 00:00–23:00, задачи распределены по часам из `due_at`
  - Задачи без времени (`has_time=false`) показываются в секции «Весь день» сверху
  - Текущий час подсвечивается акцентным цветом и жирной линией
  - Задачи кликабельны (навигация на `/edit/:id`), показывают приоритет, время и категорию

### UI: Онбординг-тур (OnboardingTour)
Показывается при первом входе нового пользователя (`onboarding_completed = false`):
- **7 шагов:** Приветствие → Навигация (табы) → FAB «+» → **Питомец** → «Сегодня» → «Календарь» → «Профиль»
- Каждый шаг имеет эмодзи-иконку, заголовок и описание
- Все тексты переведены через **i18n** (`t(ru, en)`) — показываются на языке Telegram пользователя
- **Прогресс-бар** наверху tooltip'а (плавная анимация)
- **Spotlight-эффект** — затемнённый фон + яркий/светлый целевой элемент
- **Фиолетовое свечение** вокруг spotlight (box-shadow с rgba(109,93,252))
- Первый шаг — центрированный приветственный экран (без spotlight)
- Кнопки «Пропустить» и «Далее →» / «Начать!» (переведены)
- При завершении вызывается `PATCH /api/me {onboarding_completed: true}`

**Сброс онбординга:** В профиле есть кнопка **«Пройти обучение заново»** — вызывает `PATCH /api/me {onboarding_completed: false}` и редиректит на `/all`, где тур снова запускается.

### UI: Завершённые задачи (граница дня)
Секция «Готово сегодня» использует **границу дня** (полночь), а не скользящие 24 часа. Задачи, выполненные до полуночи текущего дня, скрываются из этой секции.

### UI: Toast-система (in-app уведомления) — РЕАЛИЗОВАНО (PR #57)
Красивые **in-app toast-уведомления** внутри Mini App вместо сырых ошибок:
- **Компонент:** `Toast.tsx` — `ToastProvider` (React Context) + `useToast()` хук
- **4 типа:** `success` (зелёный), `error` (красный), `info` (синий), `achievement` (золотой)
- **Использование:** `const { show } = useToast(); show("Текст", "success");`
- **Авто-скрытие** через 3.5 сек, клик для мгновенного закрытия
- **Где используется:**
  - Лимит бесплатных яиц (429) → красный toast
  - Удаление питомца → синий toast
  - Фон установлен/убран → зелёный/синий toast
  - Имя питомцу дано → зелёный toast
- CSS-стили: slide-in анимация сверху, полупрозрачный backdrop-blur

### UI: Интерактивный питомец (тап-реакция) — РЕАЛИЗОВАНО (PR #57)
На странице **Pet.tsx** при тапе на питомца:
- **Bounce-анимация** (CSS класс `pet-display--tapping`)
- **Haptic feedback** (`haptic("light")`)
- **Эмодзи-частицы** (✨❤️⭐💫🌟) — появляются в точке нажатия, улетают вверх и исчезают
- **Debounce:** анимация длится 300ms
- **Чисто визуальная** — не даёт монеты/XP

### Интернационализация (i18n) — русский + английский

**Полностью реализовано.** Приложение двуязычное (ru/en).

**Фронтенд (webapp):**
- Система i18n: React Context (`I18nProvider`) + хук `useI18n()`, 200+ ключей перевода в файле `i18n.tsx`
- Лёгкий `useLocale.ts` для игровых страниц: `getLocale()` определяет язык из Telegram, `t(ru, en)` выбирает перевод
- Автоопределение языка из Telegram `language_code` (ru → русский, остальное → английский)
- Настройки в Профиле: переключатель языка (Русский / English) + горизонт задач (7/14/30/90/Все)
- Переведены **все** страницы и компоненты: All, Today, Calendar, Profile, TaskForm, Categories, Subscription, TaskRow, FocusWidget, DatePicker, LimitModal, HourlyTimeline, OnboardingTour, **Pet, PetHatch, PetAchievements, PetShop, PetCollection, PetView**
- Даты форматируются с учётом локали (`ru-RU` / `en-US`)
- Горизонт задач фильтрует страницу «Все», сохраняется в `localStorage`
- Выбранный язык сохраняется в `localStorage` (ключ `taskblo_lang`)

**Бот (backend):**
- Все команды и сообщения двуязычные: `/start`, `/help`, `/privacy`, `/support`, `/premium`, `/new`, `/app`
- Платёжные сообщения, подтверждения задач, голосовое распознавание, ошибки, все кнопки — переведены
- Язык определяется по `message.from_user.language_code`
- Английская версия: `/start` и `/premium` — только текст, без картинок
- Описания команд бота зарегистрированы отдельно для русского (`language_code="ru"`) и по умолчанию для английского

### NLP парсинг — два режима

#### Режим 1: AI-парсинг (`nlp_ai.py`) — РЕАЛИЗОВАНО (PR #59)
Использует **Groq Llama 3.3 70B** для разбора задач из произвольного текста/голоса:
- **Промт:** Системный промпт объясняет модели формат вывода (JSON-массив задач)
- **Извлекает:** title, date, time, priority, reminder, category
- **Понимает любую форму речи** — «привет, мне сегодня надо помыть посуду, и ещё сделать сценарий для мультика в 13:00» → 2 задачи с правильными датами/временем
- **Fallback:** если Groq недоступен или вернул ошибку — автоматически используется regex-парсер
- **Функция:** `smart_parse_tasks(text, groq_api_key, tz_name)` — единая точка входа
- **Конфигурация:** env var `GROQ_API_KEY`, модель `llama-3.3-70b-versatile`
- **Лимиты бесплатного тира:** 30 запросов/минуту
- **Latency:** ~500ms на запрос

#### Режим 2: Regex-парсинг (`nlp.py`) — fallback
Парсит русский текст → одну или несколько задач. Поддерживает:

**Базовый парсинг (одна задача):**
- Даты: «сегодня», «завтра», «послезавтра», «в понедельник», «25 мая», «25.05.2025»
- Время: «в 15:00», «в 3 часа»
- Приоритет: «!» или «важно»
- Всё остальное → title задачи

**Расширенный парсинг (multi-task + голос):**

- **Разбивка на несколько задач** (`split_into_tasks()`):
  - Разделители: точка + пробел (`. `), точка с запятой (`;`), союзы «потом», «затем», «далее», «также», «и ещё», «следующая/следующее/следующий»
  - **Запятая** как разделитель — «купить молоко, позвонить маме» → 2 задачи
  - **Союзы:** «а ещё», «плюс», «кроме того», «ну и», «и потом»
  - **Умная разбивка на «и»** — разбивает только когда обе части >= 15 символов (чтобы «купить хлеб и молоко» не разбивалось)
  - Каждый чанк парсится отдельно через `parse_ru()`
  - Пустые чанки (менее 2 символов) автоматически отфильтровываются

- **Глобальный контекст даты:** если дата указана в начале или в первом чанке (напр. «завтра купить молоко, позвонить маме»), она наследуется всеми последующими задачами, у которых нет своей даты

- **Вводные фразы** типа «поставить 2 задачи:», «нужно записать задачи:» — убираются перед разбивкой

- **Фильтрация приветствий и вводных фраз** (`_strip_greetings()`):
  - Привязаны к **началу текста** (`^\s*`) — НЕ затрагивают слова в середине
  - Приветствия: привет, здравствуй*, добрый день/вечер/утро, здорово, хай, хэлло, hello, hi
  - Вводные: слушай, смотри, короче, значит, ну вот, вот, ладно, окей, ок, давай
  - Фразы-связки: у меня (сегодня) такие задачи/дела/планы, вот мои задачи, запиши/добавь/создай (задачу)
  - Применяется в цикле — повторно проверяет после каждого удаления (чтобы обработать цепочки типа «привет, слушай, вот мои задачи...»)
  - Вызывается **один раз** — в `split_into_tasks()` перед разбивкой, а не в `parse_ru()` (чтобы не удалять слова из середины отдельных чанков)

- **Приоритет голосом** (`_extract_voice_priority()`):
  - Распознаёт фразы: «важность средняя», «приоритет высокий», «степень важности низкая» и т.д.
  - Маппинг: низк* → 1, средн* → 2, высок* → 3
  - Фраза удаляется из текста, приоритет присваивается задаче
  - Работает на каждом чанке (каждая задача может иметь свой приоритет)

- **Диапазон времени** (`_extract_time_range()`):
  - Распознаёт: «с 9 до 13», «с 9:00 до 13:30»
  - Начальное время → `due_at` задачи
  - Конечное время → добавляется в `description` (например «до 13:00»)
  - Если задано только «в 9» → обычное время (не диапазон)

**Dataclass `ParsedTask`:**
```python
@dataclass
class ParsedTask:
    title: str
    due_date: date | None = None
    has_time: bool = False
    due_at: datetime | None = None
    remind_minutes_before: int | None = None
    category_name: str | None = None
    priority: int = 0           # 0=без, 1=низкий, 2=средний, 3=высокий
    description: str | None = None  # используется для "до HH:MM" из диапазона времени
```

### Голосовые сообщения
1. Скачивает OGG файл через Telegram Bot API
2. Конвертирует в WAV через ffmpeg (temp-файл, автоудаление через `try/finally`)
3. Транскрибирует:
   - Если `OPENAI_API_KEY` задан → Whisper API (платно, лучше качество)
   - Иначе → Google Speech Recognition (бесплатно)
4. Текст отправляется в `smart_parse_tasks()` → **AI-парсинг через Groq** (или fallback на regex)
5. Каждая задача создаётся отдельно, бот отправляет сводку:
   - Одна задача → «Задача создана: ...» + summary (дата, время, приоритет)
   - Несколько задач → «Создано задач: N» + пронумерованный список с emoji приоритетов

### Текстовые сообщения (Premium)
- Любой текст (не команда) от Premium-пользователя обрабатывается как задача(и)
- Проходит тот же pipeline: `smart_parse_tasks()` → создание задач
- Free-пользователи получают попап «Добавление задач через сообщения доступно с Premium-подпиской»

### Команды бота (двуязычные)
- `/start` — приветствие с картинкой (ru) / текстовое приветствие (en)
- `/app` — открыть Mini App
- `/premium` — информация и покупка Premium (ru: с картинкой, en: только текст)
- `/new <текст>` — создать задачу(и) из текста (только Premium, поддерживает multi-task парсинг, использует `CommandObject` для корректной работы в группах)
- `/help` — список команд
- `/privacy` — приватность
- `/support` — поддержка

Язык команд определяется по `message.from_user.language_code`. Описания команд зарегистрированы отдельно для русского (`language_code="ru"`) и английского (по умолчанию).

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

## Фронтенд страницы

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/all` | All.tsx | Все задачи (active/archive табы, фильтр горизонта задач) |
| `/pet` | Pet.tsx | **Питомец: SVG-иконки монет/огня, стрик, XP, активный питомец с фоном, интерактивный тап (bounce + частицы), навигация с SVG-иконками** |
| `/pet/hatch` | PetHatch.tsx | **Вылупление яйца (премиальные анимации: тряска, вспышка, частицы, раскрытие → экран именования)** |
| `/pet/shop` | PetShop.tsx | **Магазин (яйца и фоны; аксессуары скрыты). Авто-экипировка фона. Toast при лимите 429** |
| `/pet/achievements` | PetAchievements.tsx | **Достижения: SVG-иконки (StarBadge, Rocket, Target, Diamond, Heart, Crown, Bolt), прогресс-бары, CoinIcon в наградах** |
| `/pet/collection` | PetCollection.tsx | **Коллекция: 2 вкладки (Питомцы + Фоны). Питомцы: ранг редкости, имя, активация, удаление. Фоны: установить/убрать** |
| `/today` | Today.tsx | Задачи на сегодня + FocusWidget |
| `/calendar` | Calendar.tsx | Календарь (список + timeline по часам) |
| `/categories` | Categories.tsx | Категории (доступна по прямому URL, убрана из навбара) |
| `/new` | TaskForm.tsx | Новая задача (с инлайн-созданием категорий) |
| `/edit/:id` | TaskForm.tsx | Редактирование |
| `/profile` | Profile.tsx | Профиль (тема, язык, горизонт задач, промокод, поддержка, сброс онбординга) |
| `/profile/subscription` | Subscription.tsx | Страница подписки (сравнение планов) |
| `/profile/privacy` | Profile.tsx | Приватность |
| `/profile/archive` | Profile.tsx | Архив задач |
| `/admin` | Admin.tsx | Админ-панель |

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): `ruff check` + `tsc --noEmit` при каждом push/PR
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

Всё реализовано и работает:
- **AI-парсинг задач** через Groq Llama 3.3 70B (понимает любую форму речи на русском, fallback на regex)
- **Toast-система** — in-app уведомления вместо сырых ошибок
- **Интерактивный питомец** — тап = bounce + haptic + эмодзи-частицы
- **Именование питомцев** — при вылуплении и через коллекцию
- **Коллекция с вкладками** — Питомцы (ранг, имя, удаление) + Фоны (установить/убрать)
- **SVG-иконки для достижений** — 7 иконок (StarBadge, Rocket, Target, Diamond, Heart, Crown, Bolt) + CoinIcon в наградах
- **Фоны отображаются** на странице питомца (PetView с backgroundSlug)
- **Кнопка «Убрать фон»** — сброс на дефолтный вид
- **Уведомления бота** при игровых событиях (ачивка, эволюция, стрик потерян, стрик в опасности)
- **Premium интеграция** в игровую механику (реальная проверка вместо заглушки)
- **Баг свайп-кнопок** исправлен (PR #53)
- Полный CRUD задач с подзадачами, напоминаниями, архивом
- Рекуррентные задачи (daily/weekly/monthly)
- Приоритет задач (4 уровня: без, низкий, средний, высокий) — селектор в форме + **цветная рамка** в списке (border слева + тонированный фон)
- Premium подписка с 3 тарифами (1/3/12 мес) + скидочный тариф renewal (69 Stars)
- Оплата через Telegram Stars — и в боте, и в Mini App (openInvoice)
- Промокоды с лимитом активаций
- Админ-панель (статистика, CRUD промокодов, управление пользователями)
- NLP парсинг текста → задачи (русский язык, **multi-task** — несколько задач из одного сообщения)
- Голосовая транскрибация (Google/Whisper) с **распознаванием приоритета** и **диапазона времени**
- **Фильтрация приветствий** — «Привет, у меня задачки...» → приветствие убирается, задачи парсятся
- **Разбивка на несколько задач** — «пожарить шашлыки с 9 до 13. Потом купить продукты» → 2 отдельные задачи
- **Разбивка по запятым** — «купить молоко, позвонить маме» → 2 задачи
- **Глобальный контекст даты** — «завтра купить молоко, позвонить маме» → обе на завтра
- **Приоритет голосом** — «важность средняя», «приоритет высокий» → автоматически ставится нужный уровень
- **Диапазон времени** — «с 9 до 13» → due_at=09:00, описание «до 13:00»
- Дневной лимит 5 задач для Free (считаются все созданные за сутки, не только активные)
- Попап лимита с SVG иконками и описанием Premium на человеческом языке
- Напоминания: Free — только «Вовремя», Premium — «Заранее» (с enforce на бэкенде)
- Уведомления о подписке: за 3 дня, в день истечения, скидка через 1 день
- Персональные предложения 69 Stars: после первого интереса к Premium + после истечения подписки (каждый 1 раз)
- Premium nudge (уведомление о Premium через 3 сек после /start для Free)
- Кнопка «Открыть» в списке чатов (MenuButtonWebApp)
- Deep-link: `t.me/бот?start=premium` → сразу показывает Premium
- Красивая Premium-промо картинка + картинка поздравления после оплаты
- Тёмная/светлая/системная тема
- **Свайп-действия с эффектом стекла** (backdrop-blur, полупрозрачность, скруглённые углы)
- **Скрытие «Завтра»** если задача уже на завтра
- **Навигация 5 вкладок** (Все, Питомец, Сегодня, Календарь, Профиль)
- **Инлайн-создание категорий** в форме задачи (кнопка «+ Новая»)
- **Онбординг-тур** с прогресс-баром, эмодзи-иконками, spotlight-подсветкой элементов (7 шагов включая «Питомец»), двуязычный (i18n)
- **Сброс онбординга** — кнопка в профиле
- Кастомный DatePicker и TimePicker
- Вкладки «Когда»: «Без даты», «Дата» (с toggle «Добавить время»)
- Календарь по часам (iPhone-style HourlyTimeline) с переключателем Список/Timeline
- Команда `/new` — создание задач текстом (только Premium, multi-task)
- **Завершённые задачи по границе дня** (полночь, а не скользящие 24 часа)
- **Полная интернационализация (i18n)** — русский + английский
- **Геймификация Phase 1 (MVP)** — см. раздел ниже
- **Геймификация Phase 2** — арты подключены, баги исправлены, см. раздел ниже
- **Геймификация Phase 3** — UX-полировка, см. раздел ниже

---

## Геймификация — Phase 1 (MVP) — РЕАЛИЗОВАНО

### Что сделано

#### Ядро игровой механики
1. **Монеты за задачи** — при выполнении задачи (`PATCH /api/tasks/{id}` с `is_done: true`) автоматически начисляются монеты:
   - Базовые: без приоритета=5, низкий=8, средний=12, высокий=18
   - +3 за выполнение до дедлайна
   - +15 за «идеальный день» (все задачи дня выполнены)
   - Множители стрика (Free до ×1.5, Premium до ×2.0)
   - Premium-бонус ×1.5
   - Множитель редкости персонажа (до ×1.2)
   - Дневной кэп: Free 100, Premium 200

2. **XP за задачи** — начисляется одновременно с монетами, но с другими множителями:
   - Множители стрика (Free до ×1.2, Premium до ×1.7)
   - Множитель редкости (до ×1.2)
   - Без Premium-бонуса

3. **Стрик** — серия дней подряд с ≥1 выполненной задачей. Счётчик +1 за каждый следующий день, сброс при пропуске.

4. **Яйца и вылупление** — 3 типа яиц, **расширенные дропы** (19 записей):
   - **Обычное** (бесплатно, лимит 3/неделю) — все 3 персонажа: ~70% common, ~25% rare, ~5% epic
   - **Редкое** (500 монет) — все 3 персонажа: ~75% rare, ~25% epic
   - **Эпическое** (1500 монет) — все 3 персонажа: 100% epic
   - Первое яйцо всегда бесплатное и только обычное (защита от абуза)
   - **Любой персонаж может выпасть из любого яйца** с любой редкостью (равновероятно внутри каждой редкости)

5. **3 персонажа:** Котёнок (cat), Лисёнок (fox), Дракончик (dragon)
   - 3 редкости: Common, Rare, Epic
   - **PNG-арты** — реальные 2D-иллюстрации (не SVG-заглушки)

6. **Эволюция** — 5 стадий по XP:
   - Малыш (0 XP) → Подросток (100 XP) → Взрослый (350 XP) → Мастер (800 XP) → Легенда (1500 XP)
   - Визуальное увеличение персонажа + свечение на стадиях 3+

7. **Магазин** — предметы:
   - 3 яйца (покупка через /hatch, не через /buy)
   - 6 фонов (поляна, ночь, город, космос, вулкан, радуга)
   - 10 аксессуаров (в seed-данных, но **скрыты из UI магазина** — отложены)
   - ~30% предметов Premium-only
   - **Авто-экипировка фона** после покупки

8. **20 достижений** в 6 категориях:
   - Задачи: Первые шаги (1) → Легенда (500)
   - Стрик: На старте (3д) → Несгибаемый (60д)
   - Идеальные дни: 1 → 30
   - Пунктуальность: 5 → 100
   - Приоритеты: 10 → 50
   - Магазин: 1 → 10

9. **Анти-абуз** — 4+ защит:
   - Заголовок задачи ≥ 3 символов
   - Задача «жила» ≥ 2 минут (created_at → done_at)
   - Дедупликация (одинаковый title в один день, timezone-aware)
   - Дневной кэп монет (100 Free / 200 Premium)
   - Первое яйцо только обычное (нельзя получить эпическое бесплатно)
   - Perfect day бонус только 1 раз в день (last_perfect_day_date)
   - Архивированные задачи не считаются для perfect day
   - **Лимит бесплатных яиц** — 3 штуки в неделю (HTTP 429 при превышении)

#### Frontend (5 игровых страниц)
- **Pet.tsx** — главный экран: SVG-иконки монет (CoinIcon) и стрика (FireIcon), XP-бар до следующей стадии, статистика дня, навигация с SVG-иконками (ShopBagIcon, TrophyIcon, GridIcon), **интерактивный тап** (bounce + частицы)
- **PetHatch.tsx** — премиальная анимация вылупления яйца (парение, тряска с ускорением, вспышка, частицы/спарклы, раскрытие → **экран именования** питомца)
- **PetShop.tsx** — магазин с секциями яиц/фонов (аксессуары скрыты), PNG-картинки товаров (64×64), CoinIcon вместо эмодзи, **toast при лимите 429**
- **PetAchievements.tsx** — «Достижения», **SVG-иконки** (StarBadgeIcon, RocketIcon, TargetIcon, DiamondIcon, HeartIcon, CrownIcon, BoltIcon) вместо эмодзи, прогресс-бары, **CoinIcon** вместо 🪙 в наградах
- **PetCollection.tsx** — **2 вкладки:** «Питомцы» (с рангом редкости, именем, активация, **удаление** через TrashXIcon + confirm) + «Фоны» (установить/убрать)
- **PetView.tsx** — `<img>` с PNG-артами: `/game/pets/${characterType}/${rarity}/stage${stage}.png`, **поддержка фона** через `backgroundSlug`

#### Интеграция
- Начисление монет/XP встроено в существующий `PATCH /api/tasks/{id}` (api.py)
- Игровые таблицы создаются автоматически через `ensure_game_schema()` при старте
- Сид-данные (предметы, ачивки, дропы) загружаются через `seed_game_data()` при старте
- **Авто-миграция image_path** — при старте seed_game_data() обновляет пути из `.svg` в `.png`
- **Авто-пересоздание egg_drops** — если количество записей изменилось
- Онбординг обновлён — добавлен шаг «Питомец» (7 шагов вместо 6)

### Phase 2 — Выполнено

#### 1. Уведомления бота о игровых событиях — РЕАЛИЗОВАНО (PR #54)
Бот отправляет Telegram-сообщения при игровых событиях (двуязычные: ru + en):
- 🏆 **«Достижение разблокировано!»** — при unlock ачивки (иконка + название + бонус монет)
- ✨ **«Питомец эволюционировал!»** — при смене стадии (название стадии + уровень)
- 💔 **«Стрик потерян!»** — при сбросе стрика, если был ≥ 3 дней
- 🔥 **«Стрик в опасности!»** — в 21:00 по времени пользователя, если стрик ≥ 2 дней и нет выполненных задач за день

**Реализация:**
- Уведомления fire-and-forget (try/except, ошибки логируются, не ломают основной флоу)
- Функция `_send_game_notifications()` в `api.py` — вызывается из `update_task()` при завершении задачи
- Функция `run_streak_at_risk()` в `scheduler.py` — зарегистрирована в `cron/tick` endpoint (`main.py`)
- Bot instance доступен через `request.app.state.bot`

#### 2. Интеграция с Premium — РЕАЛИЗОВАНО (PR #54)
Заменены заглушки `is_premium = False` на реальную проверку `subscription.is_premium()`:
- **`GET /api/game/profile`** (`api_game.py`) — возвращает правильные лимиты (daily_cap 200 vs 100, повышенные streak-множители)
- **`POST /api/game/buy`** (`api_game.py`) — Premium-предметы теперь доступны для покупки подписчикам
- **`PATCH /api/tasks/{id}`** (`api.py`) — уже использовал реальную проверку для `award_task_completion`

#### 3. PNG-арты подключены — РЕАЛИЗОВАНО (PR #55)
- **64 арта обработаны:** фон удалён (rembg AI), JPEG → PNG с прозрачностью, ресайз по спеке
- **45 питомцев** (3 персонажа × 5 стадий × 3 редкости) → `webapp/public/game/pets/`
- **3 яйца** (common, rare, epic) → `webapp/public/game/eggs/`
- **6 фонов** (meadow, night, city, space, volcano, rainbow) → `webapp/public/game/bg/`
- **10 аксессуаров** → `webapp/public/game/accessories/` (обработаны, но скрыты из UI)
- SVG-заглушки (`CatSVG`, `FoxSVG`, `DragonSVG`) удалены → заменены на `<img>` с реальными PNG
- `game_seed.py` — все `image_path` обновлены на `.png`

#### 4. Баг-фиксы и новые фичи — РЕАЛИЗОВАНО (PR #56)
- **Картинки в магазине** — авто-миграция `image_path` в БД при старте
- **Покупка фона** — авто-экипировка после покупки
- **FAB (кнопка «+»)** — скрыт на `/pet` страницах (не перекрывает «Коллекция»)
- **SVG-иконки вместо эмодзи** — CoinIcon (монета), FireIcon (огонь), ShopBagIcon, TrophyIcon, GridIcon для навигации
- **Удаление питомцев** — `DELETE /api/game/pets/{id}` + кнопка удаления в коллекции
- **Лимит бесплатных яиц** — 3/неделю, HTTP 429 при превышении
- **«Ачивки» → «Достижения»** (переименовано)
- **Расширенные дропы яиц** — 19 записей, авто-пересоздание при изменении

#### 5. Премиальные CSS-анимации — РЕАЛИЗОВАНО (PR #55)
10+ анимаций `@keyframes`:
- `pet-egg-float` — парение яйца (лёгкое покачивание вверх-вниз)
- `pet-egg-shake` — тряска яйца при вылуплении (усиливается)
- `pet-egg-shake-intense` — усиленная тряска
- `pet-egg-crack-flash` — вспышка при раскрытии
- `pet-egg-particles` — разлетающиеся частицы скорлупы
- `pet-egg-sparkle` — спарклы при появлении питомца
- `pet-reveal-grow` — плавное появление питомца с увеличением
- `pet-evolve-pulse` — пульсация при эволюции
- `shop-buy-pulse` — анимация покупки в магазине
- Разные вариации для разных редкостей (common/rare/epic)

### Phase 3 — Выполнено

#### 1. Перерисованы 3 SVG-иконки (более премиальные) — РЕАЛИЗОВАНО (PR #57)
- **CoinIcon** — золотой кружок с блеском, пунктирный внутренний круг, символ «$» по центру (bold), полупрозрачная заливка
- **FireIcon** — двойное пламя (большой + малый язык огня), оранжево-красный, полупрозрачная заливка
- **PawIcon** — анатомическая лапка: большая подушечка + 4 пальчика, полупрозрачная заливка (opacity 0.15)

Все иконки — SVG, inline в `icons.tsx`, используют `viewBox="0 0 24 24"`.

#### 2. Аксессуары убраны из магазина — РЕАЛИЗОВАНО (PR #57)
Секция аксессуаров скрыта из UI `PetShop.tsx`. Данные остаются в `game_seed.py` и БД.

#### 3. Коллекция с вкладками (Питомцы + Фоны) — РЕАЛИЗОВАНО (PR #57)
- **Вкладка «Питомцы»:** ранг редкости (цветная метка: common серая, rare фиолетовая, epic золотая), имя, кнопка активации, кнопка удаления (TrashXIcon)
- **Вкладка «Фоны»:** список купленных фонов с превью, кнопка «Установить» / **«Убрать»** (сброс на дефолтный, PR #58)

#### 4. Именование питомцев при вылуплении — РЕАЛИЗОВАНО (PR #57)
После анимации вылупления — фаза `"naming"`:
- Экран «Как назовёшь?» с полем ввода
- Кнопка «Дать имя» (вызывает `api.gameRenamePet()`)
- Кнопка «Пропустить» (имя остаётся пустым)
- Toast подтверждение при именовании

#### 5. Toast-система — РЕАЛИЗОВАНО (PR #57)
См. секцию «UI: Toast-система» выше.

#### 6. SVG-иконки для достижений — РЕАЛИЗОВАНО (PR #57)
7 новых SVG-иконок в `icons.tsx`:
- **StarBadgeIcon** — звезда (для задач)
- **RocketIcon** — ракета (для стрика)
- **TargetIcon** — мишень (для пунктуальности)
- **DiamondIcon** — алмаз (для идеальных дней)
- **HeartIcon** — сердце
- **CrownIcon** — корона (для покупок)
- **BoltIcon** — молния (для приоритетов)
- **CoinIcon** заменила эмодзи 🪙 в строке награды

#### 7. Интерактивный питомец — РЕАЛИЗОВАНО (PR #57)
См. секцию «UI: Интерактивный питомец» выше.

#### 8. Фикс отображения фона — РЕАЛИЗОВАНО (PR #58)
- Исправлен баг: slug `bg_meadow` не матчил файл `meadow.png`
- `backgroundSlug` теперь корректно передаётся в PetView
- Добавлена кнопка **«Убрать»** в Коллекции → Фоны для сброса на дефолт

#### 9. AI-парсинг задач (Groq) — РЕАЛИЗОВАНО (PR #59)
- Новый модуль `nlp_ai.py`
- Groq Llama 3.3 70B с системным промптом для разбора задач
- Автоматический fallback на regex-парсер при ошибке
- `smart_parse_tasks()` — единая точка входа
- Интегрировано в `bot.py` для текстовых и голосовых сообщений
- Новая env-переменная: `GROQ_API_KEY`

### Структура файлов артов (текущая)
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

**Единый стиль артов:**
- 2D flat vector illustration, thick black outline, cel-shaded
- Bright solid colors, front-facing symmetrical pose, sitting upright
- Chibi proportions (1:1.2 head-to-body), round soft shapes
- Minimal shading with one shadow tone, white highlight dot in each eye
- Размеры: питомцы 512×512, яйца 512×512, фоны 1024×1024, аксессуары 256×256
- Формат: PNG с прозрачным фоном (фоны — с заполнением)

**Визуальные отличия редкостей (при одинаковой позе и стиле):**
- **Common** — базовые цвета, без эффектов
- **Rare** — фиолетовые акценты (кончики ушей, хвост, лапы) + фиолетовые глаза
- **Epic** — золотые акценты (кончики ушей, хвост, лапы) + золотые глаза + звезда на лбу

**Визуальные отличия стадий (при одинаковой позе):**
- Стадии 1-3: персонаж растёт (baby → teen → adult), добавляются детали
- Стадия 4 (Мастер): добавляется небольшая аура-нимб за головой
- Стадия 5 (Легенда): аура + три маленькие фигурки (звёзды/кристаллы) над головой

---

## Баги — Все исправлены

### ~~1. Свайп-кнопки видны при микросвайпе~~ — ИСПРАВЛЕНО (PR #53)
Привязаны пороги `visibility`, `opacity` и `pointerEvents` к константе `SWIPE_THRESHOLD` (40px). Кнопки полностью скрыты до момента активации свайпа, после чего плавно появляются.

### ~~2. Картинки в магазине не отображаются~~ — ИСПРАВЛЕНО (PR #56)
БД хранила старые `.svg` пути. Добавлена авто-миграция `image_path` в `seed_game_data()`.

### ~~3. Покупка фона ничего не делает~~ — ИСПРАВЛЕНО (PR #56)
Добавлена авто-экипировка фона сразу после покупки (`gameSetBackground` вызывается после `gameBuy`).

### ~~4. FAB перекрывает «Коллекция»~~ — ИСПРАВЛЕНО (PR #56)
FAB скрыт на всех `/pet` страницах (добавлен в `HIDE_FAB_ON`).

### ~~5. Фон не отображается на странице питомца~~ — ИСПРАВЛЕНО (PR #58)
Slug `bg_meadow` не матчил файл `meadow.png`, и `backgroundSlug` не передавался в PetView. Исправлено.

---

## Premium подписка — детали
- **Тарифы:** 1 мес = 99 Stars, 3 мес = 249 Stars (-16%), 12 мес = 799 Stars (-33%)
- **Скидка на продление:** 1 мес = 69 Stars (предлагается через 1 день после истечения)
- **Оплата в боте:** `/premium` → картинка (ru) или текст (en) + 3 кнопки тарифов → Stars invoice
- **Оплата в Mini App:** Subscription page → выбор тарифа → `Telegram.WebApp.openInvoice()`
- **Backend endpoint:** `POST /api/subscription/create-invoice` — создаёт invoice link (поддерживает `1m`, `3m`, `12m`, `renewal_1m`)
- **Callback `show_premium`:** показывает /premium из любой кнопки
- **Callback `renew_discount`:** выставляет инвойс со скидкой (69 Stars за месяц)
- **Push при лимите:** при создании 6-й задачи за день бот шлёт уведомление
- **Промо картинки:** `backend/assets/premium.png` (промо), `premium_success.png` (поздравление)
- **Уведомления об истечении:**
  - За 3 дня: «Подписка скоро закончится» + кнопка «Продлить»
  - В день истечения: «Подписка истекла» + кнопка «Продлить»
  - Через 1 день: «Специальное предложение! 69 Stars вместо 99 Stars» + кнопка оплаты
  - Каждое уведомление — 1 раз (трекинг per-subscription)
- **Персональные предложения (run_personal_offers):**
  - Через 24ч после первого нажатия «Premium» (если не подписался) — 69 Stars
  - Через 24ч после истечения подписки (если не продлил) — 69 Stars
  - Каждый триггер — максимум 1 раз за всё время

### Описания Premium (человеческий язык)
Везде используются понятные описания вместо технических:
- «Безлимитные задачи каждый день» (не «Безлимит задач»)
- «Свои категории»
- «Создавай задачи прямо из чата» (не «AI-парсинг текстовых сообщений»)
- «Создавай задачи голосовым сообщением» (не «AI-парсинг голосовых»)
- «Напоминания заранее»
- «Подзадачи без ограничений»

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
| **CoinIcon** | **Монета ($)** | **Pet (монеты), Достижения (награды)** |
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

---

## Будущие планы (Phase 4)
- Красная Панда как 4-й персонаж
- Аксессуары (наложение поверх питомцев — пиксельная привязка)
- Звуки (опционально)
- Больше фонов и достижений
- Пользователь хочет обновить SVG-иконки (CoinIcon, FireIcon, PawIcon) — возможно, заменит на свои кастомные

### Что НЕ нужно делать:
- **НЕ добавлять аксессуары в UI** — отложены
- **НЕ менять core game mechanics** (монеты, XP, стрик)
- **НЕ коммитить секреты и .env файлы**
- **НЕ force push в main/master**

---

## Инфраструктура — текущая

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

**Когда будешь работать с этим проектом, попроси у пользователя GitHub Personal Access Token с правами `repo` для доступа к репозиторию.**

---

## ⚠️ ТЕКУЩИЕ БАГИ И НЕЗАВЕРШЁННЫЕ ЗАДАЧИ (обновлено 2026-05-05)

> **Этот раздел — для следующей нейросети. Здесь собраны все известные проблемы и что было сделано.**

### Что было сделано (PR #60 + PR #61, оба замержены в main)

1. **AI-парсинг (Groq) — `nlp_ai.py`**: Переписан системный промпт. Добавлены:
   - Раздел «Правила приоритета» с правилом ГЛОБАЛЬНЫХ модификаторов
   - Пример: «пописать в 13:00, залить жижу в 14:00, выключить свет в 19:00. У всех задач приоритет высокий» → 3 задачи, все с priority=high
   - Правило «reminder = null если пользователь НЕ просил напоминание»
   - **СТАТУС: Код замержен, но пользователь говорит что изменения не появились в боте**

2. **Daily Reward (ежедневный бонус) — `api_game.py` + `DailyRewardModal.tsx`**:
   - Backend: GET/POST `/api/game/daily-reward`
   - Расписание наград: [5, 10, 15, 20, 30, 40, 75] монет (7 дней)
   - Стрик сбрасывается если пропуск > 1 день, цикл повторяется после 7-го дня
   - Frontend: модалка с 7-дневной сеткой, пульсирующая анимация текущего дня
   - Показывается при первом входе за день (если onboarding_completed=true)
   - Миграция в `game_seed.py`: добавляет колонки `daily_login_day` и `daily_login_streak` в game_profiles
   - **СТАТУС: Код замержен, НЕ ПРОВЕРЕНО — пользователь не видел модалку, нужно тестировать**

3. **Админка: выдача монет — `api_admin.py` + `Admin.tsx`**:
   - Endpoint: POST `/api/admin/grant-coins` (user_id + coins, валидация 1-100000)
   - Создаёт GameProfile если не существует
   - Инкрементирует coins и total_coins_earned
   - Frontend: новая вкладка «🪙 Выдать монеты» в Admin.tsx
   - **СТАТУС: Код замержен, НЕ ПРОВЕРЕНО**

4. **Тест уведомлений — `api_admin.py` + `Admin.tsx`**:
   - Endpoint: POST `/api/admin/test-notification`
   - Отправляет тестовое сообщение всем админам через Telegram бот
   - Кнопка «🔔 Тест уведомлений» в админ-панели (вкладка «📊 Статистика»)
   - **СТАТУС: Код замержен, НЕ ПРОВЕРЕНО**

5. **TypeScript fix (PR #61)**: Исправлен импорт `DailyRewardStatus` — добавлен `type` keyword для `verbatimModuleSyntax`

### 🔴 КРИТИЧЕСКИЕ БАГИ — нужно починить

**БАГ 1: Изменения не появились в боте после деплоя на Amvera**
- Пользователь замержил PR #60 и #61, Amvera пересобрал и задеплоил (логи показывают exit code 0, все зависимости установлены)
- Но пользователь говорит «то, что мы исправляли, оно почему-то не появилось в самом боте»
- Amvera логи показывают: `db ready`, `game seed data ready`, `webhook set`, API отвечает 200 OK
- **Возможные причины:**
  1. Amvera мог забрать старый код (проверить какой коммит в контейнере)
  2. Фронтенд-кеш (Telegram WebApp кеширует) — попросить пользователя очистить кеш Mini App
  3. Бэкенд работает, но миграция `daily_login_day`/`daily_login_streak` не применилась (проверить SQL)
  4. Telegram WebView кеширует статику — добавить ?v= к URL или проверить cache headers
- **Что сделать:**
  1. Проверить версию кода на Amvera: добавить `/healthz` endpoint с Git SHA или version
  2. Попросить пользователя: очистить данные Mini App (Telegram → бот → ⋯ → Reload page / Clear data)
  3. Проверить что SQL миграция `ensure_game_schema()` в `game_seed.py` реально добавила колонки (логов ошибок нет, но молчаливый fail возможен)
  4. Проверить `App.tsx` — логика показа DailyRewardModal (зависит от `onboarding_completed` и API ответа)

**БАГ 2: CRON_SECRET не настроен → напоминания не работают**
- Логи Amvera: `POST /cron/tick HTTP/1.1" 403 Forbidden`
- GitHub Actions cron стучится каждые 5 минут, но CRON_SECRET на GitHub и Amvera не совпадают
- **Что сделать:**
  1. Сгенерировать новый CRON_SECRET (любая строка, например результат `openssl rand -hex 16`)
  2. Добавить ОДИНАКОВОЕ значение в оба места:
     - Amvera → Переменные окружения → `CRON_SECRET` = <значение>
     - GitHub → Settings → Secrets → Actions → `CRON_SECRET` = <значение>
  3. Также проверить что `PUBLIC_URL` в GitHub secrets = `https://tasksbot-bloodtrvil.amvera.io`
  4. После обновления Amvera — перезапустить приложение
  5. Проверить что cron/tick теперь возвращает 200 OK

**БАГ 3: AI-парсинг — качество не проверено**
- Промпт переписан, но пользователь ещё не тестировал голосовое с «у всех задач приоритет высокий»
- Groq LLM не гарантирует 100% правильный парсинг — нужно тестировать разные фразы
- **Что сделать:**
  1. Отправить голосовое: «пописать в 13:00, залить жижу завтра в 14:00, выключить свет послезавтра в 19:00. У всех задач приоритет высокий»
  2. Проверить: 3 задачи, все с priority=high, правильные даты и времена
  3. Если не работает — посмотреть логи бэкенда, какой JSON вернул Groq

### 🟡 НЕ ПРОВЕРЕННЫЕ ФИЧИ

1. **Daily Reward модалка** — должна появиться при первом входе за день, если onboarding пройден
2. **Админ: выдача монет** — вкладка «🪙 Выдать монеты», ввести user_id + количество
3. **Тест уведомлений** — кнопка «🔔 Тест уведомлений» в статистике
4. **AI-парсинг глобального приоритета** — голосовое с «у всех приоритет высокий»

### 🟢 ЧТО РАБОТАЕТ

- Vercel фронтенд: деплой OK, последний деплой DD2UepK7Z (Production, Ready)
- Amvera бэкенд: контейнер запущен, API отвечает 200 OK, webhook установлен
- CI: ruff lint + tsc typecheck — оба проходят
- Все PR замержены в main

### Инфраструктура — деплой

- **Vercel**: Автодеплой при пуше в main. Работает.
- **Amvera**: GitHub интеграция подключена (аккаунт `qwertytw8-pixel`, репо `tasksbot`). Автодеплой при пуше в main.
  - Раньше был подключен старый GitHub (`ClampSerfScoop`) — это было причиной того что обновления не попадали.
  - Теперь подключен правильный аккаунт.
- **GitHub Actions secrets (нужно настроить):**
  - `PUBLIC_URL` = `https://tasksbot-bloodtrvil.amvera.io`
  - `CRON_SECRET` = (должен совпадать с переменной на Amvera)

### Ключевые файлы которые были изменены

| Файл | Что изменено |
|------|-------------|
| `backend/app/nlp_ai.py` | Переписан системный промпт Groq — глобальные модификаторы приоритета |
| `backend/app/api_game.py` | Добавлены GET/POST `/api/game/daily-reward` |
| `backend/app/api_admin.py` | Добавлены POST `/api/admin/grant-coins` и `/api/admin/test-notification` |
| `backend/app/game_models.py` | Добавлены поля `daily_login_day`, `daily_login_streak` в GameProfile |
| `backend/app/game_schemas.py` | Добавлены схемы `DailyRewardStatus`, `DailyRewardClaim` |
| `backend/app/game_seed.py` | Добавлена миграция для daily_login колонок (DO block, IF NOT EXISTS) |
| `backend/app/schemas.py` | Добавлена схема `AdminGrantCoinsIn` |
| `webapp/src/api.ts` | Добавлены интерфейсы и API-методы для daily reward, grant-coins, test-notification |
| `webapp/src/components/DailyRewardModal.tsx` | **Новый файл** — модалка ежедневного бонуса |
| `webapp/src/App.tsx` | Добавлена логика показа DailyRewardModal при входе |
| `webapp/src/pages/Admin.tsx` | Добавлены вкладка «🪙 Выдать монеты» и кнопка тест уведомлений |
| `webapp/src/styles.css` | Стили для DailyRewardModal (сетка, анимации, кнопки) |

### Daily Reward — детали реализации

**Backend (`api_game.py`):**
- Расписание: `DAILY_REWARDS = [5, 10, 15, 20, 30, 40, 75]`
- GET: возвращает текущий день стрика, claimed_today, массив наград
- POST: проверяет что не забирали сегодня, проверяет стрик (gap > 1 день = reset), инкрементирует day (1-7), начисляет монеты, после 7 — цикл
- Стрик: `daily_login_streak` хранит текущий день (1-7), `daily_login_day` — дату последнего клейма

**Frontend (`DailyRewardModal.tsx`):**
- 7 ячеек с днями (Пн-Вс), показывает награду за каждый день
- Собранные дни — зелёная галка, текущий — пульсирующая рамка
- Кнопка «Забрать» / «Уже забрано»
- Закрывается по крестику или после сбора награды

**Frontend (`App.tsx`):**
- При загрузке: если `onboarding_completed=true`, запрашивает GET `/api/game/daily-reward`
- Если `claimed_today=false` — показывает модалку

### Pydantic-схемы (новые)

```python
# game_schemas.py
class DailyRewardStatus(BaseModel):
    current_day: int = 0
    claimed_today: bool = False
    rewards: list[int] = []

class DailyRewardClaim(BaseModel):
    coins_earned: int
    current_day: int
    next_reward: int | None = None

# schemas.py
class AdminGrantCoinsIn(BaseModel):
    user_id: int
    coins: int = Field(ge=1, le=100_000)
```

### Алгоритм отладки (для следующей нейросети)

1. **Проверь какой код реально на Amvera:**
   - Добавь в `/healthz` endpoint информацию о версии (Git SHA или дату билда)
   - Или проверь логи Amvera — какой коммит был собран
   
2. **Проверь миграцию daily_login:**
   - В логах Amvera при старте должно быть `game seed data ready` (есть ✅)
   - Но сама миграция DO block может молча пройти без добавления колонок если синтаксис некорректный для конкретной версии PostgreSQL
   - Проверить: `SELECT column_name FROM information_schema.columns WHERE table_name='game_profiles' AND column_name IN ('daily_login_day','daily_login_streak');`

3. **Проверь фронтенд-кеш:**
   - Telegram WebApp агрессивно кеширует
   - Пользователь должен: Telegram → бот → ⋯ → Reload Mini App / Clear data
   - Или: Добавить версионирование к URL (query param ?v=xxx)

4. **Проверь CRON_SECRET:**
   - Логи: `POST /cron/tick 403` = секреты не совпадают
   - Нужно установить одинаковое значение на Amvera и в GitHub secrets
