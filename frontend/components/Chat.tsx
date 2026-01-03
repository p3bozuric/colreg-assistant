"use client";

import { useState, useCallback } from "react";
import { Message } from "@/types";
import { streamChat } from "@/lib/api";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() =>
    typeof window !== "undefined"
      ? `session_${Date.now()}`
      : "session_default"
  );

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        for await (const chunk of streamChat(content, sessionId)) {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage.role === "assistant") {
              if (chunk.type === "text") {
                lastMessage.content += chunk.data;
              } else if (chunk.type === "metadata") {
                if (chunk.matchedRules) {
                  lastMessage.matchedRules = chunk.matchedRules;
                }
                if (chunk.suggestedQuestions) {
                  lastMessage.suggestedQuestions = chunk.suggestedQuestions;
                }
              }
            }
            return updated;
          });
        }
      } catch (error) {
        console.error("Error streaming response:", error);
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content =
              "Sorry, there was an error processing your request. Please try again.";
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId]
  );

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      <MessageList
        messages={messages}
        isStreaming={isStreaming && messages[messages.length - 1]?.content === ""}
        onSend={handleSend}
      />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
