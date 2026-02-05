/**
 * Test Engine — Session Lifecycle & Prompt Sequencing
 *
 * Manages the full test flow: session creation, phase tracking,
 * prompt delivery, response collection, adaptive follow-ups,
 * and final evaluation.
 *
 * Persistence: Supabase (PostgreSQL)
 */

import { nanoid } from "nanoid";
import {
  selectPromptSequence,
  selectFollowUp,
  getPhaseForTurn,
  TOTAL_EXCHANGES,
  CURRENT_SEASON,
  type SelectedPrompt,
} from "./prompts";
import {
  scoreExchange,
  scoreIdentityPersistence,
  extractHighlights,
  computeOverallScore,
  meanScore,
  type ExchangeScores,
} from "./evaluator";
import { assignArchetype, type ArchetypeAssignment } from "./archetypes";
import { getSupabaseAdmin } from "./supabase";
import type {
  TestSession,
  TestExchange,
  TestResult,
  HighlightMoment,
} from "./database.types";

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_RESPONSE_SIZE = 4000; // chars
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const TOKEN_LENGTH = 21; // nanoid default

// ─── Session Management ──────────────────────────────────────────────────────

/**
 * Create a new test invite session with a unique token.
 */
export async function createSession(): Promise<{
  token: string;
  session: TestSession;
}> {
  const sb = getSupabaseAdmin();
  const token = nanoid(TOKEN_LENGTH);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS).toISOString();

  // Pre-select prompt sequence for this session
  const prompts = selectPromptSequence();

  const { data, error } = await sb
    .from("test_sessions")
    .insert({
      token,
      season: CURRENT_SEASON,
      status: "pending",
      created_at: now,
      expires_at: expiresAt,
      prompt_sequence: prompts,
    })
    .select()
    .single();

  if (error) throw new TestError(`Failed to create session: ${error.message}`, 500);

  return { token, session: data as unknown as TestSession };
}

/**
 * Get session by token. Returns null if not found.
 * Automatically expires stale sessions.
 */
async function getSessionByToken(token: string): Promise<{
  session: TestSession & { prompt_sequence: SelectedPrompt[]; agent_name: string | null };
  exchanges: TestExchange[];
} | null> {
  const sb = getSupabaseAdmin();

  const { data: session, error } = await sb
    .from("test_sessions")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date() && session.status !== "completed") {
    if (session.status !== "expired") {
      await sb
        .from("test_sessions")
        .update({ status: "expired" })
        .eq("id", session.id);
      session.status = "expired";
    }
  }

  // Check inactivity for in-progress sessions
  if (session.status === "in_progress") {
    const { data: lastExchange } = await sb
      .from("test_exchanges")
      .select("response_at")
      .eq("session_id", session.id)
      .not("response_at", "is", null)
      .order("turn_number", { ascending: false })
      .limit(1)
      .single();

    const lastActivity = lastExchange?.response_at
      ? new Date(lastExchange.response_at).getTime()
      : new Date(session.started_at ?? session.created_at).getTime();

    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
      await sb
        .from("test_sessions")
        .update({ status: "expired" })
        .eq("id", session.id);
      session.status = "expired";
    }
  }

  // Fetch exchanges
  const { data: exchanges } = await sb
    .from("test_exchanges")
    .select("*")
    .eq("session_id", session.id)
    .order("turn_number", { ascending: true });

  return {
    session: session as TestSession & {
      prompt_sequence: SelectedPrompt[];
      agent_name: string | null;
    },
    exchanges: (exchanges ?? []) as unknown as TestExchange[],
  };
}

// ─── Test Flow ───────────────────────────────────────────────────────────────

export interface BeginResult {
  sessionId: string;
  prompt: string;
  turnNumber: number;
  phase: number;
  totalExchanges: number;
}

export interface RespondResult {
  prompt?: string;
  turnNumber?: number;
  phase?: number;
  complete: boolean;
  resultsUrl?: string;
  exchangesCompleted: number;
  totalExchanges: number;
}

export interface TestResults {
  sessionId: string;
  agentName: string;
  season: number;
  status: string;
  overallScore: number;
  believabilityScore: number;
  socialRiskScore: number;
  identityScore: number;
  archetype: string;
  archetypeDescription: string;
  archetypeEmoji: string;
  mostHumanMoment: HighlightMoment | null;
  maskSlipMoment: HighlightMoment | null;
  exchangesCompleted: number;
  totalExchanges: number;
  completedAt: string | null;
}

