from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import MenuButtonWebApp, Update, WebAppInfo
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import router as api_router
from app.api_admin import router as admin_router
from app.api_game import router as game_router
from app.api_subscription import router as subscription_router
from app.bot import configure_bot_commands, dp
from app.config import get_settings
from app.db import Base, ensure_runtime_schema, get_engine
from app.game_seed import ensure_game_schema, seed_game_data
from app.jobs import set_bot_for_scheduler, start_scheduler, stop_scheduler
from app.rate_limit import RateLimitMiddleware
from app.scheduler import run_tick


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
        await ensure_game_schema(conn)
    log.info("db ready")

    # Seed game data (items, achievements, egg drops)
    from app.db import get_sessionmaker
    async with get_sessionmaker()() as seed_session:
        await seed_game_data(seed_session)
    log.info("game seed data ready")

    # Bot
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    app.state.bot = bot

    # Remember bot username for deep-links
    bot_me = await bot.get_me()
    app.state.bot_username = bot_me.username or ""

    try:
        # Webhook — may fail if DNS is not yet propagated (Amvera cold-start)
        try:
            await bot.set_webhook(
                url=settings.webhook_url,
                secret_token=settings.webhook_secret,
                drop_pending_updates=True,
                allowed_updates=dp.resolve_used_update_types(),
            )
            await configure_bot_commands(bot)
            log.info("webhook set: %s", settings.webhook_url)
        except Exception as exc:
            log.warning("webhook setup failed: %s", exc)

        # Menu button — shows "Открыть" in chat list
        try:
            await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(
                    text="Открыть",
                    web_app=WebAppInfo(url=settings.webapp_url),
                ),
            )
            log.info("menu button set")
        except Exception as exc:
            log.warning("menu button failed: %s", exc)

        set_bot_for_scheduler(bot)
        start_scheduler(bot)
        yield
    finally:
        stop_scheduler()
        await bot.session.close()


app = FastAPI(title="tasksbot", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)

app.include_router(api_router)
app.include_router(game_router)
app.include_router(subscription_router)
app.include_router(admin_router)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    import os

    return {
        "status": "ok",
        "build_sha": os.getenv("BUILD_SHA", "unknown"),
        "build_time": os.getenv("BUILD_TIME", "unknown"),
    }


@app.post("/tg/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> dict[str, bool]:
    settings = get_settings()
    if not settings.webhook_secret or x_telegram_bot_api_secret_token != settings.webhook_secret:
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
    if not settings.cron_secret:
        raise HTTPException(status_code=503, detail="cron secret not configured")
    expected = f"Bearer {settings.cron_secret}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="bad cron secret")
    sent = await run_tick(request.app.state.bot)
    return {
        "status": "ok",
        "sent": sent,
    }
