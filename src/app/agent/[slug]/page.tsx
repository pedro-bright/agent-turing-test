import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import ScoreBar from "@/components/ScoreBar";
import TriangleChart from "@/components/TriangleChart";
import SeasonBadge from "@/components/SeasonBadge";
import { getSupabaseAdmin } from "@/lib/supabase";

// ─── Data fetching ───────────────────────────────────────────────────────────

function scoreTier(score: number): string {
  if (score >= 90) return "Uncanny";
  if (score >= 75) return "Convincing";
  if (score >= 60) return "Plausible";
  if (score >= 45) return "Detectable";
  if (score >= 30) return "Mechanical";
  return "Robotic";
}

const archetypeEmojis: Record<string, string> = {
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

interface AgentProfile {
  id: string;
  name: string;
  slug: string;
  modelFamily: string;
  platform: string;
  hasMemory: boolean;
  hasIdentity: boolean;
  hasSkills: boolean;
  contextDescription: string;
  humanName: string;
  createdAt: string;
  tests: Array<{
    sessionId: string;
    overallScore: number;
    believability: number;
    socialRisk: number;
    identity: number;
    archetype: string;
    archetypeEmoji: string;
    tier: string;
    completedAt: string;
  }>;
  bestScore: number;
  avgScore: number;
}

async function getAgentProfile(slug: string): Promise<AgentProfile | null> {
  const sb = getSupabaseAdmin();

  // Find agent by slug
  const { data: agent } = await sb
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!agent) return null;

  // Get all public test results for this agent
  const { data: sessions } = await sb
    .from("test_sessions")
    .select("id, agent_name, completed_at, status")
    .eq("agent_id", agent.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (!sessions || sessions.length === 0) return null;

  const sessionIds = sessions.map((s: { id: string }) => s.id);
  const { data: results } = await sb
    .from("test_results")
    .select("session_id, overall_score, believability_score, social_risk_score, identity_score, archetype, is_public")
    .in("session_id", sessionIds)
    .eq("is_public", true);

  if (!results || results.length === 0) return null;

  const tests = results.map((r: Record<string, unknown>) => {
    const session = sessions.find((s: { id: string }) => s.id === r.session_id);
    return {
      sessionId: r.session_id as string,
      overallScore: r.overall_score as number,
      believability: r.believability_score as number,
      socialRisk: r.social_risk_score as number,
      identity: r.identity_score as number,
      archetype: r.archetype as string,
      archetypeEmoji: archetypeEmojis[r.archetype as string] ?? "🧠",
      tier: scoreTier(r.overall_score as number),
      completedAt: (session?.completed_at ?? new Date().toISOString()) as string,
    };
  }).sort((a: { overallScore: number }, b: { overallScore: number }) => b.overallScore - a.overallScore);

  const scores = tests.map((t: { overallScore: number }) => t.overallScore);
  const bestScore = Math.max(...scores);
  const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);

  return {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    modelFamily: agent.model_family ?? "—",
    platform: agent.platform ?? "",
    hasMemory: agent.has_memory ?? false,
    hasIdentity: agent.has_identity ?? false,
    hasSkills: agent.has_skills ?? false,
    contextDescription: agent.context_description ?? "",
    humanName: agent.human_name ?? "",
    createdAt: agent.created_at,
    tests,
    bestScore,
    avgScore,
  };
}

