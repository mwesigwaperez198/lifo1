import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserStats, grantAchievements, refreshNotifications, getMonthlySeries } from "@/lib/data";
import { getOrCreatePrefs } from "@/lib/ai";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { StatCard, SectionHeader, EmptyState, Badge } from "@/components/Glass";
import { ProgressRing, Bars, Legend } from "@/components/Charts";
import { money, formatDate, daysUntil, toNum } from "@/lib/format";
import Link from "next/link";
import { Sparkles, CalendarClock, ShoppingBag, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await Promise.all([grantAchievements(user.id).catch(() => {}), refreshNotifications(user.id).catch(() => {})]);

  const [stats, series, recentPurchases, prefs] = await Promise.all([
    getUserStats(user.id),
    getMonthlySeries(user.id, 6),
    db.select().from(purchases).where(eq(purchases.userId, user.id)).orderBy(desc(purchases.createdAt)).limit(4),
    getOrCreatePrefs(user.id),
  ]);

  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.fullName.split(" ")[0];
  const accent = prefs.themeColor || "var(--accent)";

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="fade-up">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{greeting}, {firstName} 👋</h1>
        <p className="text-sm sm:text-base text-soft">Here&apos;s your life at a glance — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🎯" label="Active goals" value={stats.activeGoals} sub={`${stats.completedGoals} completed`} tone="#8b5cf6" />
        <StatCard icon="💰" label="Saved toward goals" value={money(stats.totalSaved)} sub={`of ${money(stats.totalTarget)}`} tone="#10b981" />
        <StatCard icon="🏅" label="Achievements" value={stats.achievementCount} sub={`${stats.purchaseCount} products tracked`} tone="#f59e0b" />
        <StatCard icon="📈" label="Overall progress" value={`${stats.overallProgress}%`} sub={`${stats.wishlistCount} on wishlist`} tone="var(--accent)" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass p-5 fade-up fade-up-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Goal funding</h3>
              <p className="text-xs text-soft">Across all active goals</p>
            </div>
            <ProgressRing value={stats.overallProgress} size={104}>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.overallProgress}%</div>
                <div className="text-[0.6rem] text-muted">funded</div>
              </div>
            </ProgressRing>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-soft">Target total</span><span className="font-semibold">{money(stats.totalTarget)}</span></div>
            <div className="flex justify-between"><span className="text-soft">Saved</span><span className="font-semibold" style={{ color: "var(--success)" }}>{money(stats.totalSaved)}</span></div>
            <div className="flex justify-between"><span className="text-soft">Remaining</span><span className="font-semibold">{money(Math.max(0, stats.totalTarget - stats.totalSaved))}</span></div>
          </div>
        </div>

        <div className="glass p-5 lg:col-span-2 fade-up fade-up-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Savings vs expenses</h3>
            <Legend items={[{ color: accent, label: "Savings" }, { color: "#f43f5e", label: "Expenses" }]} />
          </div>
          {series.every((s) => s.savings === 0 && s.expenses === 0) ? (
            <p className="text-sm text-muted py-10 text-center">No savings or expenses logged yet. Head to the Savings page to start.</p>
          ) : (
            <Bars data={series.map((s) => ({ label: s.label, values: [{ color: accent, value: s.savings }, { color: "#f43f5e", value: s.expenses }] }))} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass p-5 fade-up fade-up-3">
          <SectionHeaderBreak title="Upcoming deadlines" icon={<CalendarClock size={18} />} />
          {stats.upcoming.length === 0 && stats.overdue.length === 0 ? (
            <p className="text-sm text-muted">No deadlines in the next 2 weeks. 🎉</p>
          ) : (
            <div className="space-y-2">
              {[...stats.overdue, ...stats.upcoming].slice(0, 5).map((g) => {
                const d = daysUntil(g.deadline)!;
                return (
                  <Link key={g.id} href="/goals" className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-[var(--surface)]">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{g.title}</div>
                      <div className="text-xs text-muted">{formatDate(g.deadline)}</div>
                    </div>
                    <Badge tone={d < 0 ? "var(--danger)" : "var(--warning)"}>{d < 0 ? `${Math.abs(d)}d late` : `${d}d left`}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass p-5 fade-up fade-up-3">
          <SectionHeaderBreak title="Needs attention" icon={<AlertTriangle size={18} />} />
          {stats.abandoned.length === 0 ? (
            <p className="text-sm text-muted">All goals have healthy momentum. 👍</p>
          ) : (
            <div className="space-y-2">
              {stats.abandoned.slice(0, 5).map((g) => (
                <Link key={g.id} href="/goals" className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-[var(--surface)]">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{g.title}</div>
                    <div className="text-xs text-muted">Only {g.progress ?? 0}% done</div>
                  </div>
                  <Badge tone="var(--danger)">stalled</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/assistant" className="glass p-5 hover-lift fade-up fade-up-4 block" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 16%, transparent), transparent)` }}>
          <div className="text-4xl mb-2 floaty inline-block">{prefs.avatar || "✨"}</div>
          <h3 className="font-bold">{prefs.aiName || "Chloe"} says</h3>
          <p className="text-sm text-soft mt-1">
            {stats.overallProgress >= 75
              ? `You're ${stats.overallProgress}% there — the finish line is close. Let's push!`
              : stats.activeGoals === 0
                ? "Let's set your first goal together. What matters most right now?"
                : `You're ${stats.overallProgress}% toward your goals. Ask me what to focus on this month.`}
          </p>
          <span className="btn btn-sm btn-primary mt-3">Chat with {prefs.aiName || "Chloe"} <Sparkles size={14} /></span>
        </Link>
      </div>

      <div className="fade-up fade-up-4">
        <SectionHeader title="Recent products" subtitle="Your latest tracked purchases" icon={<ShoppingBag size={18} />} action={<Link href="/purchases" className="btn btn-ghost btn-sm">View all</Link>} />
        {recentPurchases.length === 0 ? (
          <EmptyState icon="🛒" title="No products yet" subtitle="Add products to your wishlist and start tracking prices." action={<Link href="/purchases" className="btn btn-primary btn-sm">Add a product</Link>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentPurchases.map((p) => (
              <div key={p.id} className="glass p-4">
                <div className="text-xs text-muted">{p.category}</div>
                <div className="font-semibold text-sm mt-0.5 truncate">{p.productName}</div>
                <div className="text-lg font-bold mt-1">{money(toNum(p.currentPrice) || toNum(p.desiredPrice))}</div>
                <div className="mt-2"><Badge>{p.status}</Badge></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeaderBreak({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <h3 className="font-bold">{title}</h3>
    </div>
  );
}
