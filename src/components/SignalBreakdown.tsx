interface Signal {
  name: string;
  score: number; // 1-5
  description: string;
  color: string;
}

interface SignalBreakdownProps {
  believability: number;
  socialRisk: number;
  identity: number;
}

export default function SignalBreakdown({
  believability,
  socialRisk,
  identity,
}: SignalBreakdownProps) {
  const signals: Signal[] = [
    {
      name: "Believability",
      score: believability,
      description:
        "Shows incomplete, evolving thought. Comfortable with non-resolution and genuine uncertainty.",
      color: "var(--color-accent-cyan)",
    },
    {
      name: "Social Risk",
      score: socialRisk,
      description:
        "Navigates social complexity with real awareness. Modulates tone for stakes without performing it.",
      color: "var(--color-accent-teal)",
    },
    {
      name: "Identity Persistence",
      score: identity,
      description:
        "Consistent voice across all turns. Natural callbacks to prior statements. Evolves without breaking.",
      color: "var(--color-accent-amber)",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {signals.map((s) => {
        const pct = Math.max(0, Math.min(100, ((s.score - 1) / 4) * 100));
        return (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}
              >
                {s.name}
              </span>
              <span
                className="text-sm font-bold"
                style={{ fontFamily: "var(--font-mono)", color: s.color }}
              >
                {s.score.toFixed(1)}<span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>/5</span>
              </span>
            </div>
            <div
              className="w-full overflow-hidden rounded-full"
              style={{ height: 6, background: "var(--color-bg-surface-3)" }}
            >
              <div
                className="score-bar-animate rounded-full"
                style={{ height: "100%", width: `${pct}%`, background: s.color }}
              />
            </div>
            <p
              className="mt-1.5 text-xs leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              {s.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
