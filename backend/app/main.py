from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import Update
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.bot import configure_bot_commands, dp
from app.config import get_settings
from app.db import Base, ensure_runtime_schema, get_engine
from app.scheduler import run_daily_summary, run_tick


def _setup_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s | %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    _setup_logging(settings.log_level)
    log = logging.getLogger("startup")

    # DB: create tables if not exist (for first run; later — alembic)
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await ensure_runtime_schema(conn)
    log.info("db ready")

    # Bot
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    app.state.bot = bot

    # Webhook
    await bot.set_webhook(
        url=settings.webhook_url,
        secret_token=settings.webhook_secret,
        drop_pending_updates=True,
        allowed_updates=dp.resolve_used_update_types(),
    )
    await configure_bot_commands(bot)
    log.info("webhook set: %s", settings.webhook_url)

    try:
        yield
    finally:
        await bot.session.close()


app = FastAPI(title="tasksbot", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/migrate/neon")
async def migrate_neon(
    request: Request,
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    settings = get_settings()
    if authorization != f"Bearer {settings.cron_secret}":
        raise HTTPException(status_code=403, detail="bad secret")
    payload = await request.json()
    statements = payload.get("statements", [])
    if not statements:
        raise HTTPException(status_code=400, detail="no statements")
    engine = get_engine()
    from sqlalchemy import text as sa_text
    ok = 0
    errors = []
    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(sa_text(stmt))
                ok += 1
            except Exception as e:
                errors.append(f"{str(e)[:200]}")
    return JSONResponse({"status": "migrated", "ok": ok, "errors_count": len(errors), "errors": errors[:10]})


@app.post("/tg/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> dict[str, bool]:
    settings = get_settings()
    if x_telegram_bot_api_secret_token != settings.webhook_secret:
        raise HTTPException(status_code=403, detail="bad secret")
    payload = await request.json()
    update = Update.model_validate(payload, context={"bot": request.app.state.bot})
    await dp.feed_update(bot=request.app.state.bot, update=update)
    return {"ok": True}


@app.post("/cron/tick")
async def cron_tick(
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict[str, int | str]:
    settings = get_settings()
    expected = f"Bearer {settings.cron_secret}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="bad cron secret")
    sent = await run_tick(request.app.state.bot)
    summaries = await run_daily_summary(request.app.state.bot)
    return {"status": "ok", "sent": sent, "summaries": summaries}
