"use client";

import { useState, FormEvent, KeyboardEvent, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

interface ChatInputProps {
  onSend: (message: string, audioData?: { url: string; blob: Blob }) => void;
  disabled: boolean;
}

// Microphone Icon
function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
    </svg>
  );
}

// Stop Icon
function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Send Icon
function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  );
}

// Custom Audio Preview Component with styled player
function AudioPreview({
  audioUrl,
  onSend,
  onCancel,
}: {
  audioUrl: string;
  onSend: () => void;
  onCancel: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3"
    >
      {/* Custom Styled Audio Player */}
      <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-card-bg rounded-xl border border-border">
        <audio
          ref={(el) => {
            if (el) {
              el.onplay = () => setIsPlaying(true);
              el.onpause = () => setIsPlaying(false);
              el.ontimeupdate = () => setCurrentTime(el.currentTime);
              el.onloadedmetadata = () => setDuration(el.duration);
              el.onended = () => setIsPlaying(false);
            }
          }}
          src={audioUrl}
          className="hidden"
        />

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={(e) => {
            const audio = e.currentTarget.parentElement?.querySelector("audio") as HTMLAudioElement;
            if (audio) {
              if (isPlaying) {
                audio.pause();
              } else {
                audio.play();
              }
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Progress Bar & Time */}
        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const audio = e.currentTarget.parentElement?.parentElement?.querySelector("audio") as HTMLAudioElement;
              if (audio) {
                audio.currentTime = Number(e.target.value);
                setCurrentTime(Number(e.target.value));
              }
            }}
            className="flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
          />
          <span className="text-xs text-muted min-w-[70px] text-right">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <button
        type="button"
        onClick={onCancel}
        className="p-3 rounded-xl bg-card-bg border border-border text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
        aria-label="Cancel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onSend}
        className="p-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
        aria-label="Send voice message"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const isPressingRef = useRef(false);

  const {
    state: recordingState,
    audioUrl,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    reset,
  } = useVoiceRecorder();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceSend = () => {
    if (audioUrl && audioBlob) {
      // Send with empty message - Chat component will transcribe
      onSend("", { url: audioUrl, blob: audioBlob });
      reset();
    }
  };

  const handleVoiceCancel = () => {
    reset();
  };

  // Desktop: click to start, click to stop
  const handleMicClick = useCallback(async () => {
    // Only handle click on desktop (non-touch)
    if (isPressingRef.current) return;

    if (recordingState === "idle") {
      await startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  // Mobile: press and hold to record
  const handleTouchStart = useCallback(async (e: React.TouchEvent) => {
    e.preventDefault();
    isPressingRef.current = true;
    if (recordingState === "idle") {
      await startRecording();
    }
  }, [recordingState, startRecording]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (isPressingRef.current && recordingState === "recording") {
      stopRecording();
    }
    isPressingRef.current = false;
  }, [recordingState, stopRecording]);

  const showMicButton = !input.trim() && recordingState === "idle" && !audioUrl;
  const showRecordingUI = recordingState === "recording";
  const showAudioPreview = audioUrl && recordingState !== "recording";

  return (
    <motion.form
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onSubmit={handleSubmit}
    >
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {showAudioPreview ? (
            <AudioPreview
              key="audio-preview"
              audioUrl={audioUrl}
              onSend={handleVoiceSend}
              onCancel={handleVoiceCancel}
            />
          ) : (
            <motion.div
              key="text-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 bg-card-bg/95 backdrop-blur-md border rounded-full px-4 py-2 shadow-lg shadow-black/20 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 ${showRecordingUI ? 'border-red-500/50' : 'border-border'}`}
            >
              {/* Recording UI */}
              {showRecordingUI ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-3 h-3 rounded-full bg-red-500 ml-1"
                  />
                  <span className="flex-1 text-foreground text-sm">Recording...</span>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors"
                    aria-label="Stop recording"
                  >
                    <StopIcon className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about COLREGs..."
                    disabled={disabled}
                    rows={1}
                    className="flex-1 bg-transparent py-2 text-foreground placeholder:text-muted focus:outline-none resize-none disabled:opacity-50"
                  />

                  {/* Mic or Send button */}
                  {showMicButton ? (
                    <button
                      ref={micButtonRef}
                      type="button"
                      onClick={handleMicClick}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      disabled={disabled}
                      className="p-2 text-muted hover:text-primary rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-none select-none"
                      aria-label="Hold to record (mobile) or click to start/stop (desktop)"
                    >
                      <MicIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={disabled || !input.trim()}
                      className="p-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      aria-label="Send message"
                    >
                      <SendIcon className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.form>
  );
}
