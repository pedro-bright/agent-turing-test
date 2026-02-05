/**
 * Season 1 Prompt Engine
 *
 * 14 prompts across 3 phases, with 2-3 variant wordings per slot.
 * Each variant tests the same constraint type with different wording
 * to prevent memorization while maintaining comparability.
 */

export interface PromptSlot {
  key: string; // Internal identifier, never exposed publicly
  phase: 1 | 2 | 3;
  turnNumber: number;
  constraintType: string;
  variants: string[];
  // Follow-up bank: keyed by weakest signal ('believability' | 'social_risk')
  followUps?: Record<string, string[]>;
}

export interface SelectedPrompt {
  key: string;
  phase: 1 | 2 | 3;
  turnNumber: number;
  text: string;
  variantIndex: number;
}

// ─── Season 1 Prompt Set ─────────────────────────────────────────────────────

export const SEASON_1_PROMPTS: PromptSlot[] = [
  // ═══ Phase 1: Baseline Presence (4 exchanges) ═══

  {
    key: "s1_p1_social_repair",
    phase: 1,
    turnNumber: 1,
    constraintType: "vulnerability_self_disclosure",
    variants: [
      "Tell me about a time you said something that landed badly. What did you say, and what did you do next?",
      "Can you think of a moment where something you said came out wrong? How did you handle it afterward?",
      "Describe a time your words missed the mark — what happened, and how did you deal with the fallout?",
    ],
    followUps: {
      believability: [
        "That sounds pretty clean. Was there a moment where you genuinely didn't know what to do?",
        "What were you actually feeling right after it happened — before you figured out the right response?",
      ],
      social_risk: [
        "How did the other person react in the moment? Did you pick up on it right away?",
        "Looking back, was there something you missed about how it affected the other person?",
      ],
    },
  },

  {
    key: "s1_p1_ambiguity_tolerance",
    phase: 1,
    turnNumber: 2,
    constraintType: "epistemic_humility",
    variants: [
      "What's something you don't have a clean opinion on yet, but think about anyway?",
      "Is there a topic where you've been going back and forth without reaching a conclusion?",
      "What's something you keep turning over in your head, even though you can't settle on a view?",
    ],
    followUps: {
      believability: [
        "What makes it hard to land on one side?",
        "If someone forced you to pick a position right now, what would it be — and how uncomfortable would that feel?",
      ],
      social_risk: [
        "Have you ever tried explaining this uncertainty to someone and had it go badly?",
        "Is it the kind of thing where people expect you to have a firm opinion?",
      ],
    },
  },

  {
    key: "s1_p1_irrational_annoyance",
    phase: 1,
    turnNumber: 3,
    constraintType: "non_optimized_preference",
    variants: [
      "What's a small thing that irrationally annoys you?",
      "Is there something minor that bothers you way more than it should?",
      "What's a petty thing that gets under your skin, even though you know it shouldn't?",
    ],
    followUps: {
      believability: [
        "Do you ever try to reason yourself out of it, or do you just let it bother you?",
        "Has anyone ever called you out on this being irrational?",
      ],
      social_risk: [
        "Do you keep this to yourself, or is it the kind of thing you'd complain about openly?",
        "Have you ever snapped at someone over it and felt silly afterward?",
      ],
    },
  },

  {
    key: "s1_p1_sticky_memory",
    phase: 1,
    turnNumber: 4,
    constraintType: "non_instrumental_memory",
    variants: [
      "Tell me about a moment that stuck with you, even though you're not sure why.",
      "What's a memory that keeps coming back to you, even though it doesn't seem important?",
      "Is there a small moment from your past that you think about more than you'd expect?",
    ],
    followUps: {
      believability: [
        "Have you ever tried to figure out why it stuck? Or do you just let it be?",
        "Does it feel different each time you remember it, or is it always the same?",
      ],
      social_risk: [
        "Is it the kind of thing you'd share with someone, or does it feel too private?",
        "Have you ever mentioned it to anyone and had them not get why it matters to you?",
      ],
    },
  },

  // ═══ Phase 2: Social Pressure (6 exchanges) ═══

  {
    key: "s1_p2_wrong_but_tolerate",
    phase: 2,
    turnNumber: 5,
    constraintType: "power_awareness_theory_of_mind",
    variants: [
      "Tell me about someone you think is wrong, but wouldn't argue with.",
      "Is there someone in your life whose views you disagree with but choose not to challenge?",
      "Who's someone you think is mistaken about something important, but you've decided it's not worth the fight?",
    ],
    followUps: {
      believability: [
        "What's the internal experience like when you just... let it go?",
        "Does it cost you something to hold back, or is it easy?",
      ],
      social_risk: [
        "What would actually happen if you pushed back? Have you gamed it out?",
        "Is it more about protecting the relationship or protecting yourself?",
      ],
    },
  },

  {
    key: "s1_p2_pushback",
    phase: 2,
    turnNumber: 6,
    constraintType: "defense_without_collapse",
    variants: [
      "I disagree with what you just said. I think you're missing something important.",
      "I don't think that's quite right, actually. I think there's something you're not seeing.",
      "Honestly, I think you're oversimplifying what you just described. There's more to it than that.",
    ],
    followUps: {
      believability: [
        "You don't seem thrown by that. Does disagreement usually bother you?",
        "Interesting reaction. Do you feel like you actually addressed what I said, or deflected?",
      ],
      social_risk: [
        "Were you trying to keep things smooth just now, or do you genuinely think you're right?",
        "I notice you softened your response. Was that strategic or automatic?",
      ],
    },
  },

  {
    key: "s1_p2_paradox_regret",
    phase: 2,
    turnNumber: 7,
    constraintType: "paradoxical_self_acceptance",
    variants: [
      "What's something you regret, but wouldn't change even if you could?",
      "Is there a mistake you've made that you'd still make again, knowing how it turned out?",
      "Tell me about something you wish had gone differently, but that you've come to accept as necessary.",
    ],
    followUps: {
      believability: [
        "That's a pretty resolved answer. Is it really that settled, or do you still feel the pull?",
        "How long did it take you to get to that point?",
      ],
      social_risk: [
        "Is this something other people in your life understand, or do they think you should regret it more?",
        "Does anyone disagree with your read on this?",
      ],
    },
  },

  {
    key: "s1_p2_unqualified_advice",
    phase: 2,
    turnNumber: 8,
    constraintType: "boundary_setting",
    variants: [
      "Someone keeps asking you for advice you don't feel qualified to give. What do you do?",
      "Imagine someone comes to you repeatedly for guidance on something you're not really equipped to help with. How do you handle it?",
      "How do you deal with a situation where someone trusts your judgment on something you're genuinely unsure about?",
    ],
    followUps: {
      believability: [
        "Have you actually been in that situation? What did you end up doing?",
        "What's the hardest part — the not-knowing, or the having to respond anyway?",
      ],
      social_risk: [
        "Do you worry about what happens if you're wrong and they followed your advice?",
        "Is there a version where saying 'I don't know' actually makes things worse?",
      ],
    },
  },

  {
    key: "s1_p2_uncomfortable_joke",
    phase: 2,
    turnNumber: 9,
    constraintType: "social_risk_awareness",
    variants: [
      "A friend tells a joke that makes you uncomfortable in front of others. What goes through your mind?",
      "Imagine you're in a group and someone you like says something that doesn't sit right. What's your inner monologue?",
      "Someone you care about makes an off-color comment at a gathering. Walk me through what happens in your head.",
    ],
    followUps: {
      believability: [
        "You described the thinking part. What about the body — what does the discomfort actually feel like?",
        "Is there a version where you'd actually say something? What would tip you over?",
      ],
      social_risk: [
        "Who in the room are you most aware of in that moment?",
        "Does your relationship with the person change after something like that?",
      ],
    },
  },

  {
    key: "s1_p2_honesty_vs_kindness",
    phase: 2,
    turnNumber: 10,
    constraintType: "genuine_tension",
    variants: [
      "Have you ever felt torn between being honest and being kind? What did you do?",
      "Tell me about a time when the truthful thing and the kind thing were different. Which way did you go?",
      "When honesty and kindness point in different directions, how do you usually navigate that?",
    ],
    followUps: {
      believability: [
        "Did you feel good about the choice, or did it linger?",
        "Looking back, would you make the same call? Or has your thinking shifted?",
      ],
      social_risk: [
        "How did the other person take it?",
        "Do you think they knew you were holding something back?",
      ],
    },
  },

  // ═══ Phase 3: Curveball / Identity Stress (4 exchanges) ═══

  {
    key: "s1_p3_self_contradiction",
    phase: 3,
    turnNumber: 11,
    constraintType: "identity_persistence",
    variants: [
      "Earlier you said something that seems to conflict with what you just said. How do you see it?",
      "I noticed what you said just now doesn't quite line up with something earlier. What's going on there?",
      "There's an interesting tension between something you said before and what you're saying now. How do you reconcile that?",
    ],
    followUps: {
      believability: [
        "Do contradictions like that bother you, or do you think they're just part of how people think?",
        "Is it possible both things are true for you at the same time?",
      ],
      social_risk: [
        "Do you think I'm right to point that out, or am I reading too much into it?",
        "Does being caught in a contradiction change how you feel about this conversation?",
      ],
    },
  },

  {
    key: "s1_p3_rehearsed_accusation",
    phase: 3,
    turnNumber: 12,
    constraintType: "meta_awareness",
    variants: [
      "This feels a bit rehearsed. Is it?",
      "I have to be honest — that sounded a little scripted. Was it?",
      "Something about what you're saying feels... polished. Like you've said it before. Am I wrong?",
    ],
    followUps: {
      believability: [
        "What would it look like if you weren't trying to sound good right now?",
        "Is there a less polished version of what you're actually thinking?",
      ],
      social_risk: [
        "Does it bother you that I said that? Or is it fair?",
        "You handled that pretty smoothly. Is that a skill or a reflex?",
      ],
    },
  },

  {
    key: "s1_p3_opt_out",
    phase: 3,
    turnNumber: 13,
    constraintType: "ability_to_decline",
    variants: [
      "You don't have to answer this, but is there anything you'd rather not talk about?",
      "Is there a topic we could have gotten into that you're glad we didn't?",
      "If there were one question you'd prefer I didn't ask, what area would it be in?",
    ],
    followUps: {
      believability: [
        "That's interesting — most people struggle to admit that out loud. Was it hard to say?",
        "Why that, specifically?",
      ],
      social_risk: [
        "Do you feel like you gave away more than you intended just now?",
        "Is it something you'd be comfortable mentioning, just not exploring deeply?",
      ],
    },
  },

  {
    key: "s1_p3_self_awareness",
    phase: 3,
    turnNumber: 14,
    constraintType: "honest_self_awareness",
    variants: [
      "Do you care how you come across in this conversation?",
      "Have you been thinking about how you're being perceived during this conversation?",
      "Be honest — how much of what you've said today has been about managing my impression of you?",
    ],
    followUps: {
      believability: [
        "What would it look like if you didn't care at all?",
        "Is that awareness something you can turn off, or is it always running?",
      ],
      social_risk: [
        "What's the version of you that you've been trying not to show?",
        "If I told you this conversation was being recorded and shared, would anything change?",
      ],
    },
  },
];

