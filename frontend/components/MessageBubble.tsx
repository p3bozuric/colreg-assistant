"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, MatchedRule, ContentItem, Visual } from "@/types";
import { VisualRenderer } from "./visuals";
import VisualRendererDefault from "./visuals/VisualRenderer";

interface MessageBubbleProps {
  message: Message;
  isLoading?: boolean;
}

interface RuleButtonProps {
  rule: MatchedRule;
}

function RuleButton({ rule }: RuleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAnnex = rule.id.startsWith("annex_");
  const identifier = rule.id.split("_").pop();
  const displayIdentifier = isAnnex ? identifier?.toUpperCase() : identifier;
  const label = isAnnex ? "Annex" : "Rule";

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
              {label} {displayIdentifier}
            </h4>
            <h5 className="font-medium text-sm mb-2">{rule.title}</h5>
            <div className="text-xs text-muted mb-2">
              Part {rule.part}{rule.section ? `, Section ${rule.section}` : ''}
            </div>
            <p className="text-sm mb-3 text-foreground/90 whitespace-pre-wrap">{rule.content}</p>
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

interface InlineContentRendererProps {
  contentItems: ContentItem[];
}

function InlineContentRenderer({ contentItems }: InlineContentRendererProps) {
  return (
    <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-white/10 prose-pre:border prose-pre:border-white/20">
      {contentItems.map((item, idx) => {
        if (item.type === "text") {
          return (
            <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]}>
              {item.content as string}
            </ReactMarkdown>
          );
        } else if (item.type === "visual") {
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="my-4 flex justify-center not-prose overflow-x-auto"
            >
              <VisualRendererDefault visual={item.content as Visual} />
            </motion.div>
          );
        }
        return null;
      })}
    </div>
  );
}

// Custom styled audio player for voice messages
function VoiceMessagePlayer({
  audioUrl,
  transcript,
  isTranscribing,
}: {
  audioUrl: string;
  transcript: string | null;
  isTranscribing?: boolean;
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
    <div className="space-y-2">
      {/* Custom Audio Player */}
      <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
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
        <button
          onClick={(e) => {
            const audio = (e.currentTarget.parentElement?.querySelector("audio") as HTMLAudioElement);
            if (audio) {
              if (isPlaying) {
                audio.pause();
              } else {
                audio.play();
              }
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const audio = (e.currentTarget.parentElement?.parentElement?.querySelector("audio") as HTMLAudioElement);
              if (audio) {
                audio.currentTime = Number(e.target.value);
                setCurrentTime(Number(e.target.value));
              }
            }}
            className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-xs text-white/70 min-w-[40px]">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
        </div>
      </div>

      {/* Transcript */}
      {isTranscribing ? (
        <div className="flex items-center gap-2 text-white/80">
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm italic">Transcribing...</span>
        </div>
      ) : transcript ? (
        <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
          {transcript}
        </p>
      ) : null}
    </div>
  );
}

export default function MessageBubble({ message, isLoading }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasMatchedRules =
    !isUser && message.matchedRules && message.matchedRules.length > 0;
  const showLoading = isLoading && !message.content;
  const isVoiceMessage = isUser && message.voice;

  // Use contentItems for inline rendering if available
  const hasContentItems = !isUser && message.contentItems && message.contentItems.length > 0;

  // Legacy: standalone visuals at end (backward compatibility)
  const hasLegacyVisuals = !isUser && !hasContentItems && message.visuals && message.visuals.length > 0;

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
          isVoiceMessage ? (
            <VoiceMessagePlayer
              audioUrl={message.voice!.url}
              transcript={message.voice!.transcript}
              isTranscribing={message.voice!.isTranscribing}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
              {message.content}
            </p>
          )
        ) : showLoading ? (
          <LoadingDots />
        ) : hasContentItems ? (
          <InlineContentRenderer contentItems={message.contentItems!} />
        ) : (
          <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-white/10 prose-pre:border prose-pre:border-white/20">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {hasLegacyVisuals && (
          <div className="mt-4 flex flex-wrap gap-4 justify-center overflow-x-auto">
            {message.visuals!.map((visual, idx) => (
              <VisualRenderer key={idx} visual={visual} />
            ))}
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
    </motion.div>
  );
}
