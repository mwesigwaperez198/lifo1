import { db } from "@/db";
import { achievements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { grantAchievements } from "@/lib/data";
import { ACHIEVEMENTS, TIER_META } from "@/lib/constants";
import { SectionHeader, StatCard } from "@/components/Glass";
import { Trophy, Lock, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await grantAchievements(user.id).catch(() => {});
  const earned = await db.select().from(achievements).where(eq(achievements.userId, user.id)).orderBy(desc(achievements.earnedAt));
  const earnedMap = new Map(earned.map((e) => [e.code, e]));
  const earnedCount = earned.length;
  const total = ACHIEVEMENTS.length;
  const level = Math.max(1, Math.floor(earnedCount / 2) + 1);
  const progress = Math.round((earnedCount / total) * 100);

  const tierCount: Record<string, number> = {};
  for (const e of earned) {
    const t = e.tier ?? "bronze";
    tierCount[t] = (tierCount[t] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Achievements" subtitle="Earn badges, climb levels and celebrate your progress." icon={<Trophy size={18} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏅" label="Badges earned" value={`${earnedCount}/${total}`} tone="#f59e0b" />
        <StatCard icon="⭐" label="Level" value={level} sub="Explorer tier" tone="var(--accent)" />
        <StatCard icon="💎" label="Platinum" value={tierCount.platinum ?? 0} tone="#7dd3fc" />
        <StatCard icon="🥇" label="Gold" value={tierCount.gold ?? 0} tone="#ffd700" />
      </div>

      <div className="glass p-5 fade-up">
        <div className="flex justify-between text-sm mb-2"><span className="font-semibold">Collection progress</span><span className="text-muted">{progress}%</span></div>
        <div className="bar"><span style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((a, i) => {
          const got = earnedMap.get(a.code);
          const tier = TIER_META[a.tier];
          return (
            <div key={a.code} className={`glass p-5 text-center fade-up fade-up-${(i % 4) + 1} ${got ? "hover-lift" : ""}`} style={got ? { borderColor: `color-mix(in srgb, ${tier.color} 40%, transparent)`, background: `color-mix(in srgb, ${tier.color} 9%, var(--glass-bg))` } : { opacity: 0.55 }}>
              <div className={`text-5xl mb-2 ${got ? "floaty" : "grayscale"}`}>{got ? a.icon : "🔒"}</div>
              <h3 className="font-bold">{a.title}</h3>
              <p className="text-xs text-soft mt-1">{a.description}</p>
              <div className="mt-3">
                {got ? (
                  <span className="chip" style={{ background: `color-mix(in srgb, ${tier.color} 22%, transparent)`, color: tier.color, borderColor: `color-mix(in srgb, ${tier.color} 40%, transparent)` }}>
                    <Award size={12} /> {tier.label} · earned
                  </span>
                ) : (
                  <span className="chip"><Lock size={12} /> Locked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {earnedCount > 0 && (
        <div className="glass p-8 text-center fade-up" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent), transparent)" }}>
          <div className="text-6xl mb-3 floaty inline-block">📜</div>
          <h2 className="text-2xl font-bold">Certificate of Progress</h2>
          <p className="text-soft mt-1">Awarded to <b>{user.fullName}</b> for unlocking {earnedCount} achievement{earnedCount === 1 ? "" : "s"} and reaching Level {level}.</p>
          <p className="text-xs text-muted mt-3">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      )}
    </div>
  );
}
