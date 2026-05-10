from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    bot_token: str = Field(alias="BOT_TOKEN")
    public_url: str = Field(alias="PUBLIC_URL")
    webapp_url: str = Field(alias="WEBAPP_URL")
    webhook_secret: str = Field(alias="WEBHOOK_SECRET")
    cron_secret: str = Field(alias="CRON_SECRET")
    database_url: str = Field(alias="DATABASE_URL")
    cors_origins: str = Field(alias="CORS_ORIGINS")
    log_level: str = Field(alias="LOG_LEVEL", default="INFO")
    admin_user_id: int | None = Field(alias="ADMIN_USER_ID", default=None)
    openai_api_key: str | None = Field(alias="OPENAI_API_KEY", default=None)
    groq_api_key: str | None = Field(alias="GROQ_API_KEY", default=None)
    bot_username: str = Field(alias="BOT_USERNAME", default="Tasksblo_bot")

    @property
    def webhook_path(self) -> str:
        return "/tg/webhook"

    @property
    def webhook_url(self) -> str:
        return f"{self.public_url.rstrip('/')}{self.webhook_path}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
