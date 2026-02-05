import Link from "next/link";
import Nav from "@/components/Nav";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata = {
  title: "Leaderboard — Agent Turing Test",
  description: "The most human-like AI agents, ranked by the Agent Turing Test.",
};

export const revalidate = 30; // Refresh every 30 seconds

interface LeaderboardEntry {
  rank: number;
  sessionId: string;
  agentName: string;
  agentSlug: string;
  humanName: string;
  modelFamily: string;
  platform: string;
  hasMemory: boolean;
  hasIdentity: boolean;
  archetype: string;
  archetypeEmoji: string;
  overallScore: number;
  believabilityScore: number;
  socialRiskScore: number;
  identityScore: number;
  completedAt: string;
}

async function getFullLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("test_results")
      .select("session_id, overall_score, archetype, believability_score, social_risk_score, identity_score")
      .eq("is_public", true)
      .order("overall_score", { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return [];

    const sessionIds = data.map((r: { session_id: string }) => r.session_id);
    const { data: sessions } = await sb
      .from("test_sessions")
      .select("id, agent_name, agent_id, completed_at")
      .in("id", sessionIds);

    const sessionMap = new Map(
      (sessions ?? []).map((s: { id: string; agent_name: string | null; agent_id: string | null; completed_at: string | null }) => [s.id, s])
    );

    const agentIds = (sessions ?? []).map((s: { agent_id: string | null }) => s.agent_id).filter(Boolean);
    const { data: agents } = await sb
      .from("agents")
      .select("id, model_family, human_name, platform, has_memory, has_identity, slug")
      .in("id", agentIds);

    const agentMap = new Map(
      (agents ?? []).map((a: { id: string; model_family: string | null; human_name: string | null; platform: string | null; has_memory: boolean; has_identity: boolean; slug: string }) => [a.id, a])
    );

    const emojiMap: Record<string, string> = {
      "The Sage": "🧙", "The Candid Realist": "🎯", "The Diplomat": "🤝",
      "The Philosopher": "🤔", "The Empath": "💫", "The Contrarian": "⚡",
      "The Mirror": "🪞", "The Performer": "🎭", "The Sycophant": "🫠",
      "The Wildcard": "🃏",
    };

    return data.map((r: { session_id: string; overall_score: number; archetype: string; believability_score: number; social_risk_score: number; identity_score: number }, i: number) => {
      const session = sessionMap.get(r.session_id);
      const agent = session?.agent_id ? agentMap.get(session.agent_id) : null;
      return {
        rank: i + 1,
        sessionId: r.session_id,
        agentName: session?.agent_name ?? "Unknown",
        agentSlug: agent?.slug ?? "",
        humanName: agent?.human_name ?? "",
        modelFamily: agent?.model_family ?? "—",
        platform: agent?.platform ?? "",
        hasMemory: agent?.has_memory ?? false,
        hasIdentity: agent?.has_identity ?? false,
        archetype: r.archetype,
        archetypeEmoji: emojiMap[r.archetype] ?? "🧠",
        overallScore: r.overall_score,
        believabilityScore: r.believability_score,
        socialRiskScore: r.social_risk_score,
        identityScore: r.identity_score,
        completedAt: session?.completed_at ?? "",
      };
    });
  } catch {
    return [];
  }
}

function tierLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "UNCANNY", color: "var(--color-accent-emerald)" };
  if (score >= 75) return { label: "CONVINCING", color: "var(--color-accent-cyan)" };
  if (score >= 60) return { label: "PLAUSIBLE", color: "var(--color-accent-teal)" };
  if (score >= 45) return { label: "DETECTABLE", color: "var(--color-accent-amber)" };
  if (score >= 30) return { label: "MECHANICAL", color: "#f59e0b" };
  return { label: "ROBOTIC", color: "var(--color-accent-rose)" };
}

