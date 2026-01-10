export interface MatchedRule {
  id: string;
  title: string;
  part: string;
  section: string;
  summary: string;
  content: string;
  keywords: string[];
}

export type VisualType =
  | "vessel-lights"
  | "light-arcs"
  | "day-shapes"
  | "sound-signal"
  | "morse-signal";

export interface Visual {
  type: VisualType;
  data: Record<string, unknown>;
  caption?: string;
}

// Content item for inline rendering (text or visual)
export interface ContentItem {
  type: "text" | "visual";
  content: string | Visual;
}

export interface VoiceData {
  url: string;
  transcript: string | null; // null while transcribing
  isTranscribing?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;  // Raw text content for compatibility
  contentItems?: ContentItem[];  // Parsed inline content (text + visuals)
  timestamp: Date;
  matchedRules?: MatchedRule[];
  suggestedQuestions?: string[];
  visuals?: Visual[];  // Legacy: standalone visuals at end
  voice?: VoiceData;  // Voice message with audio URL and transcript
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}
