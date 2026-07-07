import { db } from "@/db";
import { purchases, productPrices } from "@/db/schema";
import { eq, inArray, desc, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SectionHeader, EmptyState, Badge } from "@/components/Glass";
import { Line } from "@/components/Charts";
import { AddPriceButton } from "@/components/Purchases";
import { money, toNum, formatDate } from "@/lib/format";
import { TrendingDown, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statsFor(prices: (typeof productPrices.$inferSelect)[]) {
  if (!prices.length) return null;
  const vals = prices.map((p) => toNum(p.price));
  const lowest = Math.min(...vals);
  const highest = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const best = prices.reduce((a, c) => (toNum(c.price) < toNum(a.price) ? c : a));
  return { lowest, highest, avg, best, count: vals.length };
}

export default async function TrackerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const items = await db.select().from(purchases).where(eq(purchases.userId, user.id)).orderBy(desc(purchases.createdAt));
  const ids = items.map((i) => i.id);
  const priceRows = ids.length
    ? await db.select().from(productPrices).where(inArray(productPrices.purchaseId, ids)).orderBy(asc(productPrices.recordedAt))
    : [];
  const byPurchase = new Map<number, (typeof productPrices.$inferSelect)[]>();
  for (const pr of priceRows) {
    const arr = byPurchase.get(pr.purchaseId) ?? [];
    arr.push(pr);
    byPurchase.set(pr.purchaseId, arr);
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Price Tracker" subtitle="Compare stores, watch price history and grab the best deals." icon={<TrendingDown size={18} />} action={<Link href="/purchases" className="btn btn-ghost btn-sm">+ Add products</Link>} />

      {items.length === 0 ? (
        <EmptyState icon="📉" title="Nothing to track yet" subtitle="Add products in the Purchase Planner, then log prices from different stores to see the history graph." action={<Link href="/purchases" className="btn btn-primary btn-sm">Go to planner</Link>} />
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const prices = byPurchase.get(p.id) ?? [];
            const st = statsFor(prices);
            const desired = toNum(p.desiredPrice);
            return (
              <div key={p.id} className="glass p-4 fade-up">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-bold">{p.productName}</h3>
                    <div className="text-xs text-soft mt-0.5">Target: {money(desired)} · Latest: {money(toNum(p.currentPrice))}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {st && st.lowest <= desired && desired > 0 && <Badge tone="var(--success)">↓ below target</Badge>}
                    {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><ExternalLink size={13} /> View</a>}
                    <AddPriceButton purchaseId={p.id} name={p.productName} />
                  </div>
                </div>

                {st ? (
                  <div className="grid lg:grid-cols-3 gap-3 mt-4">
                    <div className="lg:col-span-2">
                      <Line
                        labels={prices.map((pr) => new Date(pr.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}
                        series={[{ color: "var(--accent)", values: prices.map((pr) => toNum(pr.price)) }]}
                        height={150}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <Stat label="Lowest" value={money(st.lowest)} tone="var(--success)" />
                      <Stat label="Highest" value={money(st.highest)} tone="var(--danger)" />
                      <Stat label="Average" value={money(st.avg)} />
                      <Stat label="Best store" value={st.best.store} />
                      <div className="col-span-2 text-xs text-muted">{st.count} price record(s) · best on {formatDate(st.best.recordedAt)}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted mt-3">No prices logged yet. Click “Add price” to start tracking.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="glass-soft p-3">
      <div className="text-[0.65rem] uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div className="font-bold mt-0.5" style={tone ? { color: tone } : undefined}>{value}</div>
    </div>
  );
}
