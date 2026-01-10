"use client";

import { useState, useCallback } from "react";
import { Message } from "@/types";
import { streamChat } from "@/lib/api";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import SuggestedQuestions from "./SuggestedQuestions";

async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", blob, "recording.webm");

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Transcription failed");
  }

  const data = await response.json();
  return data.text;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [sessionId] = useState(() =>
    typeof window !== "undefined"
      ? `session_${Date.now()}`
      : "session_default"
  );

  const handleSend = useCallback(
    async (content: string, audioData?: { url: string; blob: Blob }) => {
      const messageId = `user_${Date.now()}`;
      let finalContent = content;

      // If voice message, create message in transcribing state
      if (audioData) {
        // Create a new persistent URL from the blob (the original gets revoked)
        const persistentAudioUrl = URL.createObjectURL(audioData.blob);

        const userMessage: Message = {
          id: messageId,
          role: "user",
          content: "",
          timestamp: new Date(),
          voice: {
            url: persistentAudioUrl,
            transcript: null,
            isTranscribing: true,
          },
        };
        setMessages((prev) => [...prev, userMessage]);

        // Transcribe the audio
        try {
          const transcript = await transcribeAudio(audioData.blob);
          finalContent = transcript;

          // Update user message with transcript
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    content: transcript,
                    voice: {
                      url: persistentAudioUrl,
                      transcript,
                      isTranscribing: false,
                    },
                  }
                : msg
            )
          );
        } catch (error) {
          console.error("Transcription error:", error);
          // Update message to show error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    content: "Failed to transcribe audio",
                    voice: {
                      url: persistentAudioUrl,
                      transcript: "Failed to transcribe audio",
                      isTranscribing: false,
                    },
                  }
                : msg
            )
          );
          return;
        }
      } else {
        // Regular text message
        const userMessage: Message = {
          id: messageId,
          role: "user",
          content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
      }

      // Now send to backend
      setIsStreaming(true);

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "",
        contentItems: [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        for await (const chunk of streamChat(finalContent, sessionId)) {
          setMessages((prev) => {
            const lastIndex = prev.length - 1;
            const lastMessage = prev[lastIndex];
            if (lastMessage.role === "assistant") {
              const updated = [...prev];

              if (chunk.type === "text") {
                // Append text to content and contentItems
                const newContent = lastMessage.content + chunk.data;
                const items = [...(lastMessage.contentItems || [])];

                // Append to last text item or create new one
                const lastItem = items[items.length - 1];
                if (lastItem && lastItem.type === "text") {
                  items[items.length - 1] = {
                    type: "text",
                    content: (lastItem.content as string) + chunk.data,
                  };
                } else {
                  items.push({ type: "text", content: chunk.data });
                }

                updated[lastIndex] = {
                  ...lastMessage,
                  content: newContent,
                  contentItems: items,
                };
              } else if (chunk.type === "visual") {
                // Add visual to contentItems
                const items = [...(lastMessage.contentItems || [])];
                items.push({ type: "visual", content: chunk.visual });

                updated[lastIndex] = {
                  ...lastMessage,
                  contentItems: items,
                };
              } else if (chunk.type === "metadata") {
                // Merge additional rules with existing matched rules
                let mergedRules = chunk.matchedRules ?? lastMessage.matchedRules;
                if (chunk.additionalRules && chunk.additionalRules.length > 0) {
                  const existingRules = lastMessage.matchedRules ?? [];
                  const existingIds = new Set(existingRules.map(r => r.id));
                  const newRules = chunk.additionalRules.filter(r => !existingIds.has(r.id));
                  mergedRules = [...existingRules, ...newRules];
                }
                updated[lastIndex] = {
                  ...lastMessage,
                  matchedRules: mergedRules,
                  suggestedQuestions: chunk.suggestedQuestions ?? lastMessage.suggestedQuestions,
                };
              } else if (chunk.type === "error") {
                updated[lastIndex] = {
                  ...lastMessage,
                  content: lastMessage.content + `\n\nError: ${chunk.error}`,
                };
              }
              return updated;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error streaming response:", error);
        const errorMessage = "Sorry, there was an error processing your request. Please try again.";
        setMessages((prev) => {
          const lastIndex = prev.length - 1;
          const lastMessage = prev[lastIndex];
          if (lastMessage.role === "assistant") {
            const updated = [...prev];
            updated[lastIndex] = {
              ...lastMessage,
              content: errorMessage,
              contentItems: [{ type: "text", content: errorMessage }],
            };
            return updated;
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId]
  );

  // Get suggested questions from the last assistant message
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
  const suggestedQuestions = !isStreaming ? lastAssistantMessage?.suggestedQuestions : undefined;

  const showSuggestions = isAtBottom && suggestedQuestions && suggestedQuestions.length > 0;

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden min-h-0">
      <MessageList
        messages={messages}
        isStreaming={isStreaming && messages[messages.length - 1]?.content === ""}
        onSend={handleSend}
        onAtBottomChange={setIsAtBottom}
      />
      <div className="flex-shrink-0 pb-4 px-4 bg-gradient-to-t from-background via-background/95 to-transparent pt-4">
        {showSuggestions && (
          <SuggestedQuestions questions={suggestedQuestions} onSelect={handleSend} />
        )}
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
