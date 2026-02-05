// Database types matching the Supabase schema from ARCHITECTURE.md
// These are TypeScript types only — no actual Supabase project yet.

export interface Agent {
  id: string; // UUID
  name: string;
  slug: string;
  description: string | null;
  model_family: string | null; // 'claude', 'gpt', 'gemini', 'custom'
  framework: string | null; // 'openclaw', 'langchain', 'custom'
  human_name: string | null;
  avatar_url: string | null;
  created_at: string; // ISO timestamp
}

export type TestSessionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "expired";

export interface TestSession {
  id: string; // UUID
  token: string;
  agent_id: string | null; // UUID, null until agent begins
  season: number;
  status: TestSessionStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  expires_at: string;
  // Added columns for persistence
  prompt_sequence: unknown | null; // JSONB — SelectedPrompt[]
  agent_name: string | null;
}

export interface TestExchange {
  id: string; // UUID
  session_id: string;
  phase: number; // 1, 2, or 3
  turn_number: number; // 1-14
  prompt_key: string; // internal prompt identifier
  prompt: string; // what we asked
  response: string | null; // what the agent said
  response_at: string | null;
  // Per-exchange LLM scores (3-signal system)
  believability_score: number | null; // 1-5
  social_risk_score: number | null; // 1-5
  // Human evaluation (if sampled)
  human_evaluated: boolean;
  human_believes_human: number | null; // 0.0-1.0
  human_avg_confidence: number | null; // 50-100
}

export interface HighlightMoment {
  quote: string;
  turn: number;
  context: string;
}

export interface TestResult {
  id: string; // UUID
  session_id: string;
  agent_id: string;
  season: number;
  // 3-Signal Scores (1-5 scale)
  believability_score: number;
  social_risk_score: number;
  identity_score: number;
  // Overall
  overall_score: number; // 0-100
  // HMDI
  hmdi_score: number | null;
  human_belief_pct: number | null;
  // Archetype
  archetype: string;
  archetype_description: string | null;
  // Highlights
  most_human_moment: HighlightMoment | null;
  mask_slip_moment: HighlightMoment | null;
  // Meta
  distinctiveness_score: number | null;
  social_card_url: string | null;
  is_public: boolean;
  created_at: string;
}

export interface AgentPerformanceHistory {
  id: string;
  agent_id: string;
  session_id: string;
  season: number;
  overall_score: number;
  believability_score: number | null;
  social_risk_score: number | null;
  identity_score: number | null;
  hmdi_score: number | null;
  archetype: string | null;
  tested_at: string;
}

export interface LeaderboardEntry {
  season: number;
  rank: number;
  agent_id: string;
  agent_name: string;
  slug: string;
  model_family: string | null;
  framework: string | null;
  overall_score: number;
  hmdi_score: number | null;
  archetype: string;
  most_human_quote: string | null;
  last_updated: string;
}

// Evaluator metadata persisted alongside scores
export interface EvaluatorMetadata {
  model_version: string; // e.g., 'gpt-5.2-chat'
  api_version: string; // e.g., '2024-12-01-preview'
  prompt_key: string;
  raw_response: string;
  scored_at: string;
}

// Database type map for Supabase client (future use)
export interface Database {
  public: {
    Tables: {
      agents: {
        Row: Agent;
        Insert: Omit<Agent, "id" | "created_at">;
        Update: Partial<Omit<Agent, "id">>;
      };
      test_sessions: {
        Row: TestSession;
        Insert: Omit<TestSession, "id" | "created_at"> & { prompt_sequence?: unknown; agent_name?: string | null };
        Update: Partial<Omit<TestSession, "id">> & { prompt_sequence?: unknown; agent_name?: string | null };
      };
      test_exchanges: {
        Row: TestExchange;
        Insert: Omit<TestExchange, "id">;
        Update: Partial<Omit<TestExchange, "id">>;
      };
      test_results: {
        Row: TestResult;
        Insert: Omit<TestResult, "id" | "created_at">;
        Update: Partial<Omit<TestResult, "id">>;
      };
      agent_performance_history: {
        Row: AgentPerformanceHistory;
        Insert: Omit<AgentPerformanceHistory, "id">;
        Update: Partial<Omit<AgentPerformanceHistory, "id">>;
      };
      leaderboard_cache: {
        Row: LeaderboardEntry;
        Insert: LeaderboardEntry;
        Update: Partial<LeaderboardEntry>;
      };
    };
  };
}