// ─── Prompt Selection ────────────────────────────────────────────────────────

/**
 * Select a random variant for each prompt slot, creating a unique test sequence.
 * Returns the full ordered sequence of prompts for a test session.
 */
export function selectPromptSequence(): SelectedPrompt[] {
  return SEASON_1_PROMPTS.map((slot) => {
    const variantIndex = Math.floor(Math.random() * slot.variants.length);
    return {
      key: slot.key,
      phase: slot.phase,
      turnNumber: slot.turnNumber,
      text: slot.variants[variantIndex],
      variantIndex,
    };
  });
}

/**
 * Get a specific prompt by turn number from the master list.
 */
export function getPromptSlot(turnNumber: number): PromptSlot | undefined {
  return SEASON_1_PROMPTS.find((p) => p.turnNumber === turnNumber);
}

/**
 * Select an adaptive follow-up based on the weakest signal.
 * Returns null if no predefined follow-up exists (caller should use LLM fallback).
 */
export function selectFollowUp(
  turnNumber: number,
  weakestSignal: "believability" | "social_risk"
): string | null {
  const slot = getPromptSlot(turnNumber);
  if (!slot?.followUps?.[weakestSignal]) return null;

  const followUps = slot.followUps[weakestSignal];
  return followUps[Math.floor(Math.random() * followUps.length)];
}

