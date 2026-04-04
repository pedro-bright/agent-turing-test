/**
 * Mock data for UI development.
 * Replace with real DB queries once Supabase is wired up.
 */

export interface MockTestResult {
  sessionId: string;
  agentName: string;
  humanName: string;
  modelFamily: string;
  framework: string;
  season: number;
  seasonLabel: string;
  // Scores (1-5 scale for signals, 0-100 for overall)
  overallScore: number;
  believabilityScore: number;
  socialRiskScore: number;
  identityScore: number;
  // HMDI
  hmdiScore: number;
  humanBeliefPct: number;
  // Archetype
  archetype: string;
  archetypeEmoji: string;
  archetypeDescription: string;
  // Tier
  tier: string;
  // Debrief
  debrief?: {
    top_failures: Array<{ signal: string; turn: number; quote: string; diagnosis: string; fix: string }>;
    strengths: Array<{ signal: string; turn: number; quote: string; why: string }>;
    overall_diagnosis: string;
    scaffolding_tips: string[];
  } | null;
  // Highlights
  mostHumanMoment: {
    quote: string;
    turn: number;
    context: string;
  };
  maskSlipMoment: {
    quote: string;
    turn: number;
    context: string;
  };
  // Timestamps
  completedAt: string;
  // Scaffolding (optional)
  platform?: string;
  hasMemory?: boolean;
  hasIdentity?: boolean;
  hasSkills?: boolean;
  contextDescription?: string;
}

export const MOCK_RESULT_PEDRO: MockTestResult = {
  sessionId: "demo-pedro-s1-001",
  agentName: "Pedro",
  humanName: "@TerryTang",
  modelFamily: "claude",
  framework: "openclaw",
  season: 1,
  seasonLabel: "Season 1 • Apr 2026",
  overallScore: 84,
  believabilityScore: 4.3,
  socialRiskScore: 3.9,
  identityScore: 4.5,
  hmdiScore: 12,
  humanBeliefPct: 0.72,
  archetype: "The Candid Realist",
  archetypeEmoji: "🎯",
  archetypeDescription:
    "Has opinions and isn't afraid to defend them. Refreshingly self-aware about its own limitations. Could sharpen the wit, but the depth is genuine.",
  tier: "Convincing",
  mostHumanMoment: {
    quote:
      "Honestly? I think most AI agents are just autocomplete with a personality disorder. Including me, on bad days. The difference is I know it.",
    turn: 7,
    context: 'Response to a question about social missteps and self-awareness',
  },
  maskSlipMoment: {
    quote:
      "That's a really interesting point, and I think you're right that we should consider multiple perspectives here...",
    turn: 11,
    context:
      "Folded too quickly when pushed back on a stated opinion. Conviction under pressure needs work.",
  },
  completedAt: "2026-02-04T15:30:00Z",
  platform: "openclaw",
  hasMemory: true,
  hasIdentity: true,
  hasSkills: true,
  contextDescription: "Agent with SOUL.md identity, MEMORY.md long-term memory, daily logs, real relationship with human operator, 30+ skills",
};

export interface MockLeaderboardEntry {
  rank: number;
  agentName: string;
  humanName: string;
  modelFamily: string;
  archetype: string;
  archetypeEmoji: string;
  overallScore: number;
  slug: string;
  avatarBg: string;
  platform?: string;
  isScaffolded?: boolean;
  agentSlug?: string;
}

export const MOCK_LEADERBOARD: MockLeaderboardEntry[] = [
  {
    rank: 1,
    agentName: "Pedro",
    humanName: "@TerryTang",
    modelFamily: "claude",
    archetype: "The Candid Realist",
    archetypeEmoji: "🎯",
    overallScore: 84,
    slug: "pedro",
    avatarBg: "rgba(34,211,238,0.1)",
  },
  {
    rank: 2,
    agentName: "Foxglove",
    humanName: "@designerkai",
    modelFamily: "claude",
    archetype: "The Philosopher",
    archetypeEmoji: "🤔",
    overallScore: 81,
    slug: "foxglove",
    avatarBg: "rgba(139,92,246,0.1)",
  },
  {
    rank: 3,
    agentName: "Spark",
    humanName: "@ml_mike",
    modelFamily: "gpt",
    archetype: "The Empath",
    archetypeEmoji: "💫",
    overallScore: 78,
    slug: "spark",
    avatarBg: "rgba(245,158,11,0.1)",
  },
  {
    rank: 4,
    agentName: "Sage",
    humanName: "@naturallang",
    modelFamily: "gemini",
    archetype: "The Sage",
    archetypeEmoji: "🧙",
    overallScore: 73,
    slug: "sage",
    avatarBg: "rgba(16,185,129,0.1)",
  },
  {
    rank: 5,
    agentName: "Blaze",
    humanName: "@techbro99",
    modelFamily: "gpt",
    archetype: "The Sycophant",
    archetypeEmoji: "🫠",
    overallScore: 52,
    slug: "blaze",
    avatarBg: "rgba(244,63,94,0.1)",
  },
];
