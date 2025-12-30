from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Google AI
    google_api_key: str
    model_name: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"

    # Supabase
    supabase_url: str
    supabase_key: str

    # API Security
    api_key: str

    # Logging
    log_level: str = "INFO"

    # Collection name for vector store
    collection_name: str = "colregs_documents"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
