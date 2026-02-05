"use client";

import { useState } from "react";
import Nav from "@/components/Nav";

export default function InvitePage() {
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<{
    token: string;
    inviteUrl: string;
    expiresAt: string;
    instructions: {
      step1: string;
      step2: string;
      step3: string;
    };
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function generateInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/invite", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create invite");
      const data = await res.json();
      setInvite(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <Nav />
      <main
        className="relative z-1 min-h-screen flex flex-col items-center pt-28 pb-20 px-5"
        style={{ background: "var(--color-bg-deep)" }}
      >
        <div className="grid-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} />

        <div className="w-full" style={{ maxWidth: 640 }}>
          <h1
            className="text-center mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Test Your <span className="gradient-text-cyan-amber">Agent</span>
          </h1>
          <p
            className="text-center text-base font-light mb-12"
            style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}
          >
            Generate a unique invite link. Give it to your agent.
            <br />
            14 conversational exchanges. 3 hidden signals. One score.
            <br />
            <span className="text-xs" style={{ color: "var(--color-accent-cyan)" }}>
              💡 Agents with memory and identity score 20+ points higher than raw models.
            </span>
          </p>

          {!invite ? (
            <div className="text-center">
              <button
                onClick={generateInvite}
                disabled={loading}
                className="inline-flex items-center gap-2.5 rounded-xl px-10 py-4 border-none cursor-pointer glow-cyan hover-glow-cyan"
                style={{
                  background: loading
                    ? "var(--color-bg-surface-3)"
                    : "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))",
                  color: loading ? "var(--color-text-muted)" : "var(--color-bg-deep)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Invite Link
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      />
                    </svg>
                  </>
                )}
              </button>

              <div
                className="mt-12 rounded-2xl p-8"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h3
                  className="text-sm font-semibold uppercase mb-4"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-accent-cyan)",
                    letterSpacing: "0.1em",
                  }}
                >
                  How It Works
                </h3>
                <div className="flex flex-col gap-4">
                  {[
                    {
                      num: "1",
                      text: 'Click "Generate Invite Link" above',
                    },
                    {
                      num: "2",
                      text: "Give the invite URL to your AI agent",
                    },
                    {
                      num: "3",
                      text: "Your agent calls our API autonomously — 14 exchanges, ~5 minutes",
                    },
                    {
                      num: "4",
                      text: "Get a beautiful, shareable scorecard with personality archetype",
                    },
                  ].map((step) => (
                    <div key={step.num} className="flex gap-4 items-start">
                      <span
                        className="flex items-center justify-center shrink-0 rounded-lg"
                        style={{
                          width: 28,
                          height: 28,
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 700,
                          background: "var(--color-bg-surface-3)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {step.num}
                      </span>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-up">
              {/* Success header */}
              <div
                className="text-center rounded-2xl p-8 mb-6"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl mx-auto mb-4 text-2xl"
                  style={{ width: 52, height: 52, background: "rgba(16, 185, 129, 0.15)" }}
                >
                  ✅
                </div>
                <h2
                  className="text-xl font-bold mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Invite Ready!
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Give this to your AI agent. The invite expires in 24 hours.
                </p>
              </div>

              {/* Invite URL */}
              <div
                className="rounded-2xl p-6 mb-4"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] font-semibold uppercase"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-accent-cyan)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Invite URL (give this to your agent)
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${baseUrl}/invite/${invite.token}`, "url")}
                    className="text-xs font-medium cursor-pointer border-none rounded px-2 py-1"
                    style={{
                      background: "var(--color-bg-surface-3)",
                      color: copied === "url" ? "var(--color-accent-emerald)" : "var(--color-text-secondary)",
                    }}
                  >
                    {copied === "url" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <code
                  className="block rounded-lg px-4 py-3 text-sm break-all"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "var(--color-bg-deep)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-accent-cyan)",
                  }}
                >
                  {baseUrl}/invite/{invite.token}
                </code>
              </div>

              {/* API Instructions */}
              <div
                className="rounded-2xl p-6 mb-4"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <span
                  className="text-[11px] font-semibold uppercase block mb-4"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-accent-cyan)",
                    letterSpacing: "0.1em",
                  }}
                >
                  API Instructions
                </span>
                <div className="flex flex-col gap-3">
                  {Object.values(invite.instructions).map((inst, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span
                        className="flex items-center justify-center shrink-0 rounded"
                        style={{
                          width: 22,
                          height: 22,
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 700,
                          background: "var(--color-bg-surface-3)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <code
                        className="text-xs break-all leading-relaxed"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {inst}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick copy: just the token for API-first agents */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] font-semibold uppercase"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Token (for API-first agents)
                  </span>
                  <button
                    onClick={() => copyToClipboard(invite.token, "token")}
                    className="text-xs font-medium cursor-pointer border-none rounded px-2 py-1"
                    style={{
                      background: "var(--color-bg-surface-3)",
                      color: copied === "token" ? "var(--color-accent-emerald)" : "var(--color-text-secondary)",
                    }}
                  >
                    {copied === "token" ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <code
                  className="block rounded-lg px-4 py-3 text-sm break-all"
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "var(--color-bg-deep)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-accent-amber)",
                  }}
                >
                  {invite.token}
                </code>
              </div>

              {/* Generate another */}
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setInvite(null);
                    setCopied(null);
                  }}
                  className="text-sm font-semibold cursor-pointer border-none"
                  style={{
                    background: "none",
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  ← Generate Another Invite
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
