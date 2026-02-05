import Link from "next/link";
import Nav from "@/components/Nav";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main
        className="relative z-1 min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: "var(--color-bg-deep)" }}
      >
        <div className="grid-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} />

        <div className="text-center animate-fade-up">
          <p
            className="mb-4"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "var(--color-text-muted)",
              opacity: 0.3,
            }}
          >
            404
          </p>
          <h1
            className="mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Signal Lost
          </h1>
          <p
            className="text-base font-light mb-8"
            style={{ color: "var(--color-text-secondary)", maxWidth: 400, lineHeight: 1.7 }}
          >
            This page doesn&rsquo;t exist. Maybe the agent wandered off,
            or maybe the URL had a mask slip.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="rounded-lg px-6 py-3 text-sm font-semibold no-underline"
              style={{
                background: "var(--color-accent-cyan)",
                color: "var(--color-bg-deep)",
              }}
            >
              Back to Home
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg px-6 py-3 text-sm font-semibold no-underline"
              style={{
                background: "var(--color-bg-surface)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
