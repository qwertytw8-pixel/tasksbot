# TasksBot — Telegram Bot + Mini App for Task Management

[![CI](https://github.com/qwertytw8-pixel/tasksbot/actions/workflows/ci.yml/badge.svg)](https://github.com/qwertytw8-pixel/tasksbot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A minimalist task planner inside Telegram: bot + Mini App with categories, reminders, gamification, and native light/dark theme support.

## Features

- **Task Management** — create, categorize, prioritize, set reminders
- **Gamification** — coins, XP, pets (cat/fox/dragon), achievements
- **Daily Quests** — daily challenges with rewards
- **Lucky Spin** — daily wheel of fortune
- **Pet System** — egg hatching, evolution (5 stages), accessories, fusion
- **Premium** — extended features for subscribers
- **Dark/Light Theme** — native Telegram theme support
- **Bilingual** — full Russian and English localization

## Tech Stack

- **Backend:** Python 3.12, [aiogram 3](https://docs.aiogram.dev/), FastAPI, SQLAlchemy 2 (async),
  asyncpg, Alembic, APScheduler.
- **Frontend (Mini App):** Vite + React + TypeScript,
  [@telegram-apps/sdk-react](https://docs.telegram-mini-apps.com/),
  [@telegram-apps/telegram-ui](https://github.com/Telegram-Mini-Apps/TelegramUI).
- **Fonts:** Inter (UI) + Manrope (headings).
- **DB:** PostgreSQL.
- **Hosting (free, no card):** Render Web Service + Neon Postgres + Vercel + GitHub Actions cron.
  See `DEPLOY.md`.

## Project Structure

```
tasksbot/
├── backend/        # aiogram + FastAPI + APScheduler
├── webapp/         # React Mini App
└── assets/         # bot images (welcome screens, etc.)
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # fill in your credentials
python -m app.main
```

### Frontend

```bash
cd webapp
pnpm install
pnpm dev
```

## Documentation

- [Backend README](backend/README.md) — local backend setup
- [Webapp README](webapp/README.md) — local frontend setup
- [DEPLOY.md](DEPLOY.md) — deployment to Render/Neon/Vercel
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor guidelines

## License

[MIT](LICENSE)
