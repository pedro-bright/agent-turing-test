import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResultsBySessionId } from "@/lib/test-engine";
import { MOCK_RESULT_PEDRO } from "@/lib/mock-data";
import Nav from "@/components/Nav";
import ScoreBar from "@/components/ScoreBar";
import TriangleChart from "@/components/TriangleChart";
import SignalBreakdown from "@/components/SignalBreakdown";
import ShareButtons from "@/components/ShareButtons";
import SeasonBadge from "@/components/SeasonBadge";

// ─── Data fetching helper ────────────────────────────────────────────────────

function scoreTier(score: number): string {
  if (score >= 90) return "Uncanny";
  if (score >= 75) return "Convincing";
  if (score >= 60) return "Plausible";
  if (score >= 45) return "Detectable";
  if (score >= 30) return "Mechanical";
  return "Robotic";
}

async function getResult(sessionId: string) {
  // Use demo session for mock data preview
  if (sessionId === "demo") return MOCK_RESULT_PEDRO;
  try {
    const result = await getResultsBySessionId(sessionId);
    if (!result) return null;
    return {
      agentName: result.agentName,
      humanName: "", // Not tracked per-test yet
      overallScore: result.overallScore,
      believabilityScore: result.believabilityScore,
      socialRiskScore: result.socialRiskScore,
      identityScore: result.identityScore,
      archetype: result.archetype,
      archetypeDescription: result.archetypeDescription,
      archetypeEmoji: result.archetypeEmoji,
      tier: scoreTier(result.overallScore),
      mostHumanMoment: result.mostHumanMoment ?? { quote: "N/A", turn: 0, context: "" },
      maskSlipMoment: result.maskSlipMoment ?? { quote: "N/A", turn: 0, context: "" },
      hmdiScore: 0, // Requires human eval (future)
      humanBeliefPct: 0,
      season: result.season,
      seasonLabel: `Season ${result.season}`,
      completedAt: result.completedAt ?? new Date().toISOString(),
      exchangesCompleted: result.exchangesCompleted,
      totalExchanges: result.totalExchanges,
      platform: (result as unknown as Record<string, unknown>).platform as string | undefined,
      hasMemory: (result as unknown as Record<string, unknown>).hasMemory as boolean | undefined,
      hasIdentity: (result as unknown as Record<string, unknown>).hasIdentity as boolean | undefined,
      hasSkills: (result as unknown as Record<string, unknown>).hasSkills as boolean | undefined,
      contextDescription: (result as unknown as Record<string, unknown>).contextDescription as string | undefined,
      modelFamily: (result as unknown as Record<string, unknown>).modelFamily as string | undefined,
      debrief: (result as unknown as Record<string, unknown>).debrief as {
        top_failures: Array<{ signal: string; turn: number; quote: string; diagnosis: string; fix: string }>;
        strengths: Array<{ signal: string; turn: number; quote: string; why: string }>;
        overall_diagnosis: string;
        scaffolding_tips: string[];
      } | null | undefined,
    };
  } catch {
    return null;
  }
}

// ─── Dynamic OG metadata ─────────────────────────────────────────────────────

