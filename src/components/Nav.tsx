"use client";

import Link from "next/link";

export default function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between px-6 py-4 md:px-10"
      style={{
        background: "rgba(6, 6, 10, 0.85)",
        borderBottom: "1px solid var(--color-border)",
        contain: "layout style",
      }}
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 no-underline"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}
      >
        <span
          className="flex items-center justify-center rounded-lg text-base"
          style={{
            width: 28,
            height: 28,
            background: "linear-gradient(135deg, var(--color-accent-cyan), var(--color-accent-teal))",
          }}
        >
          🧠
        </span>
        Agent Turing Test
      </Link>

      <div className="flex items-center gap-6 md:gap-8">
        <Link
          href="/#how"
          className="hidden text-sm font-medium md:inline transition-colors duration-150"
          style={{ color: "var(--color-text-secondary)" }}
        >
          How It Works
        </Link>
        <Link
          href="/#signals"
          className="hidden text-sm font-medium md:inline transition-colors duration-150"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Signals
        </Link>
        <Link
          href="/#leaderboard"
          className="hidden text-sm font-medium md:inline transition-colors duration-150"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Leaderboard
        </Link>
        <Link
          href="/docs"
          className="hidden text-sm font-medium md:inline transition-colors duration-150"
          style={{ color: "var(--color-text-secondary)" }}
        >
          API Docs
        </Link>
        <Link
          href="/invite"
          className="rounded-lg px-5 py-2 text-[13px] font-semibold tracking-wide transition-colors duration-150"
          style={{
            background: "var(--color-accent-cyan)",
            color: "var(--color-bg-deep)",
            letterSpacing: "0.02em",
          }}
        >
          Test Your Agent
        </Link>
      </div>
    </nav>
  );
}
