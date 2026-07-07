import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SectionHeader, EmptyState, StatCard } from "@/components/Glass";
import { CreatePurchaseButton, PurchaseCard } from "@/components/Purchases";
import { money, toNum } from "@/lib/format";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const items = await db.select().from(purchases).where(eq(purchases.userId, user.id)).orderBy(desc(purchases.createdAt));

  const wishlist = items.filter((p) => p.status === "wishlist");
  const planned = items.filter((p) => p.status === "planned");
  const bought = items.filter((p) => p.status === "bought");
  const wishlistValue = items.filter((p) => p.status !== "bought").reduce((s, p) => s + (toNum(p.currentPrice) || toNum(p.desiredPrice)), 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Purchase Planner"
        subtitle="Your smart wishlist — track products, target prices and the best time to buy."
        icon={<ShoppingBag size={18} />}
        action={<CreatePurchaseButton />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💖" label="Wishlist" value={wishlist.length} tone="#ec4899" />
        <StatCard icon="📋" label="Planned" value={planned.length} tone="#f59e0b" />
        <StatCard icon="✅" label="Bought" value={bought.length} tone="#10b981" />
        <StatCard icon="🛍️" label="Wishlist value" value={money(wishlistValue)} tone="var(--accent)" />
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🛒" title="Your wishlist is empty" subtitle="Add products you're eyeing, set a target price, and let the Price Tracker watch for drops." action={<CreatePurchaseButton />} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((p) => <PurchaseCard key={p.id} purchase={p} />)}
        </div>
      )}
    </div>
  );
}
