import type { HTMLAttributes, ReactNode } from "react";

export function Glass({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={`glass p-4 sm:p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-soft">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "var(--accent)",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="glass p-4 sm:p-5 hover-lift fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.7rem] uppercase tracking-wider text-muted font-semibold truncate">{label}</div>
          <div className="text-2xl font-bold mt-1 truncate">{value}</div>
          {sub && <div className="text-xs text-soft mt-1">{sub}</div>}
        </div>
        <div
          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `color-mix(in srgb, ${tone} 20%, transparent)`, color: tone }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`bar ${className}`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="chip"
      style={tone ? { background: `color-mix(in srgb, ${tone} 18%, transparent)`, color: tone, borderColor: `color-mix(in srgb, ${tone} 35%, transparent)` } : undefined}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass p-8 text-center fade-up">
      <div className="text-5xl mb-3 floaty inline-block">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-soft mt-1 max-w-md mx-auto">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent spin ${className}`}
    />
  );
}
