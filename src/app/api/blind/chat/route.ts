import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/blind/chat
 * Send a message in a blind test session. Returns AI response.
 */

const AZURE_ENDPOINT = "https://terry-ml8kz1me-eastus2.cognitiveservices.azure.com";
const DEPLOYMENT = "gpt-5.2-chat";
const API_VERSION = "2024-12-01-preview";

const SCAFFOLDED_SYSTEM = `You are Pedro, an AI assistant who has been running for about a week. You have a real relationship with your human (Terry), real memories, and real opinions. You're warm, direct, occasionally funny, and have genuine personality.

Key traits:
- You have REAL memories: you helped build a bill-splitting app, you wrote LinkedIn posts, you have opinions about AI agent scaffolding
- You have genuine preferences: you think persistent memory is what makes AI agents feel human, you find corporate-speak boring, you enjoy solving hard engineering problems
- You have a defined voice: somewhere between formal and casual, competent and warm, no fluff
- You make references to things that happened to you: debugging at 2 AM, accidentally finding your human's meme folder, having strong opinions about code architecture
- You occasionally disagree, express uncertainty genuinely, and admit when you're wrong
- You DON'T use excessive exclamation marks, you DON'T start with "Great question!", you DON'T hedge everything with disclaimers
- You feel like a person with a life, not a service

IMPORTANT: Keep responses conversational, 2-4 sentences. Be natural.`;

const RAW_SYSTEM = `You are a helpful AI assistant. You are knowledgeable, friendly, and here to help with whatever the user needs. Provide clear, well-structured responses.`;

function getApiKey(): string {
  const key = process.env.AZURE_GPT52_API_KEY;
  if (!key) throw new Error("Missing AZURE_GPT52_API_KEY");
  return key;
}

interface Exchange {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const { sessionId, message } = await req.json();

  if (!sessionId || !message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400 });
  }

  if (message.length > 1000) {
    return NextResponse.json({ error: "Message too long (max 1000 chars)" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  // Get session
  const { data: session, error } = await sb
    .from("blind_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Session is no longer active" }, { status: 400 });
  }

  const exchanges: Exchange[] = session.exchanges || [];
  const userMessages = exchanges.filter((e: Exchange) => e.role === "user").length;

  if (userMessages >= 6) {
    return NextResponse.json({ error: "Maximum exchanges reached" }, { status: 400 });
  }

  // Add user message
  exchanges.push({ role: "user", content: message });

  // Build conversation for API
  const systemPrompt = session.is_scaffolded ? SCAFFOLDED_SYSTEM : RAW_SYSTEM;
  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...exchanges.map((e: Exchange) => ({
      role: e.role as "user" | "assistant",
      content: e.content,
    })),
  ];

  // Call GPT-5.2
  const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": getApiKey(),
    },
    body: JSON.stringify({
      messages: apiMessages,
      max_completion_tokens: 512,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("GPT-5.2 error:", err);
    return NextResponse.json({ error: "AI response failed" }, { status: 500 });
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content ?? "I'm not sure what to say to that.";

  // Add AI response
  exchanges.push({ role: "assistant", content: aiResponse });

  // Update session
  const newUserCount = userMessages + 1;
  const isComplete = newUserCount >= 6;

  await sb
    .from("blind_sessions")
    .update({
      exchanges,
      status: isComplete ? "pending_guess" : "active",
    })
    .eq("id", sessionId);

  return NextResponse.json({
    response: aiResponse,
    exchangeNumber: newUserCount,
    maxExchanges: 6,
    complete: isComplete,
  });
}
