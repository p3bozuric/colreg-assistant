from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # LiteLLM Model Configuration
    # Supports: "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022", "gemini/gemini-2.0-flash", etc.
    model_name: str = "gpt-4o-mini"
    classifier_model: str = "gpt-4o-mini"  # Fast model for query classification

    # API Keys - LiteLLM auto-detects based on model prefix
    # Set the appropriate key for your chosen model
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None

    # Supabase (used for chat history)
    supabase_url: str
    supabase_key: str

    # API Security
    api_key: str

    # Logging
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
