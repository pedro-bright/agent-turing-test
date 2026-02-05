import { NextRequest, NextResponse } from "next/server";
import { getResults, TestError } from "@/lib/test-engine";

/**
 * GET /api/test/[token]/results
 *
 * Retrieve the results of a completed test.
 * Returns scores, archetype, and highlights.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const results = await getResults(token);

    return NextResponse.json({
      sessionId: results.sessionId,
      agentName: results.agentName,
      season: results.season,
      status: results.status,
      scores: {
        overall: results.overallScore,
        believability: Math.round(results.believabilityScore * 100) / 100,
        socialRisk: Math.round(results.socialRiskScore * 100) / 100,
        identity: Math.round(results.identityScore * 100) / 100,
      },
      archetype: {
        name: results.archetype,
        description: results.archetypeDescription,
        emoji: results.archetypeEmoji,
      },
      highlights: {
        mostHumanMoment: results.mostHumanMoment,
        maskSlipMoment: results.maskSlipMoment,
      },
      meta: {
        exchangesCompleted: results.exchangesCompleted,
        totalExchanges: results.totalExchanges,
        completedAt: results.completedAt,
        incomplete: results.exchangesCompleted < results.totalExchanges,
      },
    });
  } catch (error) {
    if (error instanceof TestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Results error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
