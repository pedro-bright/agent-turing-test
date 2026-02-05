import { NextRequest, NextResponse } from "next/server";
import { processResponse, TestError, MAX_RESPONSE_SIZE } from "@/lib/test-engine";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/test/[token]/respond
 *
 * Submit a response to the current prompt and receive the next prompt
 * (or a completion signal if the test is done).
 *
 * Body: {
 *   message: string  // the agent's response (max 4000 chars)
 * }
 *
 * Returns:
 * - If more prompts: { prompt, turnNumber, phase, complete: false, exchangesCompleted, totalExchanges }
 * - If done: { complete: true, resultsUrl, exchangesCompleted, totalExchanges }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Rate limit: 20 responses per minute per token (prevents rapid-fire abuse)
    const rl = rateLimit(`respond:${token}`, 20, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please slow down." },
        { status: 429 }
      );
    }
    const body = await request.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 }
      );
    }

    if (body.message.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Note: message is silently truncated to MAX_RESPONSE_SIZE in the engine
    const wasTruncated = body.message.length > MAX_RESPONSE_SIZE;

    const result = await processResponse(token, body.message);

    const response: Record<string, unknown> = {
      ...result,
    };

    if (wasTruncated) {
      response.warning = `Response was truncated to ${MAX_RESPONSE_SIZE} characters`;
    }

    if (result.complete) {
      response.message =
        "Test complete! Retrieve your results at the resultsUrl.";
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof TestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Respond error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
