import { db } from "@/db";
import { savings, expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserStats, getMonthlySeries } from "@/lib/data";
import { SectionHeader, StatCard, EmptyState } from "@/components/Glass";
import { Bars, Legend } from "@/components/Charts";
import { SavingsButton, ExpenseButton, DeleteRow } from "@/components/Finance";
import { money, formatDate, toNum } from "@/lib/format";
import { PiggyBank } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [savRows, expRows, stats, series] = await Promise.all([
    db.select().from(savings).where(eq(savings.userId, user.id)).orderBy(desc(savings.createdAt)),
    db.select().from(expenses).where(eq(expenses.userId, user.id)).orderBy(desc(expenses.date)),
    getUserStats(user.id),
    getMonthlySeries(user.id, 6),
  ]);

  const totalSaved = savRows.reduce((s, r) => s + toNum(r.amount), 0);
  const totalExpenses = expRows.reduce((s, r) => s + toNum(r.amount), 0);
  const net = totalSaved - totalExpenses;

  // forecast
  const income = stats.monthlyIncome;
  const byMonth = new Map<string, number>();
  for (const s of savRows) {
    const k = `${s.year}-${s.month}`;
    byMonth.set(k, (byMonth.get(k) ?? 0) + toNum(s.amount));
  }
  const avg3 = byMonth.size ? [...byMonth.values()].sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, byMonth.size) : 0;
  const capacity = Math.max(income * 0.2, avg3);
  const remaining = Math.max(0, stats.totalTarget - stats.totalSaved);
  const months = capacity > 0 ? Math.ceil(remaining / capacity) : null;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Savings & Budget"
        subtitle="Track income, expenses and watch your money grow toward each goal."
        icon={<PiggyBank size={18} />}
        action={
          <div className="flex gap-2">
            <ExpenseButton />
            <SavingsButton />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="💵" label="Total saved" value={money(totalSaved)} tone="#10b981" />
        <StatCard icon="🧾" label="Total expenses" value={money(totalExpenses)} tone="#f43f5e" />
        <StatCard icon="⚖️" label="Net" value={money(net)} tone={net >= 0 ? "var(--success)" : "var(--danger)"} />
        <StatCard icon="💼" label="Monthly income" value={money(income)} tone="var(--accent)" />
      </div>

      {capacity > 0 && remaining > 0 && (
        <div className="glass p-4 fade-up" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent)" }}>
          <h3 className="font-bold">🔮 Financial forecast</h3>
          <p className="text-sm text-soft mt-1">
            At your current pace (~{money(capacity)}/mo available), you&apos;ll fully fund your active goals in <b>{months} month{months === 1 ? "" : "s"}</b> ({money(remaining)} remaining).
          </p>
        </div>
      )}

      <div className="glass p-4 fade-up">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Monthly trend</h3>
          <Legend items={[{ color: "var(--accent)", label: "Savings" }, { color: "#f43f5e", label: "Expenses" }]} />
        </div>
        {series.every((s) => s.savings === 0 && s.expenses === 0) ? (
          <p className="text-sm text-muted py-8 text-center">Log some savings or expenses to see your trend.</p>
        ) : (
          <Bars data={series.map((s) => ({ label: s.label, values: [{ color: "var(--accent)", value: s.savings }, { color: "#f43f5e", value: s.expenses }] }))} />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div>
          <h3 className="font-bold mb-3">Savings log</h3>
          {savRows.length === 0 ? (
            <EmptyState icon="💰" title="No savings yet" subtitle="Log your first deposit to start building." />
          ) : (
            <div className="space-y-2">
              {savRows.slice(0, 15).map((s) => (
                <div key={s.id} className="glass p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{money(s.amount)}</div>
                    <div className="text-xs text-muted">{s.note || "Deposit"} · {formatDate(s.createdAt)}</div>
                  </div>
                  <DeleteRow kind="savings" id={s.id} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold mb-3">Expenses log</h3>
          {expRows.length === 0 ? (
            <EmptyState icon="🧾" title="No expenses yet" subtitle="Track spending to understand your habits." />
          ) : (
            <div className="space-y-2">
              {expRows.slice(0, 15).map((e) => (
                <div key={e.id} className="glass p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{money(e.amount)}</div>
                    <div className="text-xs text-muted">{e.category}{e.description ? ` · ${e.description}` : ""} · {formatDate(e.date)}</div>
                  </div>
                  <DeleteRow kind="expenses" id={e.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
