import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Target, ShoppingBag, Sparkles, PiggyBank, Trophy, TrendingDown, Bell, Brain, ShieldCheck,
  CheckCircle2, ArrowRight, Quote, Search, Wallet, ChevronDown,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ProgressRing } from "@/components/Charts";

const STATS = [
  { value: "8+", label: "Goal categories" },
  { value: "7", label: "AI personalities" },
  { value: "∞", label: "Long-term memory" },
  { value: "100%", label: "Private by design" },
];

const STEPS = [
  { n: "01", icon: Target, title: "Set your goals", desc: "Define what matters — a laptop, a course, a trip, an emergency fund. Pick a category, a target amount and a deadline." },
  { n: "02", icon: Wallet, title: "Plan your savings", desc: "Log income and expenses. LifeOS projects exactly when you'll hit each goal based on your real savings pace." },
  { n: "03", icon: Search, title: "Track prices smartly", desc: "Save product links, compare stores and watch price history. Get alerted the moment a price drops." },
  { n: "04", icon: Sparkles, title: "Let Chloe guide you", desc: "Your AI companion reviews your progress monthly and tells you the single best move to make next." },
];

const DEEP = [
  {
    icon: Target, title: "Goals that actually stick",
    points: ["8 categories: Tech, Education, Travel, Health, Home, Emergency, Gift, Other", "Deadlines with smart reminders", "Progress rings and milestone celebrations"],
  },
  {
    icon: PiggyBank, title: "Money you can see",
    points: ["Income & expense tracking", "Forecasts for every goal", "Spending vs savings breakdown"],
  },
  {
    icon: TrendingDown, title: "Never overpay again",
    points: ["Price history charts", "Multi-store comparison", "Drop alerts straight to notifications"],
  },
  {
    icon: Brain, title: "An AI that remembers",
    points: ["Persistent long-term memory", "7 switchable personalities", "Context-aware monthly coaching"],
  },
];

