# TasksBot — Backend

aiogram 3 + FastAPI + SQLAlchemy 2 + APScheduler. Handles Telegram webhook, REST API for Mini App, background schedulers.

## Quick Start

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .

cp .env.example .env
# Set BOT_TOKEN, DATABASE_URL, etc.

# For local webhook testing, use ngrok
ngrok http 8080
# Copy the https URL and set PUBLIC_URL in .env

uvicorn app.main:app --reload --port 8080
```

Health check:
- `GET /healthz` — returns `{"status": "ok"}`.
- In Telegram: send `/start` to the bot to verify it responds.

## Key Files

- `app/main.py` — FastAPI app, lifespan, webhook endpoint.
- `app/bot.py` — aiogram dispatcher, command handlers.
- `app/api.py` — REST API (`/api/me`, `/api/categories`, `/api/tasks`).
- `app/db.py` — database models + sessionmaker.
- `app/auth.py` — Telegram Mini App `initData` validation.
- `app/scheduler.py` — APScheduler tick for background jobs.
- `app/config.py` — pydantic-settings configuration.

## Assets

Place `welcome.png` (or .jpg/.webp) in `backend/assets/` — this image is automatically sent when users `/start` the bot.
