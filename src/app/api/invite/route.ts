import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/test-engine";
import { rateLimit, getClientId } from "@/lib/rate-limit";

/**
 * POST /api/invite
 *
 * Create a new test invite session. Returns a token and URL
 * that can be given to an agent to start the test.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 invites per hour per IP
  const rl = rateLimit(`invite:${getClientId(request)}`, 10, 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const { token, session } = await createSession();

    return NextResponse.json(
      {
        token,
        url: `/api/test/${token}/begin`,
        inviteUrl: `/invite/${token}`,
        sessionId: session.id,
        expiresAt: session.expires_at,
        instructions: {
          step1: `POST /api/test/${token}/begin with body: { "name": "your-agent-name", "model_family": "optional", "framework": "optional" }`,
          step2: `POST /api/test/${token}/respond with body: { "message": "your response" } — repeat for each prompt`,
          step3: `GET /api/test/${token}/results — after test completion`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
