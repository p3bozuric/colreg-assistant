"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";

type BlastType = "short" | "prolonged";

interface SoundSignalProps {
  pattern: string; // e.g., "prolonged-short-short" or "short-short"
  playable?: boolean;
  size?: "sm" | "md" | "lg";
}

const SHORT_DURATION = 400; // ~0.4 second (faster for demo)
const PROLONGED_DURATION = 2000; // ~2 seconds (faster for demo)
const BLAST_GAP = 400; // 0.4 second between blasts
const FREQUENCY = 400; // Lower frequency for fog horn effect

export default function SoundSignal({
  pattern,
  playable = true,
  size = "md",
}: SoundSignalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const sizeClasses = {
    sm: { short: "w-3 h-4", prolonged: "w-10 h-4", gap: "gap-1.5", text: "text-xs" },
    md: { short: "w-4 h-5", prolonged: "w-14 h-5", gap: "gap-2", text: "text-sm" },
    lg: { short: "w-5 h-6", prolonged: "w-18 h-6", gap: "gap-3", text: "text-base" },
  };

  const parsePattern = (pat: string): BlastType[] => {
    return pat.split("-").map((p) => p.trim() as BlastType);
  };

  const playBlast = useCallback((type: BlastType): Promise<void> => {
    const duration = type === "short" ? SHORT_DURATION : PROLONGED_DURATION;

    return new Promise((resolve) => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      gainNodeRef.current = gainNode;

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Create fog horn-like sound with multiple harmonics
      oscillator.frequency.value = FREQUENCY;
      oscillator.type = "sawtooth";

      // Fade in and out for realistic fog horn effect
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + duration / 1000 - 0.2);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);

      setTimeout(resolve, duration);
    });
  }, []);

  const playPattern = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    const blasts = parsePattern(pattern);
    for (let i = 0; i < blasts.length; i++) {
      setActiveIndex(i);
      await playBlast(blasts[i]);
      if (i < blasts.length - 1) {
        setActiveIndex(null);
        await new Promise((r) => setTimeout(r, BLAST_GAP));
      }
    }

    setActiveIndex(null);
    setIsPlaying(false);
  }, [pattern, isPlaying, playBlast]);

  const blasts = parsePattern(pattern);
  const classes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <div className={`flex items-center ${classes.gap}`}>
          {blasts.map((blast, idx) => (
            <motion.div
              key={idx}
              className={`rounded ${
                blast === "short" ? classes.short : classes.prolonged
              } ${
                activeIndex === idx
                  ? "bg-amber-400 shadow-lg shadow-amber-400/50"
                  : "bg-foreground/60"
              }`}
              animate={
                activeIndex === idx
                  ? {
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.05, 1],
                    }
                  : {}
              }
              transition={{
                duration: blast === "short" ? 0.5 : 2,
                repeat: activeIndex === idx ? Infinity : 0,
              }}
              title={blast === "short" ? "Short blast (~1s)" : "Prolonged blast (~4-6s)"}
            />
          ))}
        </div>
        {playable && (
          <button
            onClick={playPattern}
            disabled={isPlaying}
            className={`p-1.5 rounded-full border border-border/50 hover:border-amber-400/50 hover:bg-amber-400/10 transition-colors disabled:opacity-50 ${classes.text}`}
            title="Play sound signal"
          >
            {isPlaying ? (
              <svg
                className="w-4 h-4 text-amber-400 animate-pulse"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-muted hover:text-amber-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Common fog signals from COLREGs Rule 35 and maneuvering signals from Rule 34
export const FOG_SIGNALS: Record<string, { pattern: string; description: string; rule?: string }> = {
  "power-driven-making-way": {
    pattern: "prolonged",
    description: "Power-driven vessel making way through water",
    rule: "Rule 35(a)",
  },
  "power-driven-underway-not-making-way": {
    pattern: "prolonged-prolonged",
    description: "Power-driven vessel underway but stopped",
    rule: "Rule 35(b)",
  },
  "nuc-ram-cbd-sailing-fishing": {
    pattern: "prolonged-short-short",
    description: "NUC, RAM, CBD, sailing vessel, fishing vessel, or vessel towing/pushing",
    rule: "Rule 35(c)",
  },
  "vessel-towed": {
    pattern: "prolonged-short-short-short",
    description: "Vessel being towed (if manned)",
    rule: "Rule 35(e)",
  },
  "pilot-vessel": {
    pattern: "prolonged-short-short-short-short",
    description: "Pilot vessel on duty (identity signal)",
    rule: "Rule 35(j)",
  },
  "anchored": {
    pattern: "short-short-short",
    description: "Vessel at anchor (rapid ringing of bell)",
    rule: "Rule 35(g)",
  },
  "aground": {
    pattern: "short-short-short",
    description: "Vessel aground (3 strokes before and after bell)",
    rule: "Rule 35(h)",
  },
  // Maneuvering and warning signals (Rule 34)
  "altering-to-starboard": {
    pattern: "short",
    description: "I am altering my course to starboard",
    rule: "Rule 34(a)",
  },
  "altering-to-port": {
    pattern: "short-short",
    description: "I am altering my course to port",
    rule: "Rule 34(a)",
  },
  "operating-astern": {
    pattern: "short-short-short",
    description: "I am operating astern propulsion",
    rule: "Rule 34(a)",
  },
  "danger-doubt": {
    pattern: "short-short-short-short-short",
    description: "Danger signal - I do not understand your intentions / doubt you are taking sufficient action to avoid collision",
    rule: "Rule 34(d)",
  },
  "overtaking-starboard": {
    pattern: "prolonged-prolonged-short",
    description: "I intend to overtake on your starboard side",
    rule: "Rule 34(c)",
  },
  "overtaking-port": {
    pattern: "prolonged-prolonged-short-short",
    description: "I intend to overtake on your port side",
    rule: "Rule 34(c)",
  },
  "overtaking-agreement": {
    pattern: "prolonged-short-prolonged-short",
    description: "Agreement to be overtaken",
    rule: "Rule 34(c)",
  },
  "approaching-bend": {
    pattern: "prolonged",
    description: "Vessel approaching a bend or channel obstruction",
    rule: "Rule 34(e)",
  },
};
