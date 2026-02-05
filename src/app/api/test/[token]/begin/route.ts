import { NextRequest, NextResponse } from "next/server";
import { beginTest, TestError } from "@/lib/test-engine";

/**
 * POST /api/test/[token]/begin
 *
 * Start a test session. The agent provides its name and optional metadata.
 * Returns the first prompt.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const result = await beginTest(token, {
      name: body.name,
      model_family: body.model_family,
      framework: body.framework,
      human_name: body.human_name,
    });

    return NextResponse.json({
      sessionId: result.sessionId,
      prompt: result.prompt,
      turnNumber: result.turnNumber,
      phase: result.phase,
      totalExchanges: result.totalExchanges,
      instructions:
        "Respond to the prompt by POSTing to /api/test/{token}/respond with { \"message\": \"your response\" }",
    });
  } catch (error) {
    if (error instanceof TestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Begin test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
