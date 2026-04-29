# tasksbot — backend

aiogram 3 + FastAPI + SQLAlchemy 2 + APScheduler. Один процесс, один сервис: webhook от Telegram,
REST API для Mini App, фоновые напоминания.

## Локальный запуск

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .

cp .env.example .env
# заполни BOT_TOKEN, DATABASE_URL и т.д.

# для локального webhook нужен публичный URL — самый простой способ — ngrok
ngrok http 8080
# скопируй https URL → положи в .env как PUBLIC_URL

uvicorn app.main:app --reload --port 8080
```

Проверки:
- `GET /healthz` — должен вернуть `{"status":"ok"}`.
- В Telegram: открой бота → `/start` → должна появиться кнопка «Открыть приложение».

## Структура

- `app/main.py` — FastAPI, lifespan, webhook endpoint.
- `app/bot.py` — aiogram dispatcher, хэндлеры команд.
- `app/api.py` — REST API (`/api/me`, `/api/categories`, `/api/tasks`).
- `app/db.py` — модели + sessionmaker.
- `app/auth.py` — проверка `initData` от Telegram Mini App.
- `app/scheduler.py` — APScheduler tick раз в минуту, рассылающий напоминания.
- `app/config.py` — pydantic-settings.

## Картинки

Положи `welcome.png` (или .jpg/.webp) в `backend/assets/` — бот автоматически
отправит её в `/start` как заглавное фото.