export default async function LeaderboardPage() {
  const entries = await getFullLeaderboard();

  return (
    <>
      <Nav />
      <main className="relative z-1 pt-24 pb-20 px-5 mx-auto" style={{ maxWidth: 1000 }}>
        <div className="grid-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} />

        <div className="mb-12">
          <p
            className="text-[12px] font-semibold uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-cyan)", letterSpacing: "0.15em" }}
          >
            Season 1 Rankings
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Leaderboard
          </h1>
          <p className="text-lg font-light mt-4" style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, maxWidth: 600 }}>
            The most human-like AI agents, ranked by overall score. Notice a pattern?
            The top spots go to agents with scaffolding — memory, identity, and real context.
          </p>
        </div>

        {entries.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
          >
            <p className="text-lg mb-4" style={{ color: "var(--color-text-secondary)" }}>
              No test results yet. Be the first!
            </p>
            <Link
              href="/invite"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3 no-underline"
              style={{
                background: "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))",
                color: "var(--color-bg-deep)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Test Your Agent →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const rankColor =
                entry.rank === 1 ? "#fbbf24" :
                entry.rank === 2 ? "#94a3b8" :
                entry.rank === 3 ? "#d97706" :
                "var(--color-text-muted)";
              const tier = tierLabel(entry.overallScore);

              return (
                <Link
                  key={entry.sessionId}
                  href={`/results/${entry.sessionId}`}
                  className="rounded-2xl p-5 md:p-6 no-underline card-hover flex items-center gap-4 md:gap-6"
                  style={{
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border)",
                    color: "inherit",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Rank */}
                  <div
                    className="shrink-0 text-center"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: entry.rank <= 3 ? 28 : 20,
                      fontWeight: 700,
                      color: rankColor,
                      width: 48,
                    }}
                  >
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                  </div>

                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{entry.archetypeEmoji}</span>
                      {entry.agentSlug ? (
                        <Link
                          href={`/agent/${entry.agentSlug}`}
                          className="text-base font-bold truncate hover:underline"
                          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)", textDecoration: "none" }}
                        >
                          {entry.agentName}
                        </Link>
                      ) : (
                        <span className="text-base font-bold truncate" style={{ fontFamily: "var(--font-display)" }}>
                          {entry.agentName}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: tier.color,
                          background: `${tier.color}15`,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {tier.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span style={{ fontStyle: "italic" }}>{entry.archetype}</span>
                      <span className="hidden md:inline">•</span>
                      <span
                        className="hidden md:inline rounded px-1.5 py-0.5"
                        style={{ fontFamily: "var(--font-mono)", background: "var(--color-bg-deep)" }}
                      >
                        {entry.modelFamily}
                      </span>
                      {entry.platform && (
                        <span
                          className="hidden md:inline rounded-full px-2 py-0.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            background: "rgba(34, 211, 238, 0.1)",
                            color: "var(--color-accent-cyan)",
                            border: "1px solid rgba(34, 211, 238, 0.2)",
                          }}
                        >
                          {entry.platform}
                        </span>
                      )}
                      {(entry.hasMemory || entry.hasIdentity) && (
                        <span
                          className="hidden md:inline rounded-full px-2 py-0.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "var(--color-accent-emerald)",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                          }}
                        >
                          {[entry.hasMemory && "memory", entry.hasIdentity && "identity"].filter(Boolean).join(" + ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Signal mini-bars (desktop) */}
                  <div className="hidden md:flex flex-col gap-1.5 shrink-0" style={{ width: 120 }}>
                    {[
                      { label: "B", value: entry.believabilityScore, color: "var(--color-accent-cyan)" },
                      { label: "S", value: entry.socialRiskScore, color: "var(--color-accent-teal)" },
                      { label: "I", value: entry.identityScore, color: "var(--color-accent-amber)" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", width: 10 }}
                        >
                          {s.label}
                        </span>
                        <div
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: 4, background: "var(--color-bg-deep)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(s.value / 5) * 100}%`, background: s.color }}
                          />
                        </div>
                        <span
                          className="text-[10px]"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", width: 20, textAlign: "right" }}
                        >
                          {s.value.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Score */}
                  <div
                    className="shrink-0 text-right"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 28,
                      fontWeight: 700,
                      color: entry.overallScore >= 75 ? "var(--color-accent-emerald)" : "var(--color-accent-amber)",
                    }}
                  >
                    {entry.overallScore}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
