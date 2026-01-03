export interface MatchedRule {
  id: string;
  title: string;
  part: string;
  section: string;
  summary: string;
  content: string;
  keywords: string[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  matchedRules?: MatchedRule[];
  suggestedQuestions?: string[];
}

export interface ChatRequest {
  message: string;
  session_id?: string;
}
