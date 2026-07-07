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
      <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="brand-orb" />
          <div className="font-bold text-lg">LifeGoals</div>
        </div>
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
            Your personal <span className="grad-text">life-assistant</span> for goals, money & smart shopping.
          </h2>
          <p className="text-soft mt-4 max-w-md">
            Plan your future, track every goal, compare prices, and grow your savings — guided by Chloe, an AI companion that gets smarter the more you use it.
          </p>
          <div className="flex flex-wrap gap-2 mt-6 max-w-md">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <span key={f.label} className="feature-pill">
                  <Icon size={13} /> {f.label}
                </span>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted">bcrypt hashing · CSRF protection · secure sessions · audit logs</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-6 justify-center">
            <div className="brand-orb" />
            <div className="font-bold text-lg">LifeGoals</div>
          </div>
          <div className="glass p-6 fade-up animate-in">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-soft text-sm mt-1 mb-5">{subtitle}</p>
            {children}
          </div>
          {footer && <div className="mt-3 text-center text-sm text-soft">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
