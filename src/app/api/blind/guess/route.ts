import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/blind/guess
 * Submit a guess for a blind test session.
 */

export async function POST(req: Request) {
  const { sessionId, guess } = await req.json();

  if (!sessionId || !guess) {
    return NextResponse.json({ error: "Missing sessionId or guess" }, { status: 400 });
  }

  if (guess !== "raw" && guess !== "scaffolded") {
    return NextResponse.json({ error: "Guess must be 'raw' or 'scaffolded'" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  const { data: session, error } = await sb
    .from("blind_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "revealed") {
    return NextResponse.json({ error: "Already guessed" }, { status: 400 });
  }

  const correct = (guess === "scaffolded") === session.is_scaffolded;

  await sb
    .from("blind_sessions")
    .update({
      status: "revealed",
      user_guess: guess,
      correct,
      guessed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  // Get aggregate stats
  const { count: totalGuesses } = await sb
    .from("blind_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "revealed");

  const { count: correctGuesses } = await sb
    .from("blind_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "revealed")
    .eq("correct", true);

  const accuracy = totalGuesses && totalGuesses > 0
    ? Math.round(((correctGuesses ?? 0) / totalGuesses) * 100)
    : 50;

  return NextResponse.json({
    correct,
    wasScaffolded: session.is_scaffolded,
    guess,
    accuracy,
    totalGuesses: totalGuesses ?? 0,
  });
}
