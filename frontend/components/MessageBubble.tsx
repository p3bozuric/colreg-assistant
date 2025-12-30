"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-gradient-to-r from-primary to-secondary text-white rounded-br-md"
            : "backdrop-blur-sm bg-card-bg border border-border rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-white/10 prose-pre:border prose-pre:border-white/20">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <span
          className={`text-xs mt-1 block ${
            isUser ? "text-white/70" : "text-muted"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}
