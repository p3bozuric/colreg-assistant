from typing import AsyncGenerator
from litellm import acompletion
from loguru import logger
from src.config import get_settings


settings = get_settings()


async def generate_streaming_response(
    messages: list[dict],
    temperature: float = 0.7,
) -> AsyncGenerator[str, None]:
    """
    Generate streaming response from Gemini via LiteLLM.

    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Model temperature (0.0-1.0)

    Yields:
        Text chunks from the streaming response
    """
    try:
        logger.info(f"Generating response with {settings.model_name}")

        response = await acompletion(
            model=settings.model_name,
            messages=messages,
            temperature=temperature,
            stream=True,
            api_key=settings.google_api_key,
        )

        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    except Exception as e:
        logger.error(f"Error in LLM generation: {e}")
        raise
