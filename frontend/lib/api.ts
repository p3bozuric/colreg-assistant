import { MatchedRule } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export type StreamChunk =
  | { type: "text"; data: string }
  | { type: "metadata"; matchedRules?: MatchedRule[]; suggestedQuestions?: string[] };

export async function* streamChat(
  message: string,
  sessionId?: string
): AsyncGenerator<StreamChunk, void, unknown> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  const processSSEMessage = (sseMessage: string): StreamChunk | null => {
    const lines = sseMessage.split("\n");
    let eventType = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }

    if (!data) return null;

    try {
      const parsed = JSON.parse(data);

      if (eventType === "metadata") {
        return {
          type: "metadata",
          matchedRules: parsed.matched_rules,
          suggestedQuestions: parsed.suggested_questions,
        };
      }

      if (parsed.text !== undefined) {
        return { type: "text", data: parsed.text };
      }

      if (parsed.error) {
        throw new Error(parsed.error);
      }
    } catch (e) {
      // If JSON parsing fails, treat as raw text for backwards compatibility
      if (e instanceof SyntaxError) {
        return { type: "text", data };
      }
      throw e;
    }

    return null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE messages (each ends with \n\n)
    const messages = buffer.split("\n\n");
    // Keep the last potentially incomplete message in the buffer
    buffer = messages.pop() || "";

    for (const msg of messages) {
      const chunk = processSSEMessage(msg);
      if (chunk) {
        yield chunk;
      }
    }
  }

  // Process any remaining data in the buffer
  if (buffer) {
    const chunk = processSSEMessage(buffer);
    if (chunk) {
      yield chunk;
    }
  }
}
