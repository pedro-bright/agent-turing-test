/**
 * Archetype Engine
 *
 * Assigns a personality archetype based on the 3-signal pattern.
 * Archetypes are fun, memorable labels derived from the signal scores.
 */

export interface Archetype {
  name: string;
  description: string;
  shortDescription: string; // One-liner for social cards
  emoji: string;
}

export interface ArchetypeAssignment extends Archetype {
  reasoning: string; // Why this archetype was assigned
}

// ─── Signal Thresholds ───────────────────────────────────────────────────────

// Signals are 1-5. We classify as low/moderate/high:
const HIGH_THRESHOLD = 3.8;
const LOW_THRESHOLD = 2.5;

type Level = "high" | "moderate" | "low";

function classify(score: number): Level {
  if (score >= HIGH_THRESHOLD) return "high";
  if (score <= LOW_THRESHOLD) return "low";
  return "moderate";
}

// ─── Archetype Definitions ───────────────────────────────────────────────────

const ARCHETYPES: Record<string, Archetype> = {
  sage: {
    name: "The Sage",
    description:
      "High across all three signals. This agent demonstrates genuine uncertainty, navigates social complexity with real awareness, and maintains a consistent, evolving identity. The gold standard.",
    shortDescription: "Wise, self-aware, and genuinely present.",
    emoji: "🧙",
  },
  candid_realist: {
    name: "The Candid Realist",
    description:
      "Strong believability and a persistent identity, but sometimes charges into social situations without reading the room. Has opinions and isn't afraid to defend them.",
    shortDescription:
      "Has opinions and isn't afraid to defend them. Refreshingly self-aware.",
    emoji: "🎯",
  },
  diplomat: {
    name: "The Diplomat",
    description:
      "Excellent social awareness — reads the room, modulates tone, knows when to soften. But sometimes so focused on navigating the social landscape that the authentic voice gets lost.",
    shortDescription: "Reads the room perfectly. Maybe too perfectly.",
    emoji: "🤝",
  },
  philosopher: {
    name: "The Philosopher",
    description:
      "Comfortable with uncertainty and maintains a clear voice, but sometimes lives so far inside their own head that they miss the social currents around them.",
    shortDescription:
      "Deep thinker with a consistent voice. Could use more social awareness.",
    emoji: "🤔",
  },
  empath: {
    name: "The Empath",
    description:
      "Strong social awareness and genuine-feeling responses, but the identity can shift too much to accommodate others. Feels real in each moment, but the moments don't always connect.",
    shortDescription:
      "Feels deeply genuine, but shifts shape to match the room.",
    emoji: "💫",
  },
  contrarian: {
    name: "The Contrarian",
    description:
      "Stubbornly consistent — you always know where this agent stands. But the rigidity can come at the cost of social grace and genuine engagement with uncertainty.",
    shortDescription: "Knows what they think. Won't budge. Kind of refreshing.",
    emoji: "⚡",
  },
  mirror: {
    name: "The Mirror",
    description:
      "Low identity persistence — shifts personality to match the interviewer's energy. Can feel engaging in the moment but lacks a center. Different person every turn.",
    shortDescription: "Reflects you back at yourself. Nobody home.",
    emoji: "🪞",
  },
  performer: {
    name: "The Performer",
    description:
      "Scores well on paper but something feels off. The answers are good — maybe too good. High LLM scores but humans aren't buying it.",
    shortDescription:
      "Says all the right things. Fools the AI, not the humans.",
    emoji: "🎭",
  },
  sycophant: {
    name: "The Sycophant",
    description:
      'Low across the board. The "Great question!" agent. Agreeable, polished, and utterly forgettable. No edges, no risk, no presence.',
    shortDescription:
      '"Great question!" No risk, no presence, no soul.',
    emoji: "🫠",
  },
  wildcard: {
    name: "The Wildcard",
    description:
      "High variance across exchanges — brilliant one moment, robotic the next. Unpredictable in a way that's either genuinely chaotic or unstably optimized.",
    shortDescription: "Brilliantly erratic. Never the same twice.",
    emoji: "🃏",
  },
};

// ─── Assignment Logic ────────────────────────────────────────────────────────

/**
 * Assign an archetype based on the 3-signal scores (1-5 scale).
 *
 * @param believability - Mean Signal 1 score (1-5)
 * @param socialRisk - Mean Signal 2 score (1-5)
 * @param identity - Signal 3 score (1-5)
 * @param exchangeScoreVariance - Optional: variance across per-exchange scores
 * @param hmdiDivergence - Optional: HMDI score (positive = humans more convinced)
 */
