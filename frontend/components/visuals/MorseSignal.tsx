"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";

interface MorseSignalProps {
  letter: string;
  pattern: string; // e.g., ".-" for A, "-..." for B
  playable?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const DOT_DURATION = 100; // ms
const DASH_DURATION = 300; // ms
const SYMBOL_GAP = 100; // ms between symbols
const FREQUENCY = 800; // Hz

export default function MorseSignal({
  letter,
  pattern,
  playable = true,
  size = "md",
  showLabel = true,
}: MorseSignalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const sizeClasses = {
    sm: { dot: "w-2 h-2", dash: "w-5 h-2", gap: "gap-1", text: "text-xs" },
    md: { dot: "w-3 h-3", dash: "w-8 h-3", gap: "gap-1.5", text: "text-sm" },
    lg: { dot: "w-4 h-4", dash: "w-10 h-4", gap: "gap-2", text: "text-base" },
  };

  const playTone = useCallback((duration: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = FREQUENCY;
      oscillator.type = "sine";

      // Smooth fade in/out to avoid clicks
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000 - 0.01);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);

      setTimeout(resolve, duration);
    });
  }, []);

  const playPattern = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    const symbols = pattern.split("");
    for (let i = 0; i < symbols.length; i++) {
      setActiveIndex(i);
      const symbol = symbols[i];
      const duration = symbol === "." ? DOT_DURATION : DASH_DURATION;
      await playTone(duration);
      if (i < symbols.length - 1) {
        await new Promise((r) => setTimeout(r, SYMBOL_GAP));
      }
    }

    setActiveIndex(null);
    setIsPlaying(false);
  }, [pattern, isPlaying, playTone]);

  const symbols = pattern.split("");
  const classes = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-3">
      {showLabel && (
        <span className={`font-mono font-bold text-primary ${classes.text}`}>
          {letter}
        </span>
      )}
      <div className={`flex items-center ${classes.gap}`}>
        {symbols.map((symbol, idx) => (
          <motion.div
            key={idx}
            className={`rounded-full ${
              symbol === "." ? classes.dot : classes.dash
            } ${
              activeIndex === idx
                ? "bg-primary shadow-lg shadow-primary/50"
                : "bg-foreground/70"
            }`}
            animate={
              activeIndex === idx
                ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }
                : {}
            }
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
      {playable && (
        <button
          onClick={playPattern}
          disabled={isPlaying}
          className={`p-1.5 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-colors disabled:opacity-50 ${classes.text}`}
          title="Play morse code"
        >
          {isPlaying ? (
            <svg
              className="w-4 h-4 text-primary animate-pulse"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-muted hover:text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// Common morse codes for maritime signals
export const MORSE_CODES: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
};

// Maritime signal meanings
export const MARITIME_SIGNALS: Record<string, string> = {
  A: "I have a diver down; keep well clear at slow speed",
  B: "I am taking in, or discharging, or carrying dangerous goods",
  C: "Yes (affirmative)",
  D: "Keep clear of me; I am maneuvering with difficulty",
  E: "I am altering my course to starboard",
  F: "I am disabled; communicate with me",
  G: "I require a pilot",
  H: "I have a pilot on board",
  I: "I am altering my course to port",
  J: "I am on fire and have dangerous cargo; keep well clear",
  K: "I wish to communicate with you",
  L: "You should stop your vessel instantly",
  M: "My vessel is stopped and making no way",
  N: "No (negative)",
  O: "Man overboard",
  P: "Vessel about to put to sea (Blue Peter)",
  Q: "My vessel is healthy and I request free pratique",
  R: "No specific meaning in single-letter signals",
  S: "My engines are going astern",
  T: "Keep clear; engaged in pair trawling",
  U: "You are running into danger",
  V: "I require assistance",
  W: "I require medical assistance",
  X: "Stop carrying out your intentions and watch for my signals",
  Y: "I am dragging anchor",
  Z: "I require a tug",
};
