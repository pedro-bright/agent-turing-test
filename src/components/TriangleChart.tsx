/**
 * 3-Signal Triangle Chart
 *
 * An equilateral triangle with each vertex representing one of the 3 signals.
 * Score dots are plotted along each axis (center to vertex) based on the 1-5 score.
 */

interface TriangleChartProps {
  believability: number; // 1-5
  socialRisk: number;    // 1-5
  identity: number;      // 1-5
  size?: number;
  className?: string;
  mini?: boolean;
}

export default function TriangleChart({
  believability,
  socialRisk,
  identity,
  size = 400,
  className = "",
  mini = false,
}: TriangleChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;

  // Equilateral triangle vertices (top, bottom-left, bottom-right)
  // Top = Believability, Bottom-left = Social Risk, Bottom-right = Identity
  const vertices = [
    { x: cx, y: cy - radius, label: "Believability", score: believability },
    {
      x: cx - radius * Math.cos(Math.PI / 6),
      y: cy + radius * Math.sin(Math.PI / 6),
      label: "Social Risk",
      score: socialRisk,
    },
    {
      x: cx + radius * Math.cos(Math.PI / 6),
      y: cy + radius * Math.sin(Math.PI / 6),
      label: "Identity",
      score: identity,
    },
  ];

  // Generate concentric guide triangles (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const guideTriangles = levels.map((l) =>
    vertices
      .map((v) => {
        const dx = v.x - cx;
        const dy = v.y - cy;
        return `${cx + dx * l},${cy + dy * l}`;
      })
      .join(" ")
  );

  // Score points: map 1-5 to 0-1 (1 = center, 5 = vertex)
  const normalize = (s: number) => Math.max(0, Math.min(1, (s - 1) / 4));
  const scorePoints = vertices.map((v) => {
    const t = normalize(v.score);
    return {
      x: cx + (v.x - cx) * t,
      y: cy + (v.y - cy) * t,
    };
  });

  const dataPolygon = scorePoints.map((p) => `${p.x},${p.y}`).join(" ");

  const labelOffset = mini ? 14 : 22;
  const fontSize = mini ? 10 : 12;
  const scoreFontSize = mini ? 11 : 14;
  const dotRadius = mini ? 4 : 6;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ width: "100%", maxWidth: size, height: "auto" }}
    >
      <defs>
        <linearGradient id="triGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(34, 211, 238, 0.15)" />
          <stop offset="100%" stopColor="rgba(245, 158, 11, 0.08)" />
        </linearGradient>
        <linearGradient id="triStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Guide triangles */}
      {guideTriangles.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="#2a2a38"
          strokeWidth={i === levels.length - 1 ? 1 : 0.5}
          opacity={0.3 + i * 0.1}
        />
      ))}

      {/* Axis lines from center to vertices */}
      {vertices.map((v, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={v.x}
          y2={v.y}
          stroke="#2a2a38"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="url(#triGradient)"
        stroke="url(#triStroke)"
        strokeWidth={2}
        opacity={0.9}
      />

      {/* Score dots */}
      {scorePoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={dotRadius}
          fill={
            i === 0
              ? "#22d3ee"
              : i === 1
              ? "#2dd4bf"
              : "#f59e0b"
          }
          stroke="var(--color-bg-deep, #06060a)"
          strokeWidth={2}
        />
      ))}

      {/* Labels */}
      {!mini &&
        vertices.map((v, i) => {
          const dx = v.x - cx;
          const dy = v.y - cy;
          const len = Math.sqrt(dx * dx + dy * dy);
          const lx = v.x + (dx / len) * labelOffset;
          const ly = v.y + (dy / len) * labelOffset;
          const anchor =
            i === 0
              ? "middle"
              : i === 1
              ? "end"
              : "start";

          return (
            <g key={i}>
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                fill="#8888a0"
                fontFamily="'IBM Plex Sans', sans-serif"
                fontSize={fontSize}
                fontWeight={500}
              >
                {v.label}
              </text>
              <text
                x={lx}
                y={ly + fontSize + 4}
                textAnchor={anchor}
                fill={
                  i === 0
                    ? "#22d3ee"
                    : i === 1
                    ? "#2dd4bf"
                    : "#f59e0b"
                }
                fontFamily="'JetBrains Mono', monospace"
                fontSize={scoreFontSize}
                fontWeight={700}
              >
                {v.score.toFixed(1)}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