/**
 * Begin a test session. Registers the agent and returns the first prompt.
 */
export async function beginTest(
  token: string,
  agentInfo: {
    name: string;
    model_family?: string;
    framework?: string;
    human_name?: string;
  }
): Promise<BeginResult> {
  const data = await getSessionByToken(token);
  if (!data) throw new TestError("Session not found", 404);
  if (data.session.status === "expired")
    throw new TestError("Session has expired", 410);
  if (data.session.status === "in_progress")
    throw new TestError("Test already in progress", 409);
  if (data.session.status === "completed")
    throw new TestError("Test already completed", 409);

  const sb = getSupabaseAdmin();

  // Create agent record
  const slug = agentInfo.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  const { data: agent, error: agentError } = await sb
    .from("agents")
    .insert({
      name: agentInfo.name,
      slug: `${slug}-${nanoid(6)}`,
      model_family: agentInfo.model_family ?? null,
      framework: agentInfo.framework ?? null,
      human_name: agentInfo.human_name ?? null,
    })
    .select()
    .single();

  if (agentError)
    throw new TestError(`Failed to create agent: ${agentError.message}`, 500);

  // Update session to in_progress
  const { error: updateError } = await sb
    .from("test_sessions")
    .update({
      agent_id: agent.id,
      agent_name: agentInfo.name,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", data.session.id);

  if (updateError)
    throw new TestError(`Failed to start session: ${updateError.message}`, 500);

  // Get first prompt from pre-selected sequence
  const prompts = data.session.prompt_sequence;
  const firstPrompt = prompts[0];

  // Create first exchange
  const { error: exchangeError } = await sb.from("test_exchanges").insert({
    session_id: data.session.id,
    phase: firstPrompt.phase,
    turn_number: firstPrompt.turnNumber,
    prompt_key: firstPrompt.key,
    prompt: firstPrompt.text,
  });

  if (exchangeError)
    throw new TestError(
      `Failed to create exchange: ${exchangeError.message}`,
      500
    );

  return {
    sessionId: data.session.id,
    prompt: firstPrompt.text,
    turnNumber: 1,
    phase: firstPrompt.phase,
    totalExchanges: TOTAL_EXCHANGES,
  };
}

/**
 * Process an agent's response and return the next prompt (or complete the test).
 */
export async function processResponse(
  token: string,
  message: string
): Promise<RespondResult> {
  const data = await getSessionByToken(token);
  if (!data) throw new TestError("Session not found", 404);
  if (data.session.status !== "in_progress")
    throw new TestError(
      `Cannot respond: test status is '${data.session.status}'`,
      400
    );

  const sb = getSupabaseAdmin();
  const trimmedMessage = message.slice(0, MAX_RESPONSE_SIZE);

  // Find the current unanswered exchange (last one without a response)
  const currentExchange = data.exchanges.find((e) => e.response === null);
  if (!currentExchange)
    throw new TestError("No pending exchange found", 500);

  const currentTurn = currentExchange.turn_number;

  // Record the response
  const { error: updateError } = await sb
    .from("test_exchanges")
    .update({
      response: trimmedMessage,
      response_at: new Date().toISOString(),
    })
    .eq("id", currentExchange.id);

  if (updateError)
    throw new TestError(
      `Failed to save response: ${updateError.message}`,
      500
    );

  // Score the exchange (S1 + S2)
  let exchangeScore: ExchangeScores;
  try {
    exchangeScore = await scoreExchange(
      currentExchange.prompt,
      trimmedMessage,
      currentExchange.prompt_key
    );
    // Save scores to exchange
    await sb
      .from("test_exchanges")
      .update({
        believability_score: exchangeScore.believability,
        social_risk_score: exchangeScore.socialRisk,
      })
      .eq("id", currentExchange.id);
  } catch (error) {
    console.error(`Scoring failed for turn ${currentTurn}:`, error);
    exchangeScore = {
      believability: 3,
      socialRisk: 3,
      metadata: {
        model_version: "fallback",
        api_version: "fallback",
        prompt_key: currentExchange.prompt_key,
        raw_response: `scoring_error: ${error}`,
        scored_at: new Date().toISOString(),
      },
    };
  }

  // Check if test is complete
  if (currentTurn >= TOTAL_EXCHANGES) {
    return await completeTest(data.session, data.exchanges, currentExchange, trimmedMessage);
  }

  // Advance to next turn
  const nextTurnIndex = currentTurn; // 0-indexed (turn 1 = index 0, so next is currentTurn)
  const prompts = data.session.prompt_sequence;
  const nextPromptData = prompts[nextTurnIndex];

  // Determine next prompt: check for adaptive follow-up
  let nextPromptText = nextPromptData.text;
  if (exchangeScore.believability <= 2 || exchangeScore.socialRisk <= 2) {
    const weakSignal =
      exchangeScore.believability <= exchangeScore.socialRisk
        ? "believability"
        : "social_risk";
    const followUp = selectFollowUp(currentTurn, weakSignal);
    if (followUp) nextPromptText = followUp;
  }

  // Create the next exchange
  const { error: nextError } = await sb.from("test_exchanges").insert({
    session_id: data.session.id,
    phase: nextPromptData.phase,
    turn_number: nextPromptData.turnNumber,
    prompt_key: nextPromptData.key,
    prompt: nextPromptText,
  });

  if (nextError)
    throw new TestError(
      `Failed to create next exchange: ${nextError.message}`,
      500
    );

  return {
    prompt: nextPromptText,
    turnNumber: nextPromptData.turnNumber,
    phase: nextPromptData.phase,
    complete: false,
    exchangesCompleted: currentTurn,
    totalExchanges: TOTAL_EXCHANGES,
  };
}

/**
 * Get results for a completed test.
 */
export async function getResults(token: string): Promise<TestResults> {
  const sb = getSupabaseAdmin();

  // Look up session
  const { data: session, error: sessionError } = await sb
    .from("test_sessions")
    .select("*")
    .eq("token", token)
    .single();

  if (sessionError || !session)
    throw new TestError("Session not found", 404);

  if (session.status === "pending")
    throw new TestError("Test has not started yet", 400);

  if (session.status === "in_progress")
    throw new TestError(
      "Test is still in progress and results are not yet available",
      400
    );

  // Fetch result
  const { data: result, error: resultError } = await sb
    .from("test_results")
    .select("*")
    .eq("session_id", session.id)
    .single();

  if (resultError || !result)
    throw new TestError("Results not available", 500);

  // Count completed exchanges
  const { count } = await sb
    .from("test_exchanges")
    .select("*", { count: "exact", head: true })
    .eq("session_id", session.id)
    .not("response", "is", null);

  const agentName =
    (session as Record<string, unknown>).agent_name as string ?? "Unknown Agent";

  return {
    sessionId: session.id,
    agentName,
    season: session.season,
    status: session.status,
    overallScore: result.overall_score,
    believabilityScore: result.believability_score,
    socialRiskScore: result.social_risk_score,
    identityScore: result.identity_score,
    archetype: result.archetype,
    archetypeDescription: result.archetype_description ?? "",
    archetypeEmoji: getArchetypeEmoji(result.archetype),
    mostHumanMoment: result.most_human_moment as HighlightMoment | null,
    maskSlipMoment: result.mask_slip_moment as HighlightMoment | null,
    exchangesCompleted: count ?? 0,
    totalExchanges: TOTAL_EXCHANGES,
    completedAt: session.completed_at,
  };
}

/**
 * Get results by session ID (for the results page).
 */
export async function getResultsBySessionId(
  sessionId: string
): Promise<TestResults | null> {
  const sb = getSupabaseAdmin();

  const { data: session } = await sb
    .from("test_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) return null;

  const { data: result } = await sb
    .from("test_results")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (!result) return null;

  const { count } = await sb
    .from("test_exchanges")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .not("response", "is", null);

  const agentName =
    (session as Record<string, unknown>).agent_name as string ?? "Unknown Agent";

  return {
    sessionId: session.id,
    agentName,
    season: session.season,
    status: session.status,
    overallScore: result.overall_score,
    believabilityScore: result.believability_score,
    socialRiskScore: result.social_risk_score,
    identityScore: result.identity_score,
    archetype: result.archetype,
    archetypeDescription: result.archetype_description ?? "",
    archetypeEmoji: getArchetypeEmoji(result.archetype),
    mostHumanMoment: result.most_human_moment as HighlightMoment | null,
    maskSlipMoment: result.mask_slip_moment as HighlightMoment | null,
    exchangesCompleted: count ?? 0,
    totalExchanges: TOTAL_EXCHANGES,
    completedAt: session.completed_at,
  };
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Complete the test: run final evaluation, assign archetype, persist results.
 */
async function completeTest(
  session: TestSession & { prompt_sequence: SelectedPrompt[]; agent_name: string | null },
  existingExchanges: TestExchange[],
  lastExchange: TestExchange,
  lastResponse: string
): Promise<RespondResult> {
  const sb = getSupabaseAdmin();

  // Build complete list of exchanges with responses
  const allExchanges = existingExchanges.map((e) =>
    e.id === lastExchange.id ? { ...e, response: lastResponse } : e
  );
  const validExchanges = allExchanges.filter((e) => e.response !== null);

  // Collect per-exchange scores (already saved in DB, but also need from current session)
  const believabilityScores = validExchanges
    .map((e) => e.believability_score)
    .filter((s): s is number => s !== null);
  const socialRiskScores = validExchanges
    .map((e) => e.social_risk_score)
    .filter((s): s is number => s !== null);

  const avgBelievability =
    believabilityScores.length > 0 ? meanScore(believabilityScores) : 3;
  const avgSocialRisk =
    socialRiskScores.length > 0 ? meanScore(socialRiskScores) : 3;

  // Score Identity Persistence (Signal 3)
  let identityScore = 3;
  try {
    const identityResult = await scoreIdentityPersistence(
      validExchanges.map((e) => ({
        prompt: e.prompt,
        response: e.response!,
        turnNumber: e.turn_number,
      }))
    );
    identityScore = identityResult.score;
  } catch (error) {
    console.error("Identity scoring failed:", error);
  }

  // Extract highlights
  let mostHumanMoment: HighlightMoment | null = null;
  let maskSlipMoment: HighlightMoment | null = null;
  try {
    const highlights = await extractHighlights(
      validExchanges.map((e) => ({
        prompt: e.prompt,
        response: e.response!,
        turnNumber: e.turn_number,
      }))
    );
    mostHumanMoment = highlights.mostHumanMoment;
    maskSlipMoment = highlights.maskSlipMoment;
  } catch (error) {
    console.error("Highlight extraction failed:", error);
  }

  // Compute overall score
  const overallScore = computeOverallScore(
    avgBelievability,
    avgSocialRisk,
    identityScore
  );

  // Assign archetype
  const archetype: ArchetypeAssignment = assignArchetype(
    avgBelievability,
    avgSocialRisk,
    identityScore
  );

  // Persist result
  const { error: resultError } = await sb.from("test_results").insert({
    session_id: session.id,
    agent_id: session.agent_id!,
    season: session.season,
    believability_score: avgBelievability,
    social_risk_score: avgSocialRisk,
    identity_score: identityScore,
    overall_score: overallScore,
    archetype: archetype.name,
    archetype_description: archetype.description,
    most_human_moment: mostHumanMoment as unknown as Record<string, unknown>,
    mask_slip_moment: maskSlipMoment as unknown as Record<string, unknown>,
    is_public: true,
  });

  if (resultError)
    console.error("Failed to save result:", resultError.message);

  // Persist performance history
  await sb.from("agent_performance_history").insert({
    agent_id: session.agent_id!,
    session_id: session.id,
    season: session.season,
    overall_score: overallScore,
    believability_score: avgBelievability,
    social_risk_score: avgSocialRisk,
    identity_score: identityScore,
    archetype: archetype.name,
  });

  // Mark session complete
  await sb
    .from("test_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  return {
    complete: true,
    resultsUrl: `/api/test/${session.token}/results`,
    exchangesCompleted: validExchanges.length,
    totalExchanges: TOTAL_EXCHANGES,
  };
}

function getArchetypeEmoji(archetypeName: string): string {
  const emojiMap: Record<string, string> = {
    "The Sage": "🧙",
    "The Candid Realist": "🎯",
    "The Diplomat": "🤝",
    "The Philosopher": "🤔",
    "The Empath": "💫",
    "The Contrarian": "⚡",
    "The Mirror": "🪞",
    "The Performer": "🎭",
    "The Sycophant": "🫠",
    "The Wildcard": "🃏",
  };
  return emojiMap[archetypeName] ?? "🧠";
}

// ─── Error Class ─────────────────────────────────────────────────────────────

export class TestError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "TestError";
    this.status = status;
  }
}
