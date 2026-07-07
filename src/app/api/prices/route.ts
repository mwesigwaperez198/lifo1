import { NextRequest } from "next/server";
import { db } from "@/db";
import { productPrices, purchases } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { clampText } from "@/lib/security";
import { toNum } from "@/lib/format";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const purchaseId = Number(req.nextUrl.searchParams.get("purchaseId"));
  if (!purchaseId) return bad("purchaseId is required.");

  const own = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, purchaseId), eq(purchases.userId, user.id)))
    .limit(1);
  if (!own[0]) return bad("Item not found.", 404);

  const rows = await db
    .select()
    .from(productPrices)
    .where(eq(productPrices.purchaseId, purchaseId));
  const prices = rows.map((r) => ({ ...r, price: toNum(r.price) }));
  const values = prices.map((p) => p.price).filter((v) => v > 0);
  const stats =
    values.length > 0
      ? {
          lowest: Math.min(...values),
          highest: Math.max(...values),
          average: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100,
          count: values.length,
          bestStore: prices.reduce((a, c) => (c.price < a.price ? c : a)).store,
        }
      : { lowest: 0, highest: 0, average: 0, count: 0, bestStore: null };

  return ok({ prices, stats, purchase: own[0] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const b = await req.json().catch(() => ({}));
  const purchaseId = Number(b.purchaseId);
  const price = Math.max(0, toNum(b.price));
  const store = clampText(b.store, 80) || "Store";
  if (!purchaseId || price <= 0) return bad("A valid purchaseId and price are required.");

  const own = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, purchaseId), eq(purchases.userId, user.id)))
    .limit(1);
  if (!own[0]) return bad("Item not found.", 404);

  const [row] = await db
    .insert(productPrices)
    .values({ purchaseId, store, price: String(price), url: b.url ? clampText(b.url, 500) : null })
    .returning();
  // keep currentPrice synced with the latest recorded price
  await db.update(purchases).set({ currentPrice: String(price) }).where(eq(purchases.id, purchaseId));
  await logActivity({ userId: user.id, action: "price_add", entity: "purchase", entityId: purchaseId });
  return ok({ price: row }, 201);
}
