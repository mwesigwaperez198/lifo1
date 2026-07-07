import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserStats } from "@/lib/data";
import { SectionHeader, EmptyState, StatCard } from "@/components/Glass";
import { CreateGoalButton, GoalCard } from "@/components/Goals";
import { money } from "@/lib/format";
import { Target, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [allGoals, stats] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, user.id)).orderBy(desc(goals.createdAt)),
    getUserStats(user.id),
  ]);

  const active = allGoals.filter((g) => g.status === "active");
  const completed = allGoals.filter((g) => g.status === "completed");
  const other = allGoals.filter((g) => g.status !== "active" && g.status !== "completed");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Goals"
        subtitle="Define what you're working toward and track every step."
        icon={<Target size={18} />}
        action={<CreateGoalButton />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🎯" label="Active" value={active.length} tone="#8b5cf6" />
        <StatCard icon="✅" label="Completed" value={completed.length} tone="#10b981" />
        <StatCard icon="💰" label="Target total" value={money(stats.totalTarget)} tone="#f59e0b" />
        <StatCard icon="📈" label="Funded" value={`${stats.overallProgress}%`} tone="var(--accent)" />
      </div>

      {allGoals.length === 0 ? (
        <EmptyState icon="🎯" title="No goals yet" subtitle="Create your first goal and start building momentum. Chloe will help you plan and prioritise." action={<CreateGoalButton />} />
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="font-bold mb-3 flex items-center gap-2"><Clock size={16} className="text-muted" /> Active ({active.length})</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {active.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="font-bold mb-3 flex items-center gap-2"><CheckCircle2 size={16} style={{ color: "var(--success)" }} /> Completed ({completed.length})</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {completed.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
          {other.length > 0 && (
            <div>
              <h2 className="font-bold mb-3 text-muted">Archived</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {other.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
