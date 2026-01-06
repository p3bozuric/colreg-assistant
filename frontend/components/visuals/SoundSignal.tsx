"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

type BlastType = "short" | "prolonged";

interface SoundSignalProps {
  pattern: string;
  playable?: boolean;
  size?: "sm" | "md" | "lg";
}

const SHORT_DURATION = 400;
const PROLONGED_DURATION = 2000;
const BLAST_GAP = 400;
const FREQUENCY = 400;

export default function SoundSignal({
  pattern,
  playable = true,
  size = "md",
}: SoundSignalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Refs to manage audio state and interruption
  const audioContextRef = useRef<AudioContext | null>(null);
  const shouldStopRef = useRef(false);

  const sizeClasses = {
    sm: { short: "w-3 h-4", prolonged: "w-10 h-4", gap: "gap-1.5", text: "text-xs" },
    md: { short: "w-4 h-5", prolonged: "w-14 h-5", gap: "gap-2", text: "text-sm" },
    lg: { short: "w-5 h-6", prolonged: "w-18 h-6", gap: "gap-3", text: "text-base" },
  };

  const parsePattern = (pat: string): BlastType[] => {
    return pat.split("-").map((p) => p.trim() as BlastType);
  };

  // Cleanup on unmount to ensure audio stops if user navigates away
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const stopSound = useCallback(() => {
    // 1. Signal the loop to stop
    shouldStopRef.current = true;
    
    // 2. Immediately kill the audio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 3. Reset UI state
    setIsPlaying(false);
    setActiveIndex(null);
  }, []);

  const playBlast = useCallback((type: BlastType): Promise<void> => {
    const duration = type === "short" ? SHORT_DURATION : PROLONGED_DURATION;

    return new Promise((resolve) => {
      // If stopped mid-wait, resolve immediately to exit faster
      if (shouldStopRef.current) {
        resolve();
        return;
      }

      // Re-initialize context if it was closed by a previous stop
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = FREQUENCY;
      oscillator.type = "sawtooth";

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + duration / 1000 - 0.2);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);

      setTimeout(() => {
        resolve();
      }, duration);
    });
  }, []);

  const togglePlayback = useCallback(async () => {
    // If currently playing, treat this click as a STOP
    if (isPlaying) {
      stopSound();
      return;
    }

    // START Playback
    shouldStopRef.current = false;
    setIsPlaying(true);

    const blasts = parsePattern(pattern);
    
    for (let i = 0; i < blasts.length; i++) {
      // Check before every blast
      if (shouldStopRef.current) break;
      
      setActiveIndex(i);
      await playBlast(blasts[i]);
      
      // Check after blast/before gap
      if (shouldStopRef.current) break;

      if (i < blasts.length - 1) {
        setActiveIndex(null);
        await new Promise((r) => setTimeout(r, BLAST_GAP));
      }
    }

    // Cleanup after natural finish
    if (!shouldStopRef.current) {
      setActiveIndex(null);
      setIsPlaying(false);
    }
  }, [pattern, isPlaying, playBlast, stopSound]);

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
            onClick={togglePlayback}
            // REMOVED: disabled={isPlaying}
            className={`p-1.5 rounded-full border border-border/50 hover:border-amber-400/50 hover:bg-amber-400/10 transition-colors ${classes.text}`}
            title={isPlaying ? "Stop signal" : "Play signal"}
          >
            {isPlaying ? (
              <svg
                className="w-4 h-4 text-amber-400" // Removed animate-pulse so the button looks stable
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
export const FOG_SIGNALS: Record<string, { pattern: string; title: string; description: string; interval?: string; rule?: string }> = {
  "power-driven-making-way": {
    pattern: "prolonged",
    title: "Power-driven vessel making way",
    description: "Power-driven vessel making way through water must sound one prolonged blast at intervals of not more than 2 minutes",
    interval: "2 minutes",
    rule: "Rule 35(a)",
  },
  "power-driven-underway-not-making-way": {
    pattern: "prolonged-prolonged",
    title: "Power-driven vessel not making way",
    description: "Power-driven vessel underway but stopped and making no way through the water must sound at intervals of not more than 2 minutes two prolonged blasts in succession with an interval of about 2 seconds between them.",
    interval: "2 minutes",
    rule: "Rule 35(b)",
  },
  "nuc-ram-cbd-sailing-fishing": {
    pattern: "prolonged-short-short",
    title: "NUC, RAM, CBD, sailing, fishing, or towing/pushing vessel",
    description: "Vessels not under command, with restricted maneuverability, constrained by draft, sailing vessel, fishing vessel, or vessel towing/pushing must sound at intervals of not more than 2 minutes three blasts in succession, namely one prolonged followed by two short blasts.",
    interval: "2 minutes",
    rule: "Rule 35(c)",
  },
  "fishing-anchor": {
    pattern: "prolonged-short-short",
    title: "Fishing vessel and RAM at anchor",
    description: "Vessels with restricted maneuverability and fishing vessels at anchor shall sound one prolonged followed by two short blasts.",
    interval: "2 minutes",
    rule: "Rule 35(d)",
  },
  "vessel-towed": {
    pattern: "prolonged-short-short-short",
    title: "Vessel being towed",
    description: "Vessel being towed if manned must at intervals of not more than 2 minutes sound four blasts in succession, namely one prolonged followed by three short blasts. When practicable, this signal shall be made immediately after the signal made by the towing vessel.",
    interval: "2 minutes",
    rule: "Rule 35(e)",
  },
  "pilot-vessel": {
    pattern: "short-short-short-short",
    title: "Pilot vessel on duty",
    description: "Besides usual signals for making way, not making way and anchor, pilot vessel on duty (identity signal)",
    interval: "2 minutes",
    rule: "Rule 35(k)",
  },
  "anchored": {
    pattern: "short-prolonged-short",
    title: "Vessel at anchor",
    description: "Vessel at anchor in intervals of not more then 1 minute do rapid ringing of bell for 5 seconds (if longer then 100m this will be followed by 5 seconds of gong), followed by one short blast, prolonged blast, and one short blast.",
    interval: "1 minute",
    rule: "Rule 35(g)",
  },
  "aground": {
    pattern: "short-short-short",
    title: "Vessel aground",
    description: "Vessel aground must give bell signal, if required - gong as well. In addition - give 3 separate and distinct strokes on the bell before and after the rapid ringing of the bell.",
    interval: "1 minute",
    rule: "Rule 35(h)",
  },
  // Maneuvering and warning signals (Rule 34)
  "altering-to-starboard": {
    pattern: "short",
    title: "Altering course to starboard",
    description: "I am altering my course to starboard",
    rule: "Rule 34(a)",
  },
  "altering-to-port": {
    pattern: "short-short",
    title: "Altering course to port",
    description: "I am altering my course to port",
    rule: "Rule 34(a)",
  },
  "operating-astern": {
    pattern: "short-short-short",
    title: "Operating astern propulsion",
    description: "I am operating astern propulsion",
    rule: "Rule 34(a)",
  },
  "danger-doubt": {
    pattern: "short-short-short-short-short",
    title: "Danger signal / doubt intentions",
    description: "Danger signal - I do not understand your intentions / doubt you are taking sufficient action to avoid collision",
    rule: "Rule 34(d)",
  },
  "overtaking-starboard": {
    pattern: "prolonged-prolonged-short",
    title: "Overtaking on starboard side",
    description: "I intend to overtake on your starboard side",
    rule: "Rule 34(c)(i)",
  },
  "overtaking-port": {
    pattern: "prolonged-prolonged-short-short",
    title: "Overtaking on port side",
    description: "I intend to overtake on your port side",
    rule: "Rule 34(c)(i)",
  },
  "overtaking-agreement": {
    pattern: "prolonged-short-prolonged-short",
    title: "Agreement to be overtaken",
    description: "Agreement to be overtaken",
    rule: "Rule 34(c)(ii)",
  },
  "approaching-bend": {
    pattern: "prolonged",
    title: "Approaching bend or obstruction",
    description: "Vessel approaching a bend or channel obstruction",
    rule: "Rule 34(e)",
  },
};
