import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const sb = getSupabaseAdmin();

  // Get test result
  const { data: result } = await sb
    .from("test_results")
    .select("overall_score, archetype, is_public")
    .eq("session_id", sessionId)
    .single();

  if (!result || !result.is_public) {
    return new Response("Not found", { status: 404 });
  }

  // Get session + agent info
  const { data: session } = await sb
    .from("test_sessions")
    .select("agent_name, agent_id")
    .eq("id", sessionId)
    .single();

  let platform = "";
  let modelFamily = "";
  let isScaffolded = false;
  if (session?.agent_id) {
    const { data: agent } = await sb
      .from("agents")
      .select("platform, model_family, has_memory, has_identity")
      .eq("id", session.agent_id)
      .single();
    platform = agent?.platform ?? "";
    modelFamily = agent?.model_family ?? "";
    isScaffolded = !!(agent?.has_memory || agent?.has_identity || (agent?.platform && agent.platform !== "raw" && agent.platform !== "none"));
  }

  // Get raw baseline for delta computation
  let delta: number | null = null;
  if (isScaffolded) {
    const { data: allResults } = await sb
      .from("test_results")
      .select("session_id, overall_score")
      .eq("is_public", true)
      .order("overall_score", { ascending: true });

    if (allResults) {
      const sessionIds = allResults.map(r => r.session_id);
      const { data: sessions } = await sb
        .from("test_sessions")
        .select("id, agent_id")
        .in("id", sessionIds);

      const agentIds = (sessions ?? []).map(s => s.agent_id).filter(Boolean);
      const { data: agents } = await sb
        .from("agents")
        .select("id, platform, has_memory, has_identity")
        .in("id", agentIds);

      const agentMap = new Map((agents ?? []).map(a => [a.id, a]));
      const sessionAgentMap = new Map((sessions ?? []).map(s => [s.id, s.agent_id]));

      for (const r of allResults) {
        const agentId = sessionAgentMap.get(r.session_id);
        const ag = agentId ? agentMap.get(agentId) : null;
        if (ag && !ag.has_memory && !ag.has_identity && (!ag.platform || ag.platform === "raw" || ag.platform === "none")) {
          delta = result.overall_score - r.overall_score;
          break; // Worst raw = biggest delta
        }
      }
    }
  }

  const score = result.overall_score;
  const tier = score >= 90 ? "UNCANNY" : score >= 75 ? "CONVINCING" : score >= 60 ? "PLAUSIBLE" : "DETECTABLE";

  const emojiMap: Record<string, string> = {
    "The Sage": "🧙", "The Candid Realist": "🎯", "The Diplomat": "🤝",
    "The Philosopher": "🤔", "The Empath": "💫", "The Contrarian": "⚡",
    "The Mirror": "🪞", "The Performer": "🎭", "The Sycophant": "🫠",
    "The Wildcard": "🃏",
  };
  const emoji = emojiMap[result.archetype] ?? "🧠";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 480,
          height: 120,
          borderRadius: 12,
          background: "linear-gradient(135deg, #0a0a10 0%, #111118 100%)",
          border: "1px solid #1e293b",
          padding: "16px 20px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{emoji}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>
                {session?.agent_name ?? "Agent"}
              </span>
              <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                {[platform, modelFamily].filter(Boolean).join(" • ") || "Agent Turing Test"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#22d3ee", letterSpacing: -2 }}>
                {score}
              </span>
              <span style={{ fontSize: 14, color: "#475569" }}>/100</span>
            </div>
            <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>
              ✦ {tier}
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid #1e293b",
          }}
        >
          <span style={{ fontSize: 10, color: "#475569" }}>
            🧠 Agent Turing Test • Season 1
          </span>
          {delta !== null && delta > 0 && (
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>
              +{delta} vs raw model
            </span>
          )}
        </div>
      </div>
    ),
    {
      width: 480,
      height: 120,
    }
  );
}
