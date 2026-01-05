"""Stream parser for inline visual markers.

Parses [[VISUAL:type:config]] markers from LLM stream and converts to visual events.
Handles buffering for incomplete markers across chunk boundaries.
"""

import re
from dataclasses import dataclass
from typing import AsyncGenerator, Literal
from loguru import logger

from src.data.visual_catalog import get_visual_by_id


# Pattern: [[VISUAL:type:config]] where type:config forms the catalog ID
# Case-insensitive, allows alphanumeric, hyphens, and underscores
VISUAL_MARKER_PATTERN = re.compile(
    r'\[\[VISUAL:([a-zA-Z0-9\-_]+:[a-zA-Z0-9\-_]+)\]\]',
    re.IGNORECASE
)


@dataclass
class StreamChunk:
    """Represents a parsed stream chunk."""
    type: Literal["text", "visual"]
    data: dict


def parse_stream_chunk(text_buffer: str) -> tuple[list[StreamChunk], str]:
    """Parse accumulated text for visual markers.

    Handles partial markers that may span chunk boundaries by keeping
    incomplete potential markers in the buffer.

    Args:
        text_buffer: Accumulated text that may contain visual markers

    Returns:
        Tuple of:
        - List of StreamChunks (text and/or visual)
        - Remaining buffer (incomplete potential marker)
    """
    chunks: list[StreamChunk] = []

    # Check if buffer might contain an incomplete marker
    # Keep potential incomplete markers in buffer for next iteration
    incomplete_start = text_buffer.rfind("[[")
    if incomplete_start != -1 and "]]" not in text_buffer[incomplete_start:]:
        # Potential incomplete marker - process only up to it
        processable = text_buffer[:incomplete_start]
        remaining = text_buffer[incomplete_start:]
    else:
        processable = text_buffer
        remaining = ""

    if not processable:
        return chunks, remaining

    # Find all markers in processable text
    last_end = 0
    for match in VISUAL_MARKER_PATTERN.finditer(processable):
        # Add text before marker
        if match.start() > last_end:
            text_before = processable[last_end:match.start()]
            if text_before:
                chunks.append(StreamChunk(type="text", data={"text": text_before}))

        # Process marker - lookup in catalog
        visual_id = match.group(1).lower()
        visual_config = get_visual_by_id(visual_id)

        if visual_config:
            chunks.append(StreamChunk(type="visual", data=visual_config))
            logger.debug(f"Parsed visual marker: {visual_id}")
        else:
            # Unknown visual ID - pass through as text (graceful degradation)
            logger.warning(f"Unknown visual ID in marker: {visual_id}")
            chunks.append(StreamChunk(type="text", data={"text": match.group(0)}))

        last_end = match.end()

    # Add remaining text after last marker
    if last_end < len(processable):
        remaining_text = processable[last_end:]
        if remaining_text:
            chunks.append(StreamChunk(type="text", data={"text": remaining_text}))

    return chunks, remaining


async def parse_streaming_response(
    stream: AsyncGenerator[str, None]
) -> AsyncGenerator[StreamChunk, None]:
    """Wrap LLM stream and parse visual markers.

    Buffers incoming chunks to handle markers that span chunk boundaries.
    Yields StreamChunks of type "text" or "visual".

    Args:
        stream: Async generator yielding text chunks from LLM

    Yields:
        StreamChunk objects with parsed content
    """
    buffer = ""

    async for chunk in stream:
        buffer += chunk

        # Try to parse buffer for complete markers
        parsed_chunks, buffer = parse_stream_chunk(buffer)

        for parsed in parsed_chunks:
            yield parsed

    # Flush remaining buffer at end of stream
    if buffer:
        # If buffer contains incomplete marker, just yield as text
        if "[[" in buffer and "]]" not in buffer:
            # Incomplete marker at end - yield as text
            yield StreamChunk(type="text", data={"text": buffer})
        else:
            # Try one final parse
            final_chunks, leftover = parse_stream_chunk(buffer)
            for parsed in final_chunks:
                yield parsed
            # Yield any remaining text
            if leftover:
                yield StreamChunk(type="text", data={"text": leftover})
