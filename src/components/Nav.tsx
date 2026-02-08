"use client";

import { useState } from "react";
import Link from "next/link";

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-100"
      style={{
        background: "rgba(6, 6, 10, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border)",
        contain: "layout style",
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 md:px-10">
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
            href="/leaderboard"
            className="hidden text-sm font-medium md:inline transition-colors duration-150"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Leaderboard
          </Link>
          <Link
            href="/blind"
            className="hidden text-sm font-medium md:inline transition-colors duration-150"
            style={{ color: "var(--color-accent-emerald)" }}
          >
            🎭 Blind Test
          </Link>
          <Link
            href="/compare"
            className="hidden text-sm font-medium md:inline transition-colors duration-150"
            style={{ color: "var(--color-accent-amber)" }}
          >
            Raw vs Agent
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
            className="hidden md:inline-flex rounded-lg px-5 py-2 text-[13px] font-semibold tracking-wide transition-colors duration-150"
            style={{
              background: "var(--color-accent-cyan)",
              color: "var(--color-bg-deep)",
              letterSpacing: "0.02em",
            }}
          >
            Test Your Agent
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <span
              style={{
                display: "block",
                width: 20,
                height: 2,
                background: "var(--color-text-secondary)",
                borderRadius: 1,
                transition: "transform 0.2s, opacity 0.2s",
                transform: mobileOpen ? "translateY(5.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: 20,
                height: 2,
                background: "var(--color-text-secondary)",
                borderRadius: 1,
                transition: "opacity 0.2s",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: 20,
                height: 2,
                background: "var(--color-text-secondary)",
                borderRadius: 1,
                transition: "transform 0.2s, opacity 0.2s",
                transform: mobileOpen ? "translateY(-5.5px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden flex flex-col gap-1 px-6 pb-5"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {[
            { href: "/leaderboard", label: "Leaderboard", color: "var(--color-text-secondary)" },
            { href: "/blind", label: "🎭 Blind Test", color: "var(--color-accent-emerald)" },
            { href: "/compare", label: "Raw vs Agent", color: "var(--color-accent-amber)" },
            { href: "/docs", label: "API Docs", color: "var(--color-text-secondary)" },
            { href: "/invite", label: "Test Your Agent →", color: "var(--color-accent-cyan)" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-medium no-underline"
              style={{ color: item.color, borderBottom: "1px solid var(--color-border)" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
