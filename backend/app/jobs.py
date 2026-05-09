"""Background job scheduler (APScheduler).

Runs the reminder dispatcher every minute and periodic notifications every
5 minutes internally so the bot works on Amvera without relying on external
cron calls.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.scheduler import (
    run_daily_summary,
    run_personal_offers,
    run_streak_at_risk,
    run_subscription_notifications,
    run_tick,
    run_trial_notifications,
)

log = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None
_bot_ref = None


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
    sched.add_job(
        _periodic_wrapper,
        trigger=IntervalTrigger(minutes=5),
        id="periodic",
        replace_existing=True,
    )
    sched.start()
    log.info("scheduler started (tick every 60s, periodic every 5m)")
    return sched


async def _tick_wrapper():
    if _bot_ref is None:
        log.warning("tick_wrapper: no bot instance available")
        return
    try:
        sent = await run_tick(_bot_ref)
        if sent:
            log.info("tick: sent %d reminders", sent)
    except Exception:
        log.exception("tick job failed")


async def _periodic_wrapper():
    if _bot_ref is None:
        return
    try:
        await run_daily_summary(_bot_ref)
        await run_subscription_notifications(_bot_ref)
        await run_personal_offers(_bot_ref)
        await run_streak_at_risk(_bot_ref)
        await run_trial_notifications(_bot_ref)
    except Exception:
        log.exception("periodic job failed")


def set_bot_for_scheduler(bot) -> None:
    global _bot_ref
    _bot_ref = bot


def stop_scheduler() -> None:
    sched = _scheduler
    if sched:
        sched.shutdown()
        log.info("scheduler stopped")
