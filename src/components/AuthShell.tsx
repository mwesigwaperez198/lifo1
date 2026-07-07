import type { ReactNode } from "react";
import { Target, ShoppingBag, Sparkles, PiggyBank, Trophy, TrendingDown, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: Target, label: "Goal tracking", desc: "8 categories with deadlines & progress" },
  { icon: ShoppingBag, label: "Smart shopping", desc: "Wishlists, target prices & planning" },
  { icon: Sparkles, label: "Chloe AI companion", desc: "Remembers you, coaches monthly" },
  { icon: PiggyBank, label: "Savings forecasts", desc: "Project when you'll hit each goal" },
  { icon: TrendingDown, label: "Price alerts", desc: "Drop alerts on tracked products" },
  { icon: Trophy, label: "Achievements", desc: "Badges, milestones & certificates" },
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
        <div className="flex items-center gap-2.5">
          <div className="brand-orb" />
          <div className="font-bold text-lg">LifeGoals</div>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight max-w-md">
            Your personal <span className="grad-text">life-assistant</span> for goals, money & smart shopping.
          </h2>
          <p className="text-soft mt-4 max-w-md leading-relaxed">
            Plan your future, track every goal, compare prices, and grow your savings — guided by Chloe, an AI companion that gets smarter the more you use it.
          </p>
          <div className="mt-8 space-y-2.5 max-w-md">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="glass-soft p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg grid place-items-center feature-icon shrink-0"><Icon size={16} /></div>
                  <div>
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-xs text-muted">{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted flex items-center gap-1.5"><ShieldCheck size={13} className="icon-accent" /> bcrypt hashing · CSRF protection · secure sessions · audit logs</p>
      </div>

      {/* Form panel — centered */}
      <div className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-6 justify-center">
            <div className="brand-orb" />
            <div className="font-bold text-lg">LifeGoals</div>
          </div>
          <div className="glass p-7 scale-in">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 grid place-items-center feature-icon"><Sparkles size={22} /></div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-soft text-sm mt-1">{subtitle}</p>
            </div>
            {children}
          </div>
          {footer && <div className="mt-4 text-center text-sm text-soft">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
