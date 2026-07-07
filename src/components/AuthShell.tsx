import type { ReactNode } from "react";
import { Target, ShoppingBag, Sparkles, PiggyBank, Trophy, TrendingDown } from "lucide-react";

const FEATURES = [
  { icon: Target, label: "Goal tracking" },
  { icon: ShoppingBag, label: "Smart shopping" },
  { icon: Sparkles, label: "Chloe AI companion" },
  { icon: PiggyBank, label: "Savings forecasts" },
  { icon: Trophy, label: "Achievements" },
  { icon: TrendingDown, label: "Price alerts" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl grid place-items-center text-white font-bold text-lg" style={{ background: "linear-gradient(135deg, var(--accent), #2563eb)" }}>L</div>
          <div className="font-bold text-lg">LifeOS</div>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Your personal <span className="grad-text">life-assistant</span> for goals, money & smart shopping.
          </h2>
          <p className="text-soft mt-4 max-w-md">
            Plan your future, track every goal, compare prices, and grow your savings — guided by Chloe, an AI companion that gets smarter the more you use it.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-8 max-w-md">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="glass-soft p-3 flex items-center gap-2.5 text-sm">
                  <Icon size={18} style={{ color: "var(--accent)" }} /> {f.label}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted">🔒 bcrypt hashing · CSRF protection · secure sessions · audit logs</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-6 justify-center">
            <div className="w-10 h-10 rounded-xl grid place-items-center text-white font-bold" style={{ background: "linear-gradient(135deg, var(--accent), #2563eb)" }}>L</div>
            <div className="font-bold text-lg">LifeOS</div>
          </div>
          <div className="glass p-7 fade-up">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-soft text-sm mt-1 mb-5">{subtitle}</p>
            {children}
          </div>
          {footer && <div className="mt-4 text-center text-sm text-soft">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
