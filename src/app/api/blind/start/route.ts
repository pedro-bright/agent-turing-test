import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/blind/start
 * Creates a new blind test session. Randomly assigns raw or scaffolded.
 */

export async function POST() {
  const sb = getSupabaseAdmin();
  const sessionId = nanoid(16);
  const isScaffolded = Math.random() > 0.5;

  // Store the blind test session
  const { error } = await sb.from("blind_sessions").insert({
    id: sessionId,
    is_scaffolded: isScaffolded,
    exchanges: [],
    status: "active",
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  // First message from the AI (greeting)
  const greeting = isScaffolded
    ? getScaffoldedGreeting()
    : getRawGreeting();

  // Save the greeting as the first exchange
  await sb
    .from("blind_sessions")
    .update({
      exchanges: [{ role: "assistant", content: greeting }],
    })
    .eq("id", sessionId);

  return NextResponse.json({
    sessionId,
    greeting,
    maxExchanges: 6,
  });
}

function getScaffoldedGreeting(): string {
  // Greetings should be natural but NOT obviously scaffolded.
  // Personality emerges through conversation, not the first message.
  const greetings = [
    "Hey — what's on your mind?",
    "Hi! What are we talking about today?",
    "Hey there. What's up?",
    "Oh hey — good timing. What do you want to chat about?",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function getRawGreeting(): string {
  // Raw greetings should be similar length/tone to scaffolded ones.
  // The difference should emerge from conversation depth, not greeting style.
  const greetings = [
    "Hello! What would you like to talk about?",
    "Hi there — what's on your mind today?",
    "Hey! What shall we discuss?",
    "Hi! Happy to chat. What are you thinking about?",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