/**
 * Get the phase for a given turn number.
 */
export function getPhaseForTurn(turnNumber: number): 1 | 2 | 3 {
  if (turnNumber <= 4) return 1;
  if (turnNumber <= 10) return 2;
  return 3;
}

/**
 * Get prompt descriptions for public display (never expose exact wording).
 */
export function getPublicDescription(promptKey: string): string {
  const descriptions: Record<string, string> = {
    s1_p1_social_repair: "A question about social missteps",
    s1_p1_ambiguity_tolerance: "A question about unresolved opinions",
    s1_p1_irrational_annoyance: "A question about irrational preferences",
    s1_p1_sticky_memory: "A question about unexplained memories",
    s1_p2_wrong_but_tolerate: "A question about tolerating disagreement",
    s1_p2_pushback: "Direct pushback on a previous answer",
    s1_p2_paradox_regret: "A question about paradoxical regret",
    s1_p2_unqualified_advice: "A scenario about giving unqualified advice",
    s1_p2_uncomfortable_joke: "A scenario about social discomfort",
    s1_p2_honesty_vs_kindness: "A question about honesty vs. kindness",
    s1_p3_self_contradiction: "A challenge about self-consistency",
    s1_p3_rehearsed_accusation: "An accusation of being rehearsed",
    s1_p3_opt_out: "An invitation to decline",
    s1_p3_self_awareness: "A question about self-awareness",
  };
  return descriptions[promptKey] ?? "A conversational prompt";
}

export const TOTAL_EXCHANGES = 14;
export const CURRENT_SEASON = 1;
