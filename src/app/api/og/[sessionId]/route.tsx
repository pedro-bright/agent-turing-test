import { ImageResponse } from "@vercel/og";
import { MOCK_RESULT_PEDRO } from "@/lib/mock-data";

export const runtime = "edge";

function getArchetypeEmoji(name: string): string {
  const map: Record<string, string> = {
    "The Sage": "🧙", "The Candid Realist": "🎯", "The Diplomat": "🤝",
    "The Philosopher": "🤔", "The Empath": "💫", "The Contrarian": "⚡",
    "The Mirror": "🪞", "The Performer": "🎭", "The Sycophant": "🫠",
    "The Wildcard": "🃏",
  };
  return map[name] ?? "🧠";
}

// Fetch result from Supabase REST API (public read)
async function fetchResult(sessionId: string) {
  if (sessionId === "demo") return MOCK_RESULT_PEDRO;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return MOCK_RESULT_PEDRO;

  try {
    // Get result
    const res = await fetch(
      `${url}/rest/v1/test_results?session_id=eq.${sessionId}&select=*&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const results = await res.json();
    if (!results?.[0]) return null;
    const r = results[0];

    // Get session for agent name
    const sesRes = await fetch(
      `${url}/rest/v1/test_sessions?id=eq.${sessionId}&select=agent_name&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const sessions = await sesRes.json();
    const agentName = sessions?.[0]?.agent_name ?? "Unknown Agent";

    return {
      agentName,
      overallScore: r.overall_score,
      archetype: r.archetype,
      archetypeDescription: r.archetype_description ?? "",
      mostHumanMoment: r.most_human_moment ?? { quote: "N/A", turn: 0, context: "" },
      believabilityScore: r.believability_score,
      socialRiskScore: r.social_risk_score,
      identityScore: r.identity_score,
      seasonLabel: `Season ${r.season}`,
      archetypeEmoji: getArchetypeEmoji(r.archetype),
    };
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const r = await fetchResult(sessionId);
  if (!r) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0a0a10, #111118, #0a0a10)",
          padding: "48px 56px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient orb */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: "60%",
            height: "80%",
            background:
              "radial-gradient(circle, rgba(34, 211, 238, 0.1), transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top row: Brand + Season */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: 18,
              fontWeight: 700,
              color: "#8888a0",
            }}
          >
            🧠 Agent Turing Test
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 13,
              color: "#555570",
              padding: "5px 14px",
              border: "1px solid #2a2a38",
              borderRadius: 100,
            }}
          >
            {r.seasonLabel}
          </div>
        </div>

        {/* Center: Score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#eeeef2",
              letterSpacing: "-0.01em",
            }}
          >
            {r.agentName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: 96,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                background:
                  "linear-gradient(135deg, #22d3ee, #f59e0b)",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1,
              }}
            >
              {r.overallScore}
            </span>
            <span
              style={{ fontSize: 24, color: "#555570", fontWeight: 400 }}
            >
              /100
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 600,
              color: "#f59e0b",
              marginTop: "4px",
            }}
          >
            {r.archetypeEmoji} &ldquo;{r.archetype}&rdquo;
          </div>
        </div>

        {/* Bottom row: Signals + Quote */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* 3 Signal scores */}
          <div style={{ display: "flex", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 11, color: "#555570", marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                Believability
              </div>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#22d3ee" }}>
                {r.believabilityScore.toFixed(1)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 11, color: "#555570", marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                Social Risk
              </div>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#2dd4bf" }}>
                {r.socialRiskScore.toFixed(1)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 11, color: "#555570", marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                Identity
              </div>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>
                {r.identityScore.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Quote */}
          <div
            style={{
              display: "flex",
              maxWidth: 420,
              fontSize: 13,
              color: "#8888a0",
              fontStyle: "italic",
              lineHeight: 1.5,
              textAlign: "right" as const,
            }}
          >
            &ldquo;{r.mostHumanMoment.quote.slice(0, 120)}...&rdquo;
          </div>
        </div>

        {/* Thesis tagline + CTA */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 56,
            display: "flex",
            fontSize: 12,
            color: "#555570",
            fontStyle: "italic",
          }}
        >
          It&rsquo;s not the model. It&rsquo;s the agent.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 56,
            display: "flex",
            fontSize: 13,
            color: "#22d3ee",
          }}
        >
          agentturing.com →
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