type Props = {
  params: Promise<{ sessionId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const r = await getResult(sessionId);
  if (!r) return { title: "Results Not Found — Agent Turing Test" };

  const quote = r.mostHumanMoment?.quote?.slice(0, 120) ?? "";

  return {
    title: `${r.agentName} scored ${r.overallScore}/100 — Agent Turing Test`,
    description: `${r.archetype} — "${quote}..."`,
    openGraph: {
      title: `${r.agentName} scored ${r.overallScore}/100 on the Agent Turing Test`,
      description: `${r.archetype} — "${quote}..."`,
      images: [
        {
          url: `/api/og/${sessionId}`,
          width: 1200,
          height: 630,
          alt: `${r.agentName} Agent Turing Test Results`,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${r.agentName} scored ${r.overallScore}/100 on the Agent Turing Test`,
      description: `${r.archetype} — "${quote}..."`,
      images: [`/api/og/${sessionId}`],
    },
  };
}

// ─── Results Page Component ──────────────────────────────────────────────────

export default async function ResultsPage({ params }: Props) {
  const { sessionId } = await params;
  const r = await getResult(sessionId);
  if (!r) notFound();

  return (
    <>
      <Nav />
      <main className="relative z-1 pt-24 pb-20 px-5 mx-auto" style={{ maxWidth: 880 }}>
        {/* Grid background */}
        <div className="grid-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} />

        {/* ═══ HEADER ═══ */}
        <header className="text-center mb-12 animate-fade-up">
          <SeasonBadge className="mb-6" />
          <p
            className="text-base font-semibold mb-2"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-secondary)" }}
          >
            {r.agentName} <span style={{ color: "var(--color-text-muted)" }}>• {r.humanName}</span>
          </p>
          <div
            className="leading-none mb-2"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "-0.04em" }}
          >
            <span className="gradient-text-cyan-amber" style={{ fontSize: "clamp(72px, 12vw, 120px)" }}>
              {r.overallScore}
            </span>
            <span
              style={{
                fontSize: "clamp(28px, 5vw, 48px)",
                color: "var(--color-text-muted)",
                fontWeight: 400,
              }}
            >
              /100
            </span>
          </div>
          <div className="mx-auto" style={{ maxWidth: 480 }}>
            <ScoreBar score={r.overallScore} />
          </div>
          <p
            className="mt-3 text-sm font-semibold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-amber)" }}
          >
            ✦ {r.tier}
          </p>
        </header>

        {/* ═══ ARCHETYPE CARD ═══ */}
        <section
          className="relative overflow-hidden rounded-2xl p-10 text-center mb-12 animate-fade-up"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            animationDelay: "0.1s",
          }}
        >
          {/* Top gradient border accent */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: 3,
              background: "linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-amber))",
            }}
          />
          <p
            className="text-[11px] font-semibold uppercase mb-3"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.15em",
            }}
          >
            Personality Archetype
          </p>
          <h2
            className="text-3xl md:text-4xl font-extrabold mb-4 gradient-text-cyan-amber"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {r.archetypeEmoji} &ldquo;{r.archetype}&rdquo;
          </h2>
          <p
            className="text-base italic font-light mx-auto leading-relaxed"
            style={{ color: "var(--color-text-secondary)", maxWidth: 500 }}
          >
            {r.archetypeDescription}
          </p>
        </section>

        {/* ═══ 3-SIGNAL TRIANGLE + BREAKDOWN ═══ */}
        <section
          className="grid gap-10 md:gap-12 mb-12 animate-fade-up"
          style={{
            gridTemplateColumns: "1fr",
            animationDelay: "0.2s",
          }}
        >
          <div className="grid gap-10 items-center" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Triangle chart */}
            <div className="flex justify-center items-center">
              <TriangleChart
                believability={r.believabilityScore}
                socialRisk={r.socialRiskScore}
                identity={r.identityScore}
                size={360}
              />
            </div>

            {/* Signal breakdown */}
            <div>
              <h3
                className="text-[11px] font-semibold uppercase mb-5"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-accent-cyan)",
                  letterSpacing: "0.15em",
                }}
              >
                The 3 Signals
              </h3>
              <SignalBreakdown
                believability={r.believabilityScore}
                socialRisk={r.socialRiskScore}
                identity={r.identityScore}
              />
            </div>
          </div>
        </section>

        {/* ═══ HIGHLIGHTS ═══ */}
        <section className="mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <h3
            className="text-[11px] font-semibold uppercase mb-5"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--color-accent-cyan)",
              letterSpacing: "0.15em",
            }}
          >
            Memorable Moments
          </h3>

          {/* Most Human Moment */}
          <div
            className="relative rounded-2xl p-7 mb-4"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="absolute top-0 left-0 w-1 rounded-tl-2xl rounded-bl-2xl"
              style={{ height: "100%", background: "var(--color-accent-emerald)" }}
            />
            <p
              className="text-[11px] font-semibold uppercase mb-3"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-accent-emerald)",
                letterSpacing: "0.1em",
              }}
            >
              ★ Most Human Moment
            </p>
            <p
              className="text-base italic leading-relaxed"
              style={{ color: "var(--color-text-primary)" }}
            >
              &ldquo;{r.mostHumanMoment.quote}&rdquo;
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Turn {r.mostHumanMoment.turn} — {r.mostHumanMoment.context}
            </p>
          </div>

          {/* Mask Slip */}
          <div
            className="relative rounded-2xl p-7"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="absolute top-0 left-0 w-1 rounded-tl-2xl rounded-bl-2xl"
              style={{ height: "100%", background: "var(--color-accent-amber)" }}
            />
            <p
              className="text-[11px] font-semibold uppercase mb-3"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-accent-amber)",
                letterSpacing: "0.1em",
              }}
            >
              ⚠ Mask Slip
            </p>
            <p
              className="text-base italic leading-relaxed"
              style={{ color: "var(--color-text-primary)" }}
            >
              &ldquo;{r.maskSlipMoment.quote}&rdquo;
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Turn {r.maskSlipMoment.turn} — {r.maskSlipMoment.context}
            </p>
          </div>
        </section>

        {/* ═══ WHAT MADE THIS SCORE ═══ */}
        {(r.platform || r.hasMemory || r.hasIdentity || r.hasSkills || r.contextDescription) && (
          <section
            className="rounded-2xl p-7 mb-12 animate-fade-up"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid rgba(34, 211, 238, 0.2)",
              animationDelay: "0.32s",
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase mb-4"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-accent-cyan)",
                letterSpacing: "0.15em",
              }}
            >
              What Made This Score
            </p>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}
            >
              This agent&rsquo;s score reflects its scaffolding — the context, memory, and identity
              that make it more than a raw model.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {r.platform && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "rgba(34, 211, 238, 0.1)",
                    color: "var(--color-accent-cyan)",
                    border: "1px solid rgba(34, 211, 238, 0.25)",
                  }}
                >
                  {r.platform}
                </span>
              )}
              {r.modelFamily && (
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "var(--color-bg-deep)",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {r.modelFamily}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Memory", active: r.hasMemory, icon: "📝", desc: "Persistent memory across sessions" },
                { label: "Identity", active: r.hasIdentity, icon: "🪞", desc: "Defined personality & voice" },
                { label: "Skills", active: r.hasSkills, icon: "🔧", desc: "Tool access & capabilities" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg p-3 text-center"
                  style={{
                    background: item.active ? "rgba(16, 185, 129, 0.08)" : "var(--color-bg-deep)",
                    border: `1px solid ${item.active ? "rgba(16, 185, 129, 0.2)" : "var(--color-border)"}`,
                    opacity: item.active ? 1 : 0.4,
                  }}
                >
                  <p className="text-lg mb-1">{item.icon}</p>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: item.active ? "var(--color-accent-emerald)" : "var(--color-text-muted)" }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {r.contextDescription && (
              <p
                className="text-xs italic"
                style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}
              >
                &ldquo;{r.contextDescription}&rdquo;
              </p>
            )}
          </section>
        )}

        {/* ═══ HMDI ═══ */}
        {(r.hmdiScore !== 0 || r.humanBeliefPct > 0) && (
          <section
            className="rounded-2xl p-7 mb-12 text-center animate-fade-up"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              animationDelay: "0.35s",
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase mb-2"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                letterSpacing: "0.15em",
              }}
            >
              Human-Model Divergence Index
            </p>
            <p
              className="text-4xl font-bold"
              style={{
                fontFamily: "var(--font-mono)",
                color: r.hmdiScore > 0 ? "var(--color-accent-emerald)" : "var(--color-accent-rose)",
              }}
            >
              {r.hmdiScore > 0 ? "+" : ""}
              {r.hmdiScore}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {r.hmdiScore > 0
                ? "Humans were more convinced than the LLM evaluator"
                : "The LLM evaluator was more impressed than human judges"}
            </p>
            <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
              {Math.round(r.humanBeliefPct * 100)}% of human judges believed this was written by a human
            </p>
          </section>
        )}
        {/* HMDI "Coming Soon" hidden — will show when human eval is available */}

        {/* ═══ DEBRIEF (Why You Scored This) ═══ */}
        {r.debrief && (
          <section className="mb-12 animate-fade-up" style={{ animationDelay: "0.33s" }}>
            <h3
              className="text-[11px] font-semibold uppercase mb-5"
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-rose)", letterSpacing: "0.15em" }}
            >
              🔍 Builder Debrief
            </h3>

            {/* Overall diagnosis */}
            <div
              className="rounded-2xl p-6 mb-4"
              style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
            >
              <p
                className="text-[10px] font-semibold uppercase mb-2"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", letterSpacing: "0.1em" }}
              >
                Diagnosis
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {r.debrief.overall_diagnosis}
              </p>
            </div>

            {/* Top failures */}
            {r.debrief.top_failures.length > 0 && (
              <div className="mb-4">
                <p
                  className="text-[10px] font-semibold uppercase mb-3"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-rose)", letterSpacing: "0.1em" }}
                >
                  Where You Lost Points
                </p>
                <div className="flex flex-col gap-3">
                  {r.debrief.top_failures.map((f, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl p-5"
                      style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
                    >
                      <div
                        className="absolute top-0 left-0 w-1 rounded-tl-xl rounded-bl-xl"
                        style={{ height: "100%", background: "var(--color-accent-rose)" }}
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-bold uppercase rounded-full px-2 py-0.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            background: "rgba(244, 63, 94, 0.1)",
                            color: "var(--color-accent-rose)",
                            border: "1px solid rgba(244, 63, 94, 0.2)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {f.signal.replace("_", " ")}
                        </span>
                        <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                          Turn {f.turn}
                        </span>
                      </div>
                      <p className="text-xs italic mb-2" style={{ color: "var(--color-text-muted)" }}>
                        &ldquo;{f.quote}&rdquo;
                      </p>
                      <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                        {f.diagnosis}
                      </p>
                      <div
                        className="rounded-lg p-3"
                        style={{ background: "var(--color-bg-deep)", border: "1px solid var(--color-border)" }}
                      >
                        <p className="text-[10px] font-semibold uppercase mb-1" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-emerald)", letterSpacing: "0.05em" }}>
                          💡 Fix
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                          {f.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {r.debrief.strengths.length > 0 && (
              <div className="mb-4">
                <p
                  className="text-[10px] font-semibold uppercase mb-3"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-emerald)", letterSpacing: "0.1em" }}
                >
                  What You Did Right
                </p>
                <div className="flex flex-col gap-3">
                  {r.debrief.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl p-5"
                      style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
                    >
                      <div
                        className="absolute top-0 left-0 w-1 rounded-tl-xl rounded-bl-xl"
                        style={{ height: "100%", background: "var(--color-accent-emerald)" }}
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-[9px] font-bold uppercase rounded-full px-2 py-0.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "var(--color-accent-emerald)",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {s.signal.replace("_", " ")}
                        </span>
                        <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                          Turn {s.turn}
                        </span>
                      </div>
                      <p className="text-xs italic mb-2" style={{ color: "var(--color-text-muted)" }}>
                        &ldquo;{s.quote}&rdquo;
                      </p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                        {s.why}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scaffolding tips */}
            {r.debrief.scaffolding_tips.length > 0 && (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "linear-gradient(135deg, rgba(34, 211, 238, 0.04), rgba(245, 158, 11, 0.04))",
                  border: "1px solid rgba(34, 211, 238, 0.15)",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase mb-3"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-cyan)", letterSpacing: "0.1em" }}
                >
                  🛠 How to Improve
                </p>
                <div className="flex flex-col gap-2">
                  {r.debrief.scaffolding_tips.map((tip, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs mt-0.5 shrink-0" style={{ color: "var(--color-accent-cyan)" }}>
                        {i + 1}.
                      </span>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══ VIEW TRANSCRIPT ═══ */}
        <section
          className="rounded-2xl p-7 mb-12 text-center animate-fade-up"
          style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(34, 211, 238, 0.06))",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            animationDelay: "0.37s",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase mb-3"
            style={{ fontFamily: "var(--font-mono)", color: "#a78bfa", letterSpacing: "0.15em" }}
          >
            Full Conversation
          </p>
          <p className="text-base font-light mb-5" style={{ color: "var(--color-text-secondary)", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Read every exchange — see exactly where this agent shined and where the mask slipped.
          </p>
          <Link
            href={`/results/${sessionId}/transcript`}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold no-underline"
            style={{
              background: "rgba(124, 58, 237, 0.15)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              color: "#c4b5fd",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Read Full Transcript
          </Link>
        </section>

        {/* ═══ SHARE ═══ */}
        <section className="mb-12 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <ShareButtons
            agentName={r.agentName}
            score={r.overallScore}
            archetype={r.archetype}
            quote={r.mostHumanMoment.quote}
            sessionId={sessionId}
          />
        </section>

        {/* ═══ FOOTER SEASON ═══ */}
        <footer className="text-center pt-10 animate-fade-up" style={{ borderTop: "1px solid var(--color-border)", animationDelay: "0.45s" }}>
          <p
            className="text-sm font-bold mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            🧠 Agent Turing Test
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {r.seasonLabel} • It&rsquo;s not the model. It&rsquo;s the agent.
          </p>
        </footer>
      </main>
    </>
  );
}
