"""Background job scheduler (APScheduler).

Runs the reminder dispatcher every minute internally so the bot works on
Amvera without relying on external cron calls.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.scheduler import run_tick

log = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    return _scheduler


def start_scheduler(bot) -> AsyncIOScheduler:
    sched = get_scheduler()
    if sched.get_job("tick"):
        return sched
    sched.add_job(
        _tick_wrapper,
        trigger=IntervalTrigger(minutes=1),
        id="tick",
        replace_existing=True,
    )
    sched.start()
    log.info("scheduler started (tick every 60s)")
    return sched


async def _tick_wrapper():
    bot = getattr(_tick_wrapper, "_bot", None)
    if bot is None:
        log.warning("tick_wrapper: no bot instance available")
        return
    try:
        await run_tick(bot)
    except Exception:
        log.exception("tick job failed")


def set_bot_for_scheduler(bot) -> None:
    _tick_wrapper._bot = bot


def stop_scheduler() -> None:
    sched = _scheduler
    if sched:
        sched.shutdown()
        log.info("scheduler stopped")
