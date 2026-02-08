"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import ChatBubble from "@/components/ChatBubble";

type Phase = "intro" | "chatting" | "guessing" | "reveal";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RevealData {
  correct: boolean;
  wasScaffolded: boolean;
  guess: string;
  accuracy: number;
  totalGuesses: number;
}

export default function BlindTestPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchangeNum, setExchangeNum] = useState(0);
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (phase === "chatting" && !loading) {
      inputRef.current?.focus();
    }
  }, [phase, loading, messages]);

  async function startChat() {
    setLoading(true);
    try {
      const res = await fetch("/api/blind/start", { method: "POST" });
      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([{ role: "assistant", content: data.greeting }]);
      setPhase("chatting");
      setExchangeNum(0);
    } catch {
      alert("Failed to start. Try again.");
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading || !sessionId) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/blind/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      setExchangeNum(data.exchangeNumber);
      if (data.complete) {
        setPhase("guessing");
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong..." }]);
    }
    setLoading(false);
  }

  async function submitGuess(guess: "raw" | "scaffolded") {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/blind/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, guess }),
      });
      const data = await res.json();
      setReveal(data);
      setPhase("reveal");
    } catch {
      alert("Failed to submit guess.");
    }
    setLoading(false);
  }

  return (
    <>
      <Nav />
      <main
        className="relative z-1 pt-20 pb-10 px-4 mx-auto flex flex-col"
        style={{ maxWidth: 640, minHeight: "100vh" }}
      >
        <div
          className="grid-bg"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
        />

        {/* ═══ INTRO ═══ */}
        {phase === "intro" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-up">
            <div
              className="text-6xl mb-6"
              style={{ filter: "drop-shadow(0 0 20px rgba(34, 211, 238, 0.3))" }}
            >
              🎭
            </div>
            <h1
              className="mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 6vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Can You Tell
              <br />
              <span className="gradient-text-cyan-amber">the Difference?</span>
            </h1>
            <p
              className="text-base font-light mb-8 mx-auto"
              style={{
                color: "var(--color-text-secondary)",
                maxWidth: 420,
                lineHeight: 1.7,
              }}
            >
              You&rsquo;ll chat with an AI for 6 exchanges. One has memory,
              identity, and real context. The other is a raw model. Can you
              tell which one you got?
            </p>

            <button
              onClick={startChat}
              disabled={loading}
              className="inline-flex items-center gap-2.5 rounded-xl px-9 py-4 glow-cyan hover-glow-cyan cursor-pointer"
              style={{
                background: "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))",
                color: "var(--color-bg-deep)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                border: "none",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Starting..." : "Start Blind Test →"}
            </button>

            <p
              className="mt-6 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              No sign-up required. Takes ~2 minutes.
            </p>
          </div>
        )}

        {/* ═══ CHAT ═══ */}
        {(phase === "chatting" || phase === "guessing") && (
          <div className="flex-1 flex flex-col pt-4">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] font-bold uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-accent-cyan)",
                  letterSpacing: "0.1em",
                }}
              >
                Exchange {exchangeNum}/6
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background:
                        n <= exchangeNum
                          ? "var(--color-accent-cyan)"
                          : "var(--color-bg-surface-3)",
                      transition: "background 0.3s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4"
              style={{ maxHeight: "calc(100vh - 240px)" }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="rounded-2xl px-4 py-3 max-w-[85%] animate-fade-up"
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))"
                          : "var(--color-bg-surface)",
                      color:
                        msg.role === "user"
                          ? "var(--color-bg-deep)"
                          : "var(--color-text-primary)",
                      border:
                        msg.role === "user"
                          ? "none"
                          : "1px solid var(--color-border)",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    <ChatBubble text={msg.content} />
                  </div>
                </div>
              ))}
              {loading && phase === "chatting" && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-4 py-3"
                    style={{
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex gap-1.5">
                      <span className="typing-dot" style={{ animationDelay: "0s" }} />
                      <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                      <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input or Guess */}
            {phase === "chatting" && (
              <div
                className="flex gap-2 pt-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Say something..."
                  disabled={loading}
                  className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="rounded-xl px-5 py-3 text-sm font-bold cursor-pointer"
                  style={{
                    background: "var(--color-accent-cyan)",
                    color: "var(--color-bg-deep)",
                    border: "none",
                    opacity: loading || !input.trim() ? 0.4 : 1,
                  }}
                >
                  Send
                </button>
              </div>
            )}

            {phase === "guessing" && (
              <div
                className="text-center pt-6 pb-2 animate-fade-up"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <p
                  className="text-sm font-bold mb-4"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-accent-amber)",
                  }}
                >
                  🤔 Time to guess — was this a raw model or a scaffolded agent?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => submitGuess("raw")}
                    disabled={loading}
                    className="rounded-xl px-8 py-3.5 text-sm font-bold cursor-pointer"
                    style={{
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    🤖 Raw Model
                  </button>
                  <button
                    onClick={() => submitGuess("scaffolded")}
                    disabled={loading}
                    className="rounded-xl px-8 py-3.5 text-sm font-bold cursor-pointer"
                    style={{
                      background: "rgba(34, 211, 238, 0.1)",
                      border: "1px solid rgba(34, 211, 238, 0.3)",
                      color: "var(--color-accent-cyan)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    🧠 Scaffolded Agent
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ REVEAL ═══ */}
        {phase === "reveal" && reveal && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-up">
            <div className="text-6xl mb-6">
              {reveal.correct ? "🎯" : "😮"}
            </div>
            <h2
              className="mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: reveal.correct
                  ? "var(--color-accent-emerald)"
                  : "var(--color-accent-amber)",
              }}
            >
              {reveal.correct ? "You got it right!" : "Fooled you!"}
            </h2>
            <p
              className="text-lg font-light mb-8 mx-auto"
              style={{
                color: "var(--color-text-secondary)",
                maxWidth: 420,
                lineHeight: 1.7,
              }}
            >
              {reveal.wasScaffolded
                ? "That was a scaffolded agent — it had memory, identity, and real context backing every response."
                : "That was a raw model — no memory, no identity, no context. Just a base LLM."}
            </p>

            {/* Stats */}
            <div
              className="rounded-2xl p-6 mb-8 w-full"
              style={{
                maxWidth: 400,
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-accent-cyan)",
                    }}
                  >
                    {reveal.accuracy}%
                  </p>
                  <p
                    className="text-[10px] uppercase mt-1"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Guess Accuracy
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-accent-amber)",
                    }}
                  >
                    {reveal.totalGuesses}
                  </p>
                  <p
                    className="text-[10px] uppercase mt-1"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Total Guesses
                  </p>
                </div>
              </div>
            </div>

            {/* Thesis callout */}
            <div
              className="rounded-xl p-5 mb-8 w-full text-left"
              style={{
                maxWidth: 420,
                background: "linear-gradient(135deg, rgba(34, 211, 238, 0.06), rgba(245, 158, 11, 0.06))",
                border: "1px solid rgba(34, 211, 238, 0.15)",
              }}
            >
              <p
                className="text-xs font-bold mb-2"
                style={{ color: "var(--color-accent-cyan)" }}
              >
                💡 The Thesis
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}
              >
                It&rsquo;s not the model — it&rsquo;s the agent. Give an AI memory,
                identity, and context, and it becomes more human without a single
                model improvement. Scaffolded agents score{" "}
                <strong style={{ color: "var(--color-accent-emerald)" }}>
                  +20 points higher
                </strong>{" "}
                on our full Turing Test.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setPhase("intro");
                  setMessages([]);
                  setReveal(null);
                  setSessionId(null);
                  setExchangeNum(0);
                }}
                className="rounded-xl px-6 py-3 text-sm font-bold cursor-pointer"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                🔄 Try Again
              </button>
              <Link
                href="/compare"
                className="rounded-xl px-6 py-3 text-sm font-bold no-underline text-center"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))",
                  color: "var(--color-bg-deep)",
                  fontFamily: "var(--font-display)",
                }}
              >
                See Full Comparison →
              </Link>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-text-muted);
          animation: typing 1.2s ease-in-out infinite;
        }
        @keyframes typing {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </>
  );
}
