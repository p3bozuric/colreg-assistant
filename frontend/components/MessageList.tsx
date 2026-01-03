"use client";

import { useEffect, useRef, useMemo } from "react";
import { Message } from "@/types";
import MessageBubble from "./MessageBubble";

const STARTER_QUESTIONS = [
  "What is Rule 14 (Head-on situations)?",
  "Explain give-way vs stand-on vessels",
  "What lights must a power-driven vessel show?",
  "How do I navigate in restricted visibility?",
  "What is the hierarchy of vessels under Rule 18?",
  "When should I use sound signals?",
  "What does 'not under command' mean?",
  "Explain crossing situations (Rule 15)",
  "What are the rules for overtaking?",
  "How do I determine risk of collision?",
  "What lights indicate a vessel at anchor?",
  "Explain traffic separation schemes",
  "What is safe speed under Rule 6?",
  "When can I depart from the rules?",
  "What signals indicate a vessel in distress?",
  "Explain narrow channel navigation",
  "What lights show a fishing vessel?",
  "How should I act as the stand-on vessel?",
  "What is restricted ability to manoeuvre?",
  "Explain the lookout requirement (Rule 5)",
];

function getRandomQuestions(count: number): string[] {
  const shuffled = [...STARTER_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  onSend?: (content: string) => void;
}

export default function MessageList({
  messages,
  isStreaming,
  onSend,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const starterQuestions = useMemo(() => getRandomQuestions(3), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center pt-[15vh] md:pt-0">
          <div className="text-5xl md:text-6xl mb-4">⚓</div>
          <h2 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            COLREG Assistant
          </h2>
          <p className="text-muted max-w-md mb-6">
            Ask me anything about the International Regulations for Preventing
            Collisions at Sea. I can help with rules, scenarios, and best
            practices.
          </p>
          {onSend && (
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {starterQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onSend(question)}
                  className="px-3 py-2 text-sm rounded-lg bg-card-bg border border-border hover:border-primary/50 hover:bg-primary/10 text-foreground/80 hover:text-foreground transition-colors text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        messages.map((message, index) => {
          const isLastAssistant =
            message.role === "assistant" && index === messages.length - 1;
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isLoading={isStreaming && index === messages.length - 1}
              onSuggestionClick={isLastAssistant && !isStreaming ? onSend : undefined}
            />
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
