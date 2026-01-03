"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, MatchedRule } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isLoading?: boolean;
  onSuggestionClick?: (question: string) => void;
}

interface RuleButtonProps {
  rule: MatchedRule;
}

function RuleButton({ rule }: RuleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ruleNumber = rule.id.split("_").pop();

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="px-2 py-1 text-xs rounded-md bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-colors"
      >
        {rule.title}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-0 mb-2 w-80 max-h-96 overflow-y-auto p-4 rounded-lg bg-card-bg border border-border shadow-xl backdrop-blur-md"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <h4 className="font-semibold text-primary mb-1">
              Rule {ruleNumber}
            </h4>
            <h5 className="font-medium text-sm mb-2">{rule.title}</h5>
            <div className="text-xs text-muted mb-2">
              Part {rule.part}, Section {rule.section}
            </div>
            <p className="text-sm mb-3 text-foreground/90">{rule.content}</p>
            <div className="flex flex-wrap gap-1">
              {rule.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 text-xs rounded bg-secondary/20 text-secondary"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1 py-1">
      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
      <span
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      />
      <span
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      />
    </div>
  );
}

export default function MessageBubble({ message, isLoading, onSuggestionClick }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasMatchedRules =
    !isUser && message.matchedRules && message.matchedRules.length > 0;
  const hasSuggestions =
    !isUser && onSuggestionClick && message.suggestedQuestions && message.suggestedQuestions.length > 0;
  const showLoading = isLoading && !message.content;

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
        ) : showLoading ? (
          <LoadingDots />
        ) : (
          <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-white/10 prose-pre:border prose-pre:border-white/20">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {hasMatchedRules && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="text-xs text-muted mb-2">Referenced Rules:</div>
            <div className="flex flex-wrap gap-2">
              {message.matchedRules!.map((rule) => (
                <RuleButton key={rule.id} rule={rule} />
              ))}
            </div>
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
      {hasSuggestions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-1.5 mt-3"
        >
          {message.suggestedQuestions!.map((question, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick!(question)}
              className="self-start px-2.5 py-1 text-[11px] rounded-lg border border-dashed border-border/50 hover:border-primary/40 bg-transparent text-muted hover:text-foreground/70 transition-colors text-left opacity-60 hover:opacity-100"
            >
              {question}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
