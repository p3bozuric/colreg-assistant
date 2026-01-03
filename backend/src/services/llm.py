"""LLM Service using LiteLLM for model-agnostic inference.

Supports OpenAI, Anthropic, Google, and other providers.
"""

from typing import AsyncGenerator
import litellm
from pydantic import BaseModel
from loguru import logger
from src.config import get_settings

# Configure LiteLLM
litellm.set_verbose = False


def generate_sync_response(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> str:
    """
    Generate a synchronous response using LiteLLM.
    Supports OpenAI, Anthropic, Google, and other providers.

    Args:
        prompt: The prompt string
        model: Optional model name (defaults to settings.model_name)
        temperature: Model temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate

    Returns:
        The generated text response
    """
    settings = get_settings()
    model_name = model or settings.model_name
    logger.info(f"Generating sync response with {model_name}")

    response = litellm.completion(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )

    return response.choices[0].message.content or ""


def generate_structured_response(
    prompt: str,
    response_schema: type[BaseModel],
    model: str | None = None,
    max_retries: int = 3,
    temperature: float = 0.3,
) -> BaseModel | None:
    """
    Generate structured response using Pydantic schema.
    Retries up to max_retries times on failure.

    Args:
        prompt: The prompt string
        response_schema: Pydantic model class for response validation
        model: Optional model name (defaults to settings.model_name)
        max_retries: Number of retry attempts on failure
        temperature: Model temperature (lower for more deterministic output)

    Returns:
        Validated Pydantic model instance, or None if all retries failed
    """
    settings = get_settings()
    model_name = model or settings.model_name
    logger.info(f"Generating structured response with {model_name}")

    for attempt in range(max_retries):
        try:
            response = litellm.completion(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": response_schema.__name__,
                        "schema": response_schema.model_json_schema(),
                        "strict": True,
                    }
                },
            )
            json_str = response.choices[0].message.content
            return response_schema.model_validate_json(json_str)
        except Exception as e:
            logger.warning(f"Structured output attempt {attempt + 1}/{max_retries} failed: {e}")

    logger.error(f"All {max_retries} structured output attempts failed")
    return None


async def generate_streaming_response(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.6,
    max_tokens: int = 800,
) -> AsyncGenerator[str, None]:
    """
    Generate streaming response using LiteLLM.
    Supports OpenAI, Anthropic, Google, and other providers.

    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Optional model name (defaults to settings.model_name)
        temperature: Model temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate (default 800 for concise responses)

    Yields:
        Text chunks from the streaming response
    """
    settings = get_settings()
    model_name = model or settings.model_name
    logger.info(f"Generating streaming response with {model_name}")

    response = await litellm.acompletion(
        model=model_name,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )

    async for chunk in response:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
