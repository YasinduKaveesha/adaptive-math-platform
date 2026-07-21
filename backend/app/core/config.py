"""Environment-backed infrastructure settings for BE1."""

from dataclasses import dataclass
from functools import lru_cache
from os import getenv
from urllib.parse import urlparse


@dataclass(frozen=True)
class Settings:
    """Operational settings only; no scientific or learner-policy defaults."""

    app_env: str
    backend_code_version: str
    database_url: str
    log_level: str
    cors_allowed_origins: tuple[str, ...]

    @property
    def database_endpoint(self) -> tuple[str, int]:
        parsed = urlparse(self.database_url)
        if parsed.scheme not in {"postgres", "postgresql", "postgresql+asyncpg"} or not parsed.hostname:
            raise ValueError("DATABASE_URL must be a PostgreSQL URL with a hostname")
        return parsed.hostname, parsed.port or 5432


@lru_cache
def get_settings() -> Settings:
    origins = tuple(
        origin.strip()
        for origin in getenv("CORS_ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    )
    return Settings(
        app_env=getenv("APP_ENV", "development"),
        backend_code_version=getenv("BACKEND_CODE_VERSION", "0.1.0-be1.2"),
        database_url=getenv(
            "DATABASE_URL",
            "postgresql://upadya:local-development-only@db:5432/upadya",
        ),
        log_level=getenv("LOG_LEVEL", "INFO").upper(),
        cors_allowed_origins=origins,
    )
