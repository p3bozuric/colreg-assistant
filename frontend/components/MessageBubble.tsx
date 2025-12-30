"use client";

import { motion } from "framer-motion";
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
        <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
          {message.content}
        </p>
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
