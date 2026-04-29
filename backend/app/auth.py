"""Verification of Telegram Mini App initData.

See https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import UTC
from urllib.parse import parse_qsl

from fastapi import Header, HTTPException, status
from pydantic import BaseModel


class TelegramUser(BaseModel):
    id: int
    is_bot: bool | None = None
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    language_code: str | None = None
    is_premium: bool | None = None


def _check_init_data(init_data: str, bot_token: str, max_age_seconds: int = 86_400) -> dict:
    """Validate Telegram WebApp initData and return parsed dict."""
    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing hash")

    data_check_string = "\n".join(f"{k}={parsed[k]}" for k in sorted(parsed))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid initData hash")

    # Optional auth_date freshness check
    try:
        from datetime import datetime

        auth_date = int(parsed.get("auth_date", "0"))
        if auth_date and (datetime.now(UTC).timestamp() - auth_date) > max_age_seconds:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "initData expired")
    except ValueError:
        pass

    return parsed


def get_telegram_user_factory(bot_token: str):
    """FastAPI dependency factory.

    Reads `Authorization: tma <initData>` header (Telegram standard) — also accepts
    `X-Init-Data: <initData>` for convenience.
    """

    def _dep(
        authorization: str | None = Header(default=None),
        x_init_data: str | None = Header(default=None, alias="X-Init-Data"),
    ) -> TelegramUser:
        init_data: str | None = None
        if authorization and authorization.lower().startswith("tma "):
            init_data = authorization[4:].strip()
        elif x_init_data:
            init_data = x_init_data.strip()

        if not init_data:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "no initData provided")

        parsed = _check_init_data(init_data, bot_token)
        user_raw = parsed.get("user")
        if not user_raw:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "no user in initData")
        try:
            return TelegramUser(**json.loads(user_raw))
        except (json.JSONDecodeError, ValueError) as exc:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "bad user payload") from exc

    return _dep
