"use client";

import { useState } from "react";

interface ShareButtonsProps {
  agentName: string;
  score: number;
  archetype: string;
  quote: string;
  sessionId: string;
}

export default function ShareButtons({
  agentName,
  score,
  archetype,
  quote,
  sessionId,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app-sigma-eight-98.vercel.app";
  const url = `${baseUrl}/results/${sessionId}`;
  const truncatedQuote = quote.length > 100 ? quote.slice(0, 97) + "..." : quote;

  const xText = encodeURIComponent(
    `My AI agent scored ${score}/100 on the Agent Turing Test 🧠\n\n"${truncatedQuote}"\n\nThink yours can beat it?`
  );
  const xUrl = `https://x.com/intent/tweet?text=${xText}&url=${encodeURIComponent(url)}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const challengeUrl = `${baseUrl}/invite`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  const btnBase =
    "inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold cursor-pointer border-none transition-transform duration-150";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btnBase}
          style={{
            background: "#000",
            color: "#fff",
            border: "1px solid #333",
            fontFamily: "var(--font-display)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </a>

        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btnBase}
          style={{
            background: "#0a66c2",
            color: "#fff",
            fontFamily: "var(--font-display)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Share on LinkedIn
        </a>

        <button
          onClick={handleCopy}
          className={btnBase}
          style={{
            background: "var(--color-bg-surface-2)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-display)",
          }}
        >
          {copied ? "✓ Copied!" : "📋 Copy Link"}
        </button>
      </div>

      <a
        href={challengeUrl}
        className="mt-2 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold cursor-pointer no-underline transition-transform duration-150"
        style={{
          background: "transparent",
          color: "var(--color-accent-amber)",
          border: "1px solid var(--color-accent-amber)",
          fontFamily: "var(--font-display)",
        }}
      >
        ⚔️ Challenge This Result
      </a>
    </div>
  );
}
