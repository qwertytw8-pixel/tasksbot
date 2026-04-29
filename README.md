# tasksbot — Telegram bot + Mini App для задач

Минималистичный планировщик задач прямо внутри Telegram: бот + Mini App с категориями,
напоминаниями и нативной светлой/тёмной темой.

## Стек

- **Backend:** Python 3.12, [aiogram 3](https://docs.aiogram.dev/), FastAPI, SQLAlchemy 2 (async),
  asyncpg, Alembic, APScheduler.
- **Frontend (Mini App):** Vite + React + TypeScript,
  [@telegram-apps/sdk-react](https://docs.telegram-mini-apps.com/),
  [@telegram-apps/telegram-ui](https://github.com/Telegram-Mini-Apps/TelegramUI).
- **Шрифты:** Inter (UI) + Manrope (заголовки).
- **DB:** PostgreSQL.
- **Hosting:** Fly.io (backend) + Neon (Postgres) + Vercel (Mini App).

## Структура

```
tasksbot/
├── backend/        # aiogram + FastAPI + APScheduler
├── webapp/         # React Mini App
└── assets/         # картинки бота (welcome и т.д.)
```

См. `backend/README.md` и `webapp/README.md` для локального запуска.
См. `DEPLOY.md` (TBD) для деплоя.
