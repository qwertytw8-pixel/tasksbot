# tasksbot — Telegram bot + Mini App для задач

[![CI](https://github.com/qwertytw8-pixel/tasksbot/actions/workflows/ci.yml/badge.svg)](https://github.com/qwertytw8-pixel/tasksbot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Минималистичный планировщик задач прямо внутри Telegram: бот + Mini App с категориями,
напоминаниями, gamification и нативной светлой/тёмной темой.

## Возможности

- **Управление задачами** — создание, категории, приоритеты, напоминания
- **Gamification** — монеты, XP, питомцы (кот/лиса/дракон), достижения
- **Daily Quests** — ежедневные задания с наградами
- **Lucky Spin** — колесо удачи раз в день
- **Pet System** — вылупление яиц, эволюция (5 стадий), аксессуары, фьюжн
- **Premium** — расширенные возможности для подписчиков
- **Тёмная/светлая тема** — нативная поддержка Telegram

## Стек

- **Backend:** Python 3.12, [aiogram 3](https://docs.aiogram.dev/), FastAPI, SQLAlchemy 2 (async),
  asyncpg, Alembic, APScheduler.
- **Frontend (Mini App):** Vite + React + TypeScript,
  [@telegram-apps/sdk-react](https://docs.telegram-mini-apps.com/),
  [@telegram-apps/telegram-ui](https://github.com/Telegram-Mini-Apps/TelegramUI).
- **Шрифты:** Inter (UI) + Manrope (заголовки).
- **DB:** PostgreSQL.
- **Hosting (free, no card):** Render Web Service + Neon Postgres + Vercel + GitHub Actions cron.
  См. `DEPLOY.md`.

## Структура

```
tasksbot/
├── backend/        # aiogram + FastAPI + APScheduler
├── webapp/         # React Mini App
└── assets/         # картинки бота (welcome и т.д.)
```

## Быстрый старт

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # заполни свои данные
python -m app.main
```

### Frontend

```bash
cd webapp
pnpm install
pnpm dev
```

## Документация

- [Backend README](backend/README.md) — локальный запуск бэкенда
- [Webapp README](webapp/README.md) — локальный запуск фронтенда
- [DEPLOY.md](DEPLOY.md) — деплой на Render/Neon/Vercel
- [CONTRIBUTING.md](CONTRIBUTING.md) — руководство для контрибьюторов

## Лицензия

[MIT](LICENSE)
