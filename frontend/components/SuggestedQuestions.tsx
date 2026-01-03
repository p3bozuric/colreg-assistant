"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SuggestedQuestionsProps {
  questions?: string[];
  onSelect: (question: string) => void;
}

export default function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="px-4 md:px-6 py-2 border-t border-border/30"
      >
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((question, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelect(question)}
              className="px-3 py-1.5 text-xs rounded-lg border border-dashed border-border/50 hover:border-primary/50 bg-card-bg/50 text-muted hover:text-foreground transition-colors"
            >
              {question}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
