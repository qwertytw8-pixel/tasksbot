"""Simple in-memory rate limiting middleware for FastAPI.

Uses a sliding-window counter per user (Telegram ID extracted from
the initData header) with configurable limits per route group.
"""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# (max_requests, window_seconds)
RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/tasks": (60, 60),       # 60 req/min for task CRUD
    "/api/game": (30, 60),        # 30 req/min for game endpoints
    "/api/subscription": (10, 60),  # 10 req/min for subscription
    "/api/admin": (20, 60),       # 20 req/min for admin
}

DEFAULT_LIMIT = (120, 60)  # 120 req/min default

_buckets: dict[str, list[float]] = defaultdict(list)


def _match_prefix(path: str) -> tuple[int, int]:
    for prefix, limit in RATE_LIMITS.items():
        if path.startswith(prefix):
            return limit
    return DEFAULT_LIMIT


def _extract_user_key(request: Request) -> str | None:
    """Try to identify user from initData or X-Forwarded-For."""
    init_data = request.headers.get("x-init-data", "")
    if init_data:
        for part in init_data.split("&"):
            if part.startswith("user="):
                import urllib.parse
                try:
                    user_json = urllib.parse.unquote(part[5:])
                    import json
                    user_data = json.loads(user_json)
                    uid = user_data.get("id")
                    if uid:
                        return f"user:{uid}"
                except (json.JSONDecodeError, ValueError):
                    pass

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"

    if request.client:
        return f"ip:{request.client.host}"

    return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path.startswith(("/healthz", "/webhook", "/cron", "/docs")):
            return await call_next(request)

        user_key = _extract_user_key(request)
        if user_key is None:
            return await call_next(request)

        max_requests, window = _match_prefix(request.url.path)
        bucket_key = f"{user_key}:{request.url.path.split('/')[1:3]}"

        now = time.monotonic()
        timestamps = _buckets[bucket_key]

        # Remove expired entries
        cutoff = now - window
        _buckets[bucket_key] = [t for t in timestamps if t > cutoff]
        timestamps = _buckets[bucket_key]

        if len(timestamps) >= max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
                headers={"Retry-After": str(window)},
            )

        timestamps.append(now)
        return await call_next(request)
