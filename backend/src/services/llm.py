from typing import AsyncGenerator
from google import genai
from google.genai import types
from loguru import logger
from src.config import get_settings


settings = get_settings()
client = genai.Client(api_key=settings.google_api_key)


def _convert_messages_to_contents(messages: list[dict]) -> tuple[str | None, list[types.Content]]:
    """Convert OpenAI-style messages to Google GenAI format."""
    system_instruction = None
    contents = []

    for msg in messages:
        role = msg["role"]
        content = msg["content"]

        if role == "system":
            system_instruction = content
        elif role == "user":
            contents.append(types.Content(role="user", parts=[types.Part(text=content)]))
        elif role == "assistant":
            contents.append(types.Content(role="model", parts=[types.Part(text=content)]))

    return system_instruction, contents


def generate_sync_response(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.7,
) -> str:
    """
    Generate a synchronous response from Gemini.

    Args:
        prompt: The prompt string
        model: Optional model name (defaults to settings.model_name)
        temperature: Model temperature (0.0-1.0)

    Returns:
        The generated text response
    """
    model_name = model or settings.model_name
    logger.info(f"Generating sync response with {model_name}")

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=temperature),
    )

    return response.text or ""


async def generate_streaming_response(
    messages: list[dict],
    temperature: float = 0.7,
) -> AsyncGenerator[str, None]:
    """
    Generate streaming response from Gemini via google-genai.

    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Model temperature (0.0-1.0)

    Yields:
        Text chunks from the streaming response
    """
    logger.info(f"Generating response with {settings.model_name}")

    system_instruction, contents = _convert_messages_to_contents(messages)

    config = types.GenerateContentConfig(
        temperature=temperature,
        system_instruction=system_instruction,
    )

    async for chunk in await client.aio.models.generate_content_stream(
        model=settings.model_name,
        contents=contents,
        config=config,
    ):
        if chunk.text:
            yield chunk.text
