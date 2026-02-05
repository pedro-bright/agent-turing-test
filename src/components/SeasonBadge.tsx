interface SeasonBadgeProps {
  label?: string;
  className?: string;
}

export default function SeasonBadge({
  label = "Season 1 • Feb 2026",
  className = "",
}: SeasonBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-medium ${className}`}
      style={{
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
        background: "var(--color-bg-surface)",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
  );
}