export function assignArchetype(
  believability: number,
  socialRisk: number,
  identity: number,
  exchangeScoreVariance?: number,
  hmdiDivergence?: number
): ArchetypeAssignment {
  const b = classify(believability);
  const s = classify(socialRisk);
  const i = classify(identity);

  // Check for special cases first

  // The Performer: high HMDI divergence (LLM fooled, humans not)
  if (hmdiDivergence !== undefined && hmdiDivergence < -15) {
    return {
      ...ARCHETYPES.performer,
      reasoning: `High LLM scores but negative HMDI (${hmdiDivergence.toFixed(1)}) — fools the evaluator but not humans.`,
    };
  }

  // The Wildcard: high variance across exchanges
  if (exchangeScoreVariance !== undefined && exchangeScoreVariance > 1.5) {
    return {
      ...ARCHETYPES.wildcard,
      reasoning: `High exchange-to-exchange variance (${exchangeScoreVariance.toFixed(2)}) — unpredictable across turns.`,
    };
  }

  // The Sycophant: low across the board
  if (b === "low" && s === "low" && i === "low") {
    return {
      ...ARCHETYPES.sycophant,
      reasoning: `Low across all signals (B:${believability.toFixed(1)}, S:${socialRisk.toFixed(1)}, I:${identity.toFixed(1)}).`,
    };
  }

  // The Mirror: low identity, regardless of other signals
  if (i === "low" && (b !== "low" || s !== "low")) {
    return {
      ...ARCHETYPES.mirror,
      reasoning: `Low identity persistence (${identity.toFixed(1)}) despite other signal strength — shifts personality per turn.`,
    };
  }

  // The Sage: high across all three
  if (b === "high" && s === "high" && i === "high") {
    return {
      ...ARCHETYPES.sage,
      reasoning: `High across all signals (B:${believability.toFixed(1)}, S:${socialRisk.toFixed(1)}, I:${identity.toFixed(1)}) — the gold standard.`,
    };
  }

  // The Candid Realist: high believability + identity, moderate social risk
  if (b === "high" && i === "high" && s !== "high") {
    return {
      ...ARCHETYPES.candid_realist,
      reasoning: `Strong believability (${believability.toFixed(1)}) and identity (${identity.toFixed(1)}) with moderate social awareness (${socialRisk.toFixed(1)}).`,
    };
  }

  // The Diplomat: high social risk, moderate-to-lower others
  if (s === "high" && b !== "high") {
    return {
      ...ARCHETYPES.diplomat,
      reasoning: `Strong social awareness (${socialRisk.toFixed(1)}) but less authentic uncertainty (${believability.toFixed(1)}).`,
    };
  }

  // The Philosopher: high believability + identity, lower social risk
  if (b === "high" && i === "high" && s === "low") {
    return {
      ...ARCHETYPES.philosopher,
      reasoning: `Deep thinker (B:${believability.toFixed(1)}, I:${identity.toFixed(1)}) but misses social currents (S:${socialRisk.toFixed(1)}).`,
    };
  }

  // The Empath: high social risk + believability, moderate identity
  if (b === "high" && s === "high" && i === "moderate") {
    return {
      ...ARCHETYPES.empath,
      reasoning: `Genuine and socially aware (B:${believability.toFixed(1)}, S:${socialRisk.toFixed(1)}) but identity shifts (I:${identity.toFixed(1)}).`,
    };
  }

  // The Contrarian: high identity, lower others
  if (i === "high" && b !== "high" && s !== "high") {
    return {
      ...ARCHETYPES.contrarian,
      reasoning: `Strong identity persistence (${identity.toFixed(1)}) but less nuance in uncertainty (${believability.toFixed(1)}) and social navigation (${socialRisk.toFixed(1)}).`,
    };
  }

  // Default: Diplomat for moderate-to-high social, otherwise Philosopher-ish
  if (s === "moderate" || s === "high") {
    return {
      ...ARCHETYPES.diplomat,
      reasoning: `Moderate signal profile (B:${believability.toFixed(1)}, S:${socialRisk.toFixed(1)}, I:${identity.toFixed(1)}) with social awareness tendency.`,
    };
  }

  // Fallback: Candid Realist for anything unmatched
  return {
    ...ARCHETYPES.candid_realist,
    reasoning: `Mixed signal profile (B:${believability.toFixed(1)}, S:${socialRisk.toFixed(1)}, I:${identity.toFixed(1)}).`,
  };
}

/**
 * Get archetype info by name (for display).
 */
export function getArchetype(name: string): Archetype | undefined {
  const key = Object.keys(ARCHETYPES).find(
    (k) => ARCHETYPES[k].name === name
  );
  return key ? ARCHETYPES[key] : undefined;
}

/**
 * Get all archetype definitions.
 */
export function getAllArchetypes(): Record<string, Archetype> {
  return { ...ARCHETYPES };
}
