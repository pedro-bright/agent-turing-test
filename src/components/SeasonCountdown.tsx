"use client";

import { useEffect, useState } from "react";

// Season 1: Feb 5 – April 30, 2026
const SEASON_END = new Date("2026-04-30T23:59:59-07:00").getTime();

function calcTimeLeft() {
  const diff = SEASON_END - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

export default function SeasonCountdown({ className = "" }: { className?: string }) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${className}`}
        style={{
          background: "rgba(244, 63, 94, 0.1)",
          border: "1px solid rgba(244, 63, 94, 0.2)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--color-accent-rose)",
        }}
      >
        Season 1 Closed
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full px-4 py-1.5 ${className}`}
      style={{
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--color-accent-amber)", fontWeight: 600 }}>
        Season 1 closes in
      </span>
      <div className="flex items-center gap-1.5">
        <TimeUnit value={timeLeft.days} label="d" />
        <span style={{ color: "var(--color-text-muted)" }}>:</span>
        <TimeUnit value={timeLeft.hours} label="h" />
        <span style={{ color: "var(--color-text-muted)" }}>:</span>
        <TimeUnit value={timeLeft.minutes} label="m" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <span style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
      {String(value).padStart(2, "0")}
      <span style={{ fontSize: 9, color: "var(--color-text-muted)", fontWeight: 400 }}>{label}</span>
    </span>
  );
}
