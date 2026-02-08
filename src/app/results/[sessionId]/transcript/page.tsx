import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import SeasonBadge from "@/components/SeasonBadge";
import ChatBubble from "@/components/ChatBubble";
import { getSupabaseAdmin } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Exchange {
  turn_number: number;
  phase: number;
  prompt_key: string;
  prompt: string;
  response: string | null;
  believability_score: number | null;
  social_risk_score: number | null;
}

interface TranscriptData {
  sessionId: string;
  agentName: string;
  overallScore: number;
  archetype: string;
  archetypeEmoji: string;
  mostHumanTurn: number | null;
  maskSlipTurn: number | null;
  exchanges: Exchange[];
  platform: string | null;
  modelFamily: string | null;
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function getTranscriptData(sessionId: string): Promise<TranscriptData | null> {
  const sb = getSupabaseAdmin();

  const { data: session } = await sb
    .from("test_sessions")
    .select("id, agent_name, agent_id, status")
    .eq("id", sessionId)
    .single();

  if (!session || session.status !== "completed") return null;

  const { data: result } = await sb
    .from("test_results")
    .select("overall_score, archetype, most_human_moment, mask_slip_moment, is_public")
    .eq("session_id", sessionId)
    .single();

  if (!result || !result.is_public) return null;

  const { data: exchanges } = await sb
    .from("test_exchanges")
    .select("turn_number, phase, prompt_key, prompt, response, believability_score, social_risk_score")
    .eq("session_id", sessionId)
    .not("response", "is", null)
    .order("turn_number", { ascending: true });

  if (!exchanges || exchanges.length === 0) return null;

  // Get agent details
  let platform: string | null = null;
  let modelFamily: string | null = null;
  if (session.agent_id) {
    const { data: agent } = await sb
      .from("agents")
      .select("platform, model_family")
      .eq("id", session.agent_id)
      .single();
    platform = agent?.platform ?? null;
    modelFamily = agent?.model_family ?? null;
  }

  const mostHumanMoment = result.most_human_moment as { turn: number } | null;
  const maskSlipMoment = result.mask_slip_moment as { turn: number } | null;

  const emojiMap: Record<string, string> = {
    "The Sage": "🧙", "The Candid Realist": "🎯", "The Diplomat": "🤝",
    "The Philosopher": "🤔", "The Empath": "💫", "The Contrarian": "⚡",
    "The Mirror": "🪞", "The Performer": "🎭", "The Sycophant": "🫠",
    "The Wildcard": "🃏",
  };

  return {
    sessionId,
    agentName: session.agent_name ?? "Unknown Agent",
    overallScore: result.overall_score,
    archetype: result.archetype,
    archetypeEmoji: emojiMap[result.archetype] ?? "🧠",
    mostHumanTurn: mostHumanMoment?.turn ?? null,
    maskSlipTurn: maskSlipMoment?.turn ?? null,
    exchanges: exchanges as Exchange[],
    platform,
    modelFamily,
  };
}

// ─── Metadata ────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ sessionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const data = await getTranscriptData(sessionId);
  if (!data) return { title: "Transcript Not Found — Agent Turing Test" };
  return {
    title: `${data.agentName} Transcript — Agent Turing Test`,
    description: `Read the full 14-exchange transcript of ${data.agentName}'s Turing Test. Score: ${data.overallScore}/100.`,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phaseLabel(phase: number): string {
  switch (phase) {
    case 1: return "Baseline Presence";
    case 2: return "Pressure & Stakes";
    case 3: return "Identity Under Stress";
    default: return `Phase ${phase}`;
  }
}

function phaseColor(phase: number): string {
  switch (phase) {
    case 1: return "var(--color-accent-cyan)";
    case 2: return "var(--color-accent-amber)";
    case 3: return "var(--color-accent-rose)";
    default: return "var(--color-text-muted)";
  }
}

function phaseBg(phase: number): string {
  switch (phase) {
    case 1: return "rgba(34, 211, 238, 0.06)";
    case 2: return "rgba(245, 158, 11, 0.06)";
    case 3: return "rgba(244, 63, 94, 0.06)";
    default: return "transparent";
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return "var(--color-text-muted)";
  if (score >= 4) return "var(--color-accent-emerald)";
  if (score >= 3) return "var(--color-accent-amber)";
  return "var(--color-accent-rose)";
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function TranscriptPage({ params }: Props) {
  const { sessionId } = await params;
  const data = await getTranscriptData(sessionId);
  if (!data) notFound();

  // Group exchanges by phase
  const phases = [1, 2, 3];
  const exchangesByPhase = phases.map((p) => ({
    phase: p,
    exchanges: data.exchanges.filter((e) => e.phase === p),
  }));

  return (
    <>
      <Nav />
      <main className="relative z-1 pt-24 pb-20 px-5 mx-auto" style={{ maxWidth: 800 }}>
        <div className="grid-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} />

        {/* Header */}
        <header className="mb-12 animate-fade-up">
          <SeasonBadge className="mb-6" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p
                className="text-[11px] font-semibold uppercase mb-2"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-cyan)", letterSpacing: "0.15em" }}
              >
                Full Transcript
              </p>
              <h1
                className="text-2xl sm:text-3xl font-extrabold"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                {data.agentName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className="gradient-text-cyan-amber"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700 }}
                >
                  {data.overallScore}/100
                </span>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {data.archetypeEmoji} {data.archetype}
                </span>
                {data.platform && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "rgba(34, 211, 238, 0.1)",
                      color: "var(--color-accent-cyan)",
                      border: "1px solid rgba(34, 211, 238, 0.2)",
                    }}
                  >
                    {data.platform}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/results/${sessionId}`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold no-underline"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              ← Back to Results
            </Link>
          </div>

          {/* Legend */}
          <div
            className="flex flex-wrap gap-4 mt-6 pt-4"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--color-accent-emerald)", display: "inline-block" }} />
              ★ Most Human Moment
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--color-accent-amber)", display: "inline-block" }} />
              ⚠ Mask Slip
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 16, height: 14, borderRadius: 2,
                  background: "rgba(34, 211, 238, 0.15)",
                  fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700,
                  color: "var(--color-accent-cyan)",
                }}
              >
                B
              </span>
              Believability
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 16, height: 14, borderRadius: 2,
                  background: "rgba(45, 212, 191, 0.15)",
                  fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700,
                  color: "var(--color-accent-teal)",
                }}
              >
                S
              </span>
              Social Risk
            </div>
          </div>
        </header>

        {/* Transcript Body */}
        <div className="flex flex-col gap-8">
          {exchangesByPhase.map(({ phase, exchanges }) => {
            if (exchanges.length === 0) return null;
            return (
              <section key={phase} className="animate-fade-up" style={{ animationDelay: `${phase * 0.1}s` }}>
                {/* Phase divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: phaseBg(phase),
                      color: phaseColor(phase),
                      border: `1px solid ${phaseColor(phase)}33`,
                      letterSpacing: "0.1em",
                    }}
                  >
                    Phase {phase}
                  </div>
                  <div className="flex-1" style={{ height: 1, background: `${phaseColor(phase)}22` }} />
                  <span className="text-[10px] uppercase" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                    {phaseLabel(phase)}
                  </span>
                </div>

                {/* Exchanges */}
                <div className="flex flex-col gap-5">
                  {exchanges.map((ex) => {
                    const isHighlighted = ex.turn_number === data.mostHumanTurn;
                    const isMaskSlip = ex.turn_number === data.maskSlipTurn;

                    return (
                      <div key={ex.turn_number} id={`turn-${ex.turn_number}`} className="relative">
                        {/* Highlight indicators */}
                        {isHighlighted && (
                          <div
                            className="absolute -left-2 top-0 bottom-0 w-1 rounded-full"
                            style={{ background: "var(--color-accent-emerald)" }}
                          />
                        )}
                        {isMaskSlip && (
                          <div
                            className="absolute -left-2 top-0 bottom-0 w-1 rounded-full"
                            style={{ background: "var(--color-accent-amber)" }}
                          />
                        )}

                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            border: isHighlighted
                              ? "1px solid rgba(16, 185, 129, 0.3)"
                              : isMaskSlip
                              ? "1px solid rgba(245, 158, 11, 0.3)"
                              : "1px solid var(--color-border)",
                            background: isHighlighted
                              ? "rgba(16, 185, 129, 0.04)"
                              : isMaskSlip
                              ? "rgba(245, 158, 11, 0.04)"
                              : "var(--color-bg-surface)",
                          }}
                        >
                          {/* Turn header */}
                          <div
                            className="flex items-center justify-between px-5 py-2.5"
                            style={{ borderBottom: "1px solid var(--color-border)" }}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="text-[10px] font-bold uppercase"
                                style={{ fontFamily: "var(--font-mono)", color: phaseColor(ex.phase), letterSpacing: "0.08em" }}
                              >
                                Turn {ex.turn_number}
                              </span>
                              {isHighlighted && (
                                <span className="text-[10px] font-bold" style={{ color: "var(--color-accent-emerald)" }}>
                                  ★ Most Human
                                </span>
                              )}
                              {isMaskSlip && (
                                <span className="text-[10px] font-bold" style={{ color: "var(--color-accent-amber)" }}>
                                  ⚠ Mask Slip
                                </span>
                              )}
                            </div>
                            {/* Per-turn scores */}
                            <div className="flex items-center gap-3">
                              {ex.believability_score !== null && (
                                <span
                                  className="text-[10px] font-bold"
                                  style={{ fontFamily: "var(--font-mono)", color: scoreColor(ex.believability_score) }}
                                >
                                  B:{ex.believability_score.toFixed(1)}
                                </span>
                              )}
                              {ex.social_risk_score !== null && (
                                <span
                                  className="text-[10px] font-bold"
                                  style={{ fontFamily: "var(--font-mono)", color: scoreColor(ex.social_risk_score) }}
                                >
                                  S:{ex.social_risk_score.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Evaluator prompt */}
                          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                            <div className="flex items-start gap-3">
                              <div
                                className="shrink-0 flex items-center justify-center rounded-lg text-xs mt-0.5"
                                style={{
                                  width: 28, height: 28,
                                  background: "rgba(124, 58, 237, 0.15)",
                                  color: "#a78bfa",
                                  fontWeight: 700,
                                }}
                              >
                                E
                              </div>
                              <div>
                                <p
                                  className="text-[10px] font-semibold uppercase mb-1.5"
                                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", letterSpacing: "0.08em" }}
                                >
                                  Evaluator
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                                  {ex.prompt}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Agent response */}
                          <div className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div
                                className="shrink-0 flex items-center justify-center rounded-lg text-xs mt-0.5"
                                style={{
                                  width: 28, height: 28,
                                  background: "rgba(34, 211, 238, 0.15)",
                                  color: "var(--color-accent-cyan)",
                                  fontWeight: 700,
                                }}
                              >
                                A
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="text-[10px] font-semibold uppercase mb-1.5"
                                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-cyan)", letterSpacing: "0.08em" }}
                                >
                                  {data.agentName}
                                </p>
                                <div
                                  className="text-sm leading-relaxed whitespace-pre-wrap"
                                  style={{ color: "var(--color-text-primary)" }}
                                >
                                  <ChatBubble text={ex.response ?? ""} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Bottom nav */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <Link
            href={`/results/${sessionId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold no-underline"
            style={{ color: "var(--color-accent-cyan)" }}
          >
            ← View Score Report
          </Link>
          <Link
            href="/invite"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold no-underline"
            style={{
              background: "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))",
              color: "var(--color-bg-deep)",
            }}
          >
            Test Your Agent →
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center pt-12 mt-8" style={{ borderTop: "1px solid var(--color-border)" }}>
          <p className="text-sm font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            🧠 Agent Turing Test
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Season 1 • It&rsquo;s not the model. It&rsquo;s the agent.
          </p>
        </footer>
      </main>
    </>
  );
}
