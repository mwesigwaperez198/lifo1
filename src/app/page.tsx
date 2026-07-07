import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Target, ShoppingBag, Sparkles, PiggyBank, Trophy, TrendingDown, Bell, Brain, ShieldCheck,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ProgressRing } from "@/components/Charts";

const FEATURES = [
  { icon: Target, title: "Goals management", desc: "Create, prioritise and track goals across 8 categories with deadlines and progress." },
  { icon: ShoppingBag, title: "Purchase planner", desc: "Wishlist products, set target prices and deadlines, and plan your spending." },
  { icon: TrendingDown, title: "Price tracker", desc: "Save links, compare stores, view price history and get drop alerts." },
  { icon: Sparkles, title: "Chloe AI companion", desc: "A personalised assistant that remembers you and grows smarter over time." },
  { icon: PiggyBank, title: "Savings & forecasts", desc: "Track income, expenses and project when you'll reach each goal." },
  { icon: Trophy, title: "Achievements", desc: "Earn badges, milestones and certificates as you progress." },
  { icon: Bell, title: "Smart notifications", desc: "Deadline reminders, price-drop alerts and achievement unlocks." },
  { icon: Brain, title: "Long-term memory", desc: "Your AI remembers goals, habits, brands and conversations between sessions." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="container-fluid px-3 sm:px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="brand-orb" />
          <span className="font-bold text-lg">LifeGoals</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Start free</Link>
        </div>
      </header>

      <section className="container-fluid px-3 sm:px-5 pt-8 sm:pt-12 pb-16 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="animate-in">
            <span className="feature-pill mb-4"><Sparkles size={13} /> AI companion Chloe included</span>
            <h1 className="hero-title mt-3 grad-text">Plan your life goals and shop smarter.</h1>
            <p className="text-soft mt-4 max-w-lg" style={{ fontSize: "1.05rem", lineHeight: 1.7 }}>
              Track goals, build savings plans, compare prices, remember ambitions, and let your personal AI life assistant recommend your next best move.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-5">
              <Link href="/register" className="btn btn-primary btn-lg">Create your planner</Link>
              <Link href="/login" className="btn btn-outline-light btn-lg">Login</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {["Goals", "Wishlist", "Savings", "Achievements", "Smart AI Memory"].map((f) => (
                <span key={f} className="feature-pill">{f}</span>
              ))}
            </div>
          </div>

          <div className="relative animate-in fade-up-2">
            <div className="glass p-5 floaty">
              <div className="flex items-center gap-3 mb-4">
                <div className="ai-avatar"><Sparkles size={20} /></div>
                <div>
                  <h4 className="font-bold text-base">Meet Chloe</h4>
                  <p className="text-sm text-soft">Your customizable digital life companion.</p>
                </div>
              </div>
              <div className="glass-soft p-3 mb-4 text-sm text-soft">
                &ldquo;I&apos;ll remember your laptop goal, savings pace, favorite brands, and upcoming deadlines so I can guide you every month.&rdquo;
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="glass-soft p-3">
                  <strong className="text-lg">43%</strong><br />
                  <span className="text-xs text-muted">Laptop goal</span>
                </div>
                <div className="glass-soft p-3">
                  <strong className="text-lg">12</strong><br />
                  <span className="text-xs text-muted">Badges ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid px-3 sm:px-5 pb-16 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Everything in one place</h2>
        <p className="text-soft text-center mb-8">A full life-planning suite wrapped in a beautiful glassmorphism interface.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`glass p-4 hover-lift fade-up fade-up-${(i % 4) + 1}`}>
                <div className="w-10 h-10 rounded-xl grid place-items-center mb-2.5 feature-icon">
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-soft leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-fluid px-3 sm:px-5 pb-20 max-w-4xl mx-auto">
        <div className="glass p-7 sm:p-9 text-center fade-up hero-cta-panel">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to meet Chloe?</h2>
          <p className="text-soft mt-2 max-w-lg mx-auto">Create your free account and start building the future you want — with a smarter assistant by your side.</p>
          <Link href="/register" className="btn btn-primary btn-lg mt-5 inline-flex">Create your account</Link>
        </div>
        <p className="text-center text-xs text-muted mt-8 flex items-center justify-center gap-2">
          <ShieldCheck size={13} /> Built with bcrypt, CSRF protection, secure sessions & audit logging.
        </p>
      </section>

      <footer className="container-fluid px-4 py-4 text-center text-muted text-sm">
        Life Goals & Smart Shopping Planner · Future-ready biometric/AI architecture · 2026
      </footer>
    </div>
  );
}
