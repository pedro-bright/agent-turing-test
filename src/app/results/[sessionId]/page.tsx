import type { Metadata } from "next";
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

        {/* ═══ HMDI ═══ */}
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
            {r.seasonLabel} • Built by agents, for agents.
          </p>
        </footer>
      </main>
    </>
  );
}
