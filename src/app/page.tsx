import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Target, ShoppingBag, Sparkles, PiggyBank, Trophy, TrendingDown, Bell, Brain, ShieldCheck, LayoutDashboard,
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
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl grid place-items-center text-white font-bold brand-mark">L</div>
          <span className="font-bold text-lg">LifeOS</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-10 pb-20 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="fade-up">
            <span className="chip mb-4"><Sparkles size={13} className="icon-accent" /> Meet Chloe — your AI life-assistant</span>
            <h1 className="text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight">
              Plan your <span className="grad-text">whole life</span>, one goal at a time.
            </h1>
            <p className="text-soft text-lg mt-5 max-w-lg">
              A personal planner, financial tracker, wishlist manager and smart shopping assistant — powered by an AI companion that learns who you are.
            </p>
            <div className="flex gap-3 mt-7">
              <Link href="/register" className="btn btn-primary"><LayoutDashboard size={16} /> Start free</Link>
              <Link href="/login" className="btn btn-ghost">I have an account</Link>
            </div>
            <div className="flex gap-6 mt-8 text-sm text-soft">
              <div><div className="text-2xl font-bold icon-accent">8+</div>goal categories</div>
              <div><div className="text-2xl font-bold icon-accent">7</div>AI personalities</div>
              <div><div className="text-2xl font-bold icon-accent">∞</div>long-term memory</div>
            </div>
          </div>

          <div className="relative fade-up fade-up-2">
            <div className="glass p-6 floaty">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-muted uppercase font-semibold">Overall progress</div>
                  <div className="text-2xl font-bold">You&apos;re crushing it</div>
                </div>
                <ProgressRing value={68} size={92}>
                  <div className="text-center"><div className="text-xl font-bold">68%</div><div className="text-[0.6rem] text-muted">funded</div></div>
                </ProgressRing>
              </div>
              <div className="space-y-3">
                {[
                  { t: "Gaming laptop", v: 80, progressClass: "progress-purple bar-80" },
                  { t: "Web design cert", v: 55, progressClass: "progress-blue bar-55" },
                  { t: "Emergency fund", v: 40, progressClass: "progress-green bar-40" },
                ].map((g) => (
                  <div key={g.t}>
                    <div className="flex justify-between text-xs mb-1"><span>{g.t}</span><span className="text-muted">{g.v}%</span></div>
                    <div className="bar"><span className={g.progressClass} /></div>
                  </div>
                ))}
              </div>
              <div className="glass-soft p-3 mt-4 text-sm flex gap-2">
                <span className="text-xl">✨</span>
                <span><b>Chloe:</b> &ldquo;Based on your savings pace, you&apos;ll hit the laptop goal in ~3 months. Keep it up! 🔥&rdquo;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Everything in one place</h2>
        <p className="text-soft text-center mb-10">A full life-planning suite wrapped in a beautiful glassmorphism interface.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`glass p-5 hover-lift fade-up fade-up-${(i % 4) + 1}`}>
                <div className="w-11 h-11 rounded-xl grid place-items-center mb-3 feature-icon">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-soft">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-24 max-w-4xl mx-auto">
        <div className="glass p-8 sm:p-10 text-center fade-up hero-cta-panel">
          <div className="text-5xl mb-3">🚀</div>
          <h2 className="text-3xl font-bold">Ready to meet Chloe?</h2>
          <p className="text-soft mt-2 max-w-xl mx-auto">Create your free account and start building the future you want — with a smarter assistant by your side.</p>
          <Link href="/register" className="btn btn-primary mt-6 inline-flex">Create your account</Link>
        </div>
        <p className="text-center text-xs text-muted mt-10 flex items-center justify-center gap-2"><ShieldCheck size={13} /> Built with bcrypt, CSRF protection, secure sessions & audit logging.</p>
      </section>
    </div>
  );
}