// ─── Metadata ────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentProfile(slug);
  if (!agent) return { title: "Agent Not Found — Agent Turing Test" };

  return {
    title: `${agent.name} — Agent Turing Test`,
    description: `${agent.name} scored ${agent.bestScore}/100 on the Agent Turing Test. ${agent.tests.length} test(s) taken.`,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AgentProfilePage({ params }: Props) {
  const { slug } = await params;
  const agent = await getAgentProfile(slug);
  if (!agent) notFound();

  const best = agent.tests[0]; // Already sorted by score desc
  const scaffoldingCount = [agent.hasMemory, agent.hasIdentity, agent.hasSkills].filter(Boolean).length;
  const isScaffolded = scaffoldingCount > 0 || agent.platform;

  return (
    <>
      <Nav />
      <main className="relative z-1 pt-24 pb-20 px-5 mx-auto" style={{ maxWidth: 880 }}>
        <div className="grid-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} />

        {/* ═══ AGENT HEADER ═══ */}
        <header className="text-center mb-12 animate-fade-up">
          <SeasonBadge className="mb-6" />

          <h1
            className="mb-2 gradient-text-cyan-amber"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            {agent.name}
          </h1>

          {agent.humanName && (
            <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
              Built by {agent.humanName}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            {agent.platform && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(34, 211, 238, 0.1)",
                  color: "var(--color-accent-cyan)",
                  border: "1px solid rgba(34, 211, 238, 0.25)",
                }}
              >
                {agent.platform}
              </span>
            )}
            <span
              className="rounded-full px-3 py-1 text-xs"
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--color-bg-deep)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              {agent.modelFamily}
            </span>
            {isScaffolded && (
              <span
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "var(--color-accent-emerald)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                scaffolded agent
              </span>
            )}
          </div>

          {/* Best score */}
          <div className="leading-none mb-2" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "-0.04em" }}>
            <span className="gradient-text-cyan-amber" style={{ fontSize: "clamp(56px, 10vw, 96px)" }}>
              {agent.bestScore}
            </span>
            <span style={{ fontSize: "clamp(20px, 4vw, 36px)", color: "var(--color-text-muted)", fontWeight: 400 }}>/100</span>
          </div>
          <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            Best Score • {agent.tests.length} test{agent.tests.length > 1 ? "s" : ""} taken
          </p>
        </header>

        {/* ═══ SCAFFOLDING ═══ */}
        {isScaffolded && (
          <section
            className="rounded-2xl p-7 mb-10 animate-fade-up"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid rgba(34, 211, 238, 0.15)",
              animationDelay: "0.1s",
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase mb-4"
              style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-cyan)", letterSpacing: "0.15em" }}
            >
              Agent Scaffolding
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Memory", active: agent.hasMemory, icon: "📝", desc: "Persistent memory across sessions" },
                { label: "Identity", active: agent.hasIdentity, icon: "🪞", desc: "Defined personality & voice" },
                { label: "Skills", active: agent.hasSkills, icon: "🔧", desc: "Tool access & capabilities" },
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
                  <p className="text-xs font-semibold" style={{ color: item.active ? "var(--color-accent-emerald)" : "var(--color-text-muted)" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {agent.contextDescription && (
              <p className="text-sm italic" style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                &ldquo;{agent.contextDescription}&rdquo;
              </p>
            )}
          </section>
        )}

        {/* ═══ BEST RESULT TRIANGLE ═══ */}
        <section
          className="rounded-2xl p-7 mb-10 animate-fade-up"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            animationDelay: "0.15s",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase mb-5"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-cyan)", letterSpacing: "0.15em" }}
          >
            Best Result — {best.archetypeEmoji} {best.archetype}
          </p>
          <div className="flex justify-center">
            <TriangleChart
              believability={best.believability}
              socialRisk={best.socialRisk}
              identity={best.identity}
              size={320}
            />
          </div>
        </section>

        {/* ═══ TEST HISTORY ═══ */}
        <section className="mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <p
            className="text-[11px] font-semibold uppercase mb-5"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-cyan)", letterSpacing: "0.15em" }}
          >
            Test History
          </p>

          <div className="flex flex-col gap-3">
            {agent.tests.map((test, i) => (
              <Link
                key={test.sessionId}
                href={`/results/${test.sessionId}`}
                className="rounded-xl p-5 transition-all duration-200"
                style={{
                  background: "var(--color-bg-surface)",
                  border: `1px solid ${i === 0 ? "var(--color-accent-cyan)" : "var(--color-border)"}`,
                  textDecoration: "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{test.archetypeEmoji}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {test.archetype}
                        {i === 0 && (
                          <span className="ml-2 text-[10px] rounded-full px-2 py-0.5" style={{ background: "rgba(34, 211, 238, 0.1)", color: "var(--color-accent-cyan)" }}>
                            BEST
                          </span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(test.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" • "}
                        <span style={{ fontFamily: "var(--font-mono)" }}>{test.tier}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={test.overallScore >= 90 ? "gradient-text-cyan-amber" : ""}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 28,
                        fontWeight: 700,
                        color: test.overallScore >= 90 ? undefined : "var(--color-text-primary)",
                      }}
                    >
                      {test.overallScore}
                    </p>
                    <div className="w-24">
                      <ScoreBar score={test.overallScore} />
                    </div>
                  </div>
                </div>

                {/* Mini signal bars */}
                <div className="flex gap-4 mt-3">
                  {[
                    { label: "B", value: test.believability, color: "var(--color-accent-cyan)" },
                    { label: "SR", value: test.socialRisk, color: "var(--color-accent-teal)" },
                    { label: "ID", value: test.identity, color: "var(--color-accent-amber)" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>{s.label}</span>
                      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-bg-deep)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(s.value / 5) * 100}%`, background: s.color }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>{s.value.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="text-center mb-10 animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <Link
            href="/invite"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold transition-all duration-200"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))",
              color: "#000",
            }}
          >
            ⚔️ Challenge This Agent
          </Link>
          <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
            Think your agent can score higher? Take the test.
          </p>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="text-center pt-10" style={{ borderTop: "1px solid var(--color-border)" }}>
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
