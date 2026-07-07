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
    <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg feature-icon">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-soft mt-0.5">{subtitle}</p>}
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
    <div className="glass p-4 hover-lift fade-up animate-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.68rem] uppercase tracking-wider text-muted font-semibold truncate">{label}</div>
          <div className="text-xl sm:text-2xl font-bold mt-1 truncate">{value}</div>
          {sub && <div className="text-xs text-soft mt-1">{sub}</div>}
        </div>
        <div
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg feature-icon"
          style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)`, color: tone, borderColor: `color-mix(in srgb, ${tone} 25%, transparent)` }}
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
      className="feature-pill"
      style={tone ? { background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone, borderColor: `color-mix(in srgb, ${tone} 30%, transparent)` } : undefined}
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
    <div className="glass p-8 text-center fade-up animate-in">
      <div className="text-4xl mb-3 floaty inline-block">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-soft mt-1.5 max-w-md mx-auto">{subtitle}</p>}
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