const FAQ = [
  { q: "Is my data private?", a: "Yes. Accounts are protected with bcrypt password hashing, CSRF-protected sessions, and every sensitive action is audit-logged. Your data is yours." },
  { q: "What can Chloe actually do?", a: "Chloe remembers your goals, brands, habits and past conversations. She reviews your progress and recommends the next best financial or planning move — and you can switch her personality to match your vibe." },
  { q: "Do I need a credit card to start?", a: "No. Creating an account is free and you can track unlimited goals and products on the free tier." },
  { q: "Can I use it on my phone?", a: "Absolutely. LifeOS is fully responsive with a dedicated mobile navigation, so it feels native whether you're on a laptop or a phone." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      {/* ===================== HEADER ===================== */}
      <header className="container-fluid px-3 sm:px-5 py-3.5 flex items-center justify-between sticky top-0 glass-nav z-50">
        <div className="flex items-center gap-2.5">
          <div className="brand-orb" />
          <span className="font-bold text-lg">LifeGoals</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Start free</Link>
        </div>
      </header>

      {/* ===================== HERO ===================== */}
      <section className="container-fluid px-3 sm:px-5 pt-10 sm:pt-16 pb-14 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="animate-in">
            <span className="feature-pill mb-4"><Sparkles size={13} /> AI companion Chloe included</span>
            <h1 className="hero-title mt-3 grad-text">Plan your life goals and shop smarter.</h1>
            <p className="lead mt-5 max-w-lg">
              Track goals, build savings plans, compare prices, remember ambitions, and let your personal AI life assistant recommend your next best move — all in one calm, beautiful workspace.
            </p>
            <div className="flex flex-wrap gap-2.5 mt-6">
              <Link href="/register" className="btn btn-primary btn-lg">Create your planner <ArrowRight size={16} /></Link>
              <Link href="/login" className="btn btn-outline-light btn-lg">I have an account</Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-7">
              {["Goals", "Wishlist", "Savings", "Achievements", "Smart AI Memory"].map((f) => (
                <span key={f} className="feature-pill">{f}</span>
              ))}
            </div>
          </div>

          <div className="relative animate-in fade-up-2">
            <div className="glass p-6 floaty">
              <div className="flex items-center gap-3 mb-4">
                <div className="ai-avatar"><Sparkles size={20} /></div>
                <div>
                  <h4 className="font-bold text-base">Meet Chloe</h4>
                  <p className="text-sm text-soft">Your customizable digital life companion.</p>
                </div>
              </div>
              <div className="glass-soft p-3.5 mb-4 text-sm text-soft leading-relaxed">
                &ldquo;I&apos;ll remember your laptop goal, savings pace, favorite brands, and upcoming deadlines so I can guide you every month.&rdquo;
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-soft p-3.5">
                  <strong className="text-2xl font-bold">43%</strong>
                  <div className="text-xs text-muted mt-0.5">Laptop goal funded</div>
                </div>
                <div className="glass-soft p-3.5">
                  <strong className="text-2xl font-bold">12</strong>
                  <div className="text-xs text-muted mt-0.5">Badges ready</div>
                </div>
                <div className="glass-soft p-3.5">
                  <strong className="text-2xl font-bold">3 mo</strong>
                  <div className="text-xs text-muted mt-0.5">To reach goal</div>
                </div>
                <div className="glass-soft p-3.5">
                  <strong className="text-2xl font-bold">∞</strong>
                  <div className="text-xs text-muted mt-0.5">Memory retained</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATS BAND ===================== */}
      <section className="container-fluid px-3 sm:px-5 pb-14">
        <div className="glass rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center stagger">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold grad-text">{s.value}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="container-fluid px-3 sm:px-5 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">How LifeOS works</h2>
          <p className="lead mt-3">Four steps from &ldquo;I wish&rdquo; to &ldquo;I did&rdquo; — with Chloe keeping you on track.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="glass p-5 hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl grid place-items-center feature-icon"><Icon size={20} /></div>
                  <span className="text-2xl font-bold text-muted/40">{s.n}</span>
                </div>
                <h3 className="font-bold mb-1.5">{s.title}</h3>
                <p className="text-sm text-soft leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== FEATURE DEEP DIVES ===================== */}
      <section className="container-fluid px-3 sm:px-5 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">Everything in one place</h2>
          <p className="lead mt-3">A full life-planning suite wrapped in a calm, glassmorphism interface.</p>
        </div>
        <div className="space-y-5">
          {DEEP.map((d, i) => {
            const Icon = d.icon;
            const flip = i % 2 === 1;
            return (
              <div key={d.title} className={`glass p-6 sm:p-7 grid md:grid-cols-2 gap-5 items-center ${flip ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div>
                  <div className="w-12 h-12 rounded-xl grid place-items-center feature-icon mb-3"><Icon size={22} /></div>
                  <h3 className="text-xl font-bold">{d.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {d.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-soft">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 icon-accent" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-soft p-5 flex items-center justify-center min-h-[140px]">
                  <ProgressRing value={[68, 54, 81, 92][i]} size={120}>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{[68, 54, 81, 92][i]}%</div>
                      <div className="text-[0.6rem] text-muted">active</div>
                    </div>
                  </ProgressRing>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== TESTIMONIAL ===================== */}
      <section className="container-fluid px-3 sm:px-5 pb-16">
        <div className="glass p-8 sm:p-10 text-center max-w-3xl mx-auto hero-cta-panel scale-in">
          <Quote size={32} className="icon-accent mx-auto mb-3" />
          <p className="text-lg sm:text-xl font-medium leading-relaxed">
            &ldquo;I stopped juggling five apps. LifeOS knows my laptop goal, my savings pace and even reminds me when a price drops. Chloe feels like a friend who actually keeps track of my life.&rdquo;
          </p>
          <div className="mt-4 text-sm text-muted">— Alex C., LifeOS member</div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="container-fluid px-3 sm:px-5 pb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Frequently asked</h2>
        <div className="space-y-3 stagger">
          {FAQ.map((f) => (
            <details key={f.q} className="glass group p-4 [&_summary]:cursor-pointer [&_summary]:font-semibold [&_summary]:flex [&_summary]:items-center [&_summary]:justify-between">
              <summary>{f.q} <ChevronDown size={18} className="text-muted transition-transform group-open:rotate-180" /></summary>
              <p className="text-sm text-soft mt-2.5 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="container-fluid px-3 sm:px-5 pb-20 max-w-4xl mx-auto">
        <div className="glass p-8 sm:p-10 text-center fade-up hero-cta-panel">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to meet Chloe?</h2>
          <p className="lead mt-2 max-w-lg mx-auto">Create your free account and start building the future you want — with a smarter assistant by your side.</p>
          <Link href="/register" className="btn btn-primary btn-lg mt-5 inline-flex">Create your account <ArrowRight size={16} /></Link>
        </div>
        <p className="text-center text-xs text-muted mt-8 flex items-center justify-center gap-2">
          <ShieldCheck size={13} /> Built with bcrypt, CSRF protection, secure sessions & audit logging.
        </p>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="container-fluid px-4 py-6 text-center text-muted text-sm border-t" style={{ borderColor: "var(--border)" }}>
        Life Goals & Smart Shopping Planner · Future-ready biometric/AI architecture · 2026
      </footer>
    </div>
  );
}
