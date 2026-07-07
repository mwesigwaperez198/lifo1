import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, goals, purchases, savings, activityLogs } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { SectionHeader, StatCard, EmptyState } from "@/components/Glass";
import { formatDate, timeAgo, money, toNum } from "@/lib/format";
import { Shield, Users, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Admin Panel" subtitle="Restricted area." icon={<Shield size={18} />} />
        <EmptyState icon="🚫" title="Access denied" subtitle="You need administrator privileges to view this page." />
      </div>
    );
  }

  const [allUsers, logs, goalCount, purchaseCount, savingSum] = await Promise.all([
    db
      .select({ id: users.id, username: users.username, email: users.email, fullName: users.fullName, avatar: users.avatar, role: users.role, status: users.status, createdAt: users.createdAt, lastLoginAt: users.lastLoginAt })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(60),
    db.select({ c: sql<number>`count(*)::int` }).from(goals),
    db.select({ c: sql<number>`count(*)::int` }).from(purchases),
    db.select({ s: sql<number>`coalesce(sum(amount),0)::float` }).from(savings),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin Panel" subtitle="Platform analytics, user management & security monitoring." icon={<Shield size={18} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Users" value={allUsers.length} tone="var(--accent)" />
        <StatCard icon="🎯" label="Goals" value={goalCount[0]?.c ?? 0} tone="#8b5cf6" />
        <StatCard icon="🛒" label="Purchases" value={purchaseCount[0]?.c ?? 0} tone="#ec4899" />
        <StatCard icon="💰" label="Total saved" value={money(savingSum[0]?.s ?? 0)} tone="#10b981" />
      </div>

      <div className="glass p-5 fade-up">
        <h3 className="font-bold flex items-center gap-2 mb-3"><Users size={16} /> User management</h3>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b" style={{ borderColor: "var(--border)" }}>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2">Last login</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{u.avatar || "🙂"}</span>
                      <div>
                        <div className="font-semibold">{u.fullName}</div>
                        <div className="text-xs text-muted">@{u.username} · {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3"><span className="chip">{u.role}</span></td>
                  <td className="py-2.5 pr-3">
                    <span className="chip" style={u.status === "active" ? { color: "var(--success)" } : { color: "var(--danger)" }}>● {u.status}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-soft">{formatDate(u.createdAt)}</td>
                  <td className="py-2.5 text-soft">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass p-5 fade-up">
        <h3 className="font-bold flex items-center gap-2 mb-3"><Activity size={16} /> Activity log</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto no-scrollbar">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-2)" }}>{l.action}</span>
                  {l.entity && <span className="text-muted text-xs truncate">{l.entity}{l.entityId ? ` #${l.entityId}` : ""}</span>}
                </div>
                <span className="text-xs text-muted shrink-0">{l.ip || "—"} · {timeAgo(l.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
