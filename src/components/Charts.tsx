"use client";
import type { ReactNode } from "react";

/* ----------------------------- Progress ring ----------------------------- */
export function ProgressRing({
  value,
  size = 130,
  stroke = 11,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* -------------------------------- Donut ---------------------------------- */
export function Donut({
  data,
  size = 150,
  thickness = 22,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const segments = data.map((d, i) => {
    const dash = (d.value / total) * c;
    const offset = data.slice(0, i).reduce((sum, item) => sum + (item.value / total) * c, 0);
    return { ...d, dash, offset };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
      {segments.map((d, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={d.color}
          strokeWidth={thickness}
          strokeDasharray={`${d.dash} ${c - d.dash}`}
          strokeDashoffset={-d.offset}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      ))}
    </svg>
  );
}

/* ------------------------------- Bar chart ------------------------------- */
export function Bars({
  data,
  height = 150,
}: {
  data: { label: string; values: { color: string; value: number }[] }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.flatMap((d) => d.values.map((v) => v.value)));
  return (
    <div className="flex items-end gap-3 sm:gap-4" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0">
          <div className="flex items-end gap-1 w-full justify-center h-full">
            {d.values.map((v, j) => (
              <div
                key={j}
                className="rounded-t-md w-full max-w-[18px]"
                style={{
                  height: `${(v.value / max) * 100}%`,
                  background: v.color,
                  minHeight: 3,
                  transition: "height 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
                title={`${v.value}`}
              />
            ))}
          </div>
          <span className="text-[0.65rem] text-muted truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- Line chart ------------------------------ */
export function Line({
  labels,
  series,
  height = 150,
}: {
  labels: string[];
  series: { color: string; values: number[] }[];
  height?: number;
}) {
  const W = 320;
  const H = 140;
  const pad = 10;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = labels.length;
  const x = (i: number) => (n <= 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1));
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1={pad} x2={W - pad} y1={H - pad - g * (H - 2 * pad)} y2={H - pad - g * (H - 2 * pad)} stroke="var(--border)" strokeWidth="1" />
      ))}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
        const area = `${pad},${H - pad} ${pts} ${x(n - 1)},${H - pad}`;
        return (
          <g key={si}>
            <polygon points={area} fill={s.color} opacity={0.12} />
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-soft">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
