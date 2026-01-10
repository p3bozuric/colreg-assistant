"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface MorseSignalProps {
  letter: string;
  pattern: string;
  playable?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const DOT_DURATION = 100; // ms
const DASH_DURATION = 300; // ms
const SYMBOL_GAP = 100; // ms between symbols
const FREQUENCY = 800; // Hz

interface MorseCardProps {
  letter: string;
  pattern: string;
  description: string;
}

export function MorseCard({ letter, pattern, description }: MorseCardProps) {
  return (
    <div className="group flex flex-col justify-between rounded-xl border border-border bg-card/40 p-5 transition-all duration-300 hover:bg-card hover:shadow-lg hover:border-primary/20 hover:-translate-y-1">
      
      {/* --- Header: Large Letter Badge --- */}
      {/* Added 'flex justify-center' to center the badge horizontally */}
      <div className="mb-4 flex justify-center">
        {/* Changed 'group-hover:text-primary-foreground' to 'group-hover:text-white' to ensure it turns white */}
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold font-mono text-primary shadow-sm border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
          {letter}
        </span>
      </div>

      {/* --- Content: Description --- */}
      <div className="mb-6 flex-grow text-center"> {/* Added text-center here as well for the description, optional but looks better with a centered badge */}
        <p className="text-sm leading-relaxed text-muted-foreground/90 group-hover:text-foreground transition-colors">
          {description}
        </p>
      </div>

      {/* --- Footer: The Player --- */}
      <div className="mt-auto rounded-lg bg-background/50 border border-border/50 p-3 flex items-center justify-between transition-colors group-hover:border-border">
        <span className="text-xs text-muted-foreground font-mono">Signal</span>
        <MorseSignal 
          letter={letter} 
          pattern={pattern} 
          size="sm" 
          showLabel={false} 
        />
      </div>
    </div>
  );
}

export default function MorseSignal({
  letter,
  pattern,
  playable = true,
  size = "md",
  showLabel = true,
}: MorseSignalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Refs for audio control
  const audioContextRef = useRef<AudioContext | null>(null);
  const shouldStopRef = useRef(false);

  const sizeClasses = {
    sm: { dot: "w-2 h-2", dash: "w-5 h-2", gap: "gap-1", text: "text-xs" },
    md: { dot: "w-3 h-3", dash: "w-8 h-3", gap: "gap-1.5", text: "text-sm" },
    lg: { dot: "w-4 h-4", dash: "w-10 h-4", gap: "gap-2", text: "text-base" },
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSound();
  }, []);

  const stopSound = useCallback(() => {
    shouldStopRef.current = true; // Signal loop to break
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsPlaying(false);
    setActiveIndex(null);
  }, []);

  const playTone = useCallback((duration: number): Promise<void> => {
    return new Promise((resolve) => {
      // If stopped, exit immediately
      if (shouldStopRef.current) {
        resolve();
        return;
      }

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = FREQUENCY;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000 - 0.01);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);

      setTimeout(resolve, duration);
    });
  }, []);

  const togglePlayback = useCallback(async () => {
    // 1. If playing, STOP it
    if (isPlaying) {
      stopSound();
      return;
    }

    // 2. If not playing, START it
    shouldStopRef.current = false;
    setIsPlaying(true);

    const symbols = pattern.split("");
    for (let i = 0; i < symbols.length; i++) {
      // Check for stop signal before playing
      if (shouldStopRef.current) break;

      setActiveIndex(i);
      const symbol = symbols[i];
      const duration = symbol === "." ? DOT_DURATION : DASH_DURATION;
      
      await playTone(duration);
      
      // Check for stop signal during gap
      if (shouldStopRef.current) break;

      if (i < symbols.length - 1) {
        await new Promise((r) => setTimeout(r, SYMBOL_GAP));
      }
    }

    // Cleanup if finished naturally (not interrupted)
    if (!shouldStopRef.current) {
      setActiveIndex(null);
      setIsPlaying(false);
    }
  }, [pattern, isPlaying, playTone, stopSound]);

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
          onClick={togglePlayback}
          // REMOVED: disabled={isPlaying}
          className={`p-1.5 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-colors ${classes.text}`}
          title={isPlaying ? "Stop" : "Play morse code"}
        >
          {isPlaying ? (
             // Stop Icon (Square)
            <svg
              className="w-4 h-4 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            // Play Icon (Triangle)
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
  // Numbers
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  // Special signals
  SOS: "...---...",
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
  SOS: "International distress signal - immediate assistance required",
};
