interface ScoreBarProps {
  score: number; // 0-100
  maxScore?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}

export default function ScoreBar({
  score,
  maxScore = 100,
  height = 8,
  className = "",
  animate = true,
}: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${className}`}
      style={{
        height,
        background: "var(--color-bg-surface-3)",
      }}
    >
      <div
        className={animate ? "score-bar-animate" : ""}
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: "9999px",
          background:
            "linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-teal), var(--color-accent-amber))",
        }}
      />
    </div>
  );
}
