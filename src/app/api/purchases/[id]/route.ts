import { NextRequest } from "next/server";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { clampText } from "@/lib/security";
import { toNum } from "@/lib/format";

const PRIOS = ["high", "medium", "low"];
const STATUSES = ["wishlist", "planned", "bought"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const { id } = await ctx.params;
  const b = await req.json().catch(() => ({}));

  const existing = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, Number(id)), eq(purchases.userId, user.id)))
    .limit(1);
  if (!existing[0]) return bad("Item not found.", 404);

  const updates: Record<string, unknown> = {};
  if (b.productName !== undefined) updates.productName = clampText(b.productName, 160);
  if (b.image !== undefined) updates.image = b.image ? clampText(b.image, 500) : null;
  if (b.category !== undefined) updates.category = clampText(b.category, 50) || "General";
  if (b.desiredPrice !== undefined) updates.desiredPrice = String(Math.max(0, toNum(b.desiredPrice)));
  if (b.currentPrice !== undefined) updates.currentPrice = String(Math.max(0, toNum(b.currentPrice)));
  if (b.link !== undefined) updates.link = b.link ? clampText(b.link, 500) : null;
  if (b.deadline !== undefined) updates.deadline = b.deadline || null;
  if (b.priority !== undefined) updates.priority = PRIOS.includes(b.priority) ? b.priority : "medium";
  if (b.status !== undefined) updates.status = STATUSES.includes(b.status) ? b.status : "wishlist";
  if (b.notes !== undefined) updates.notes = clampText(b.notes, 1000);

  const [updated] = await db
    .update(purchases)
    .set(updates)
    .where(eq(purchases.id, Number(id)))
    .returning();
  await logActivity({ userId: user.id, action: "purchase_update", entity: "purchase", entityId: id });
  return ok({ purchase: updated });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const { id } = await ctx.params;
  await db.delete(purchases).where(and(eq(purchases.id, Number(id)), eq(purchases.userId, user.id)));
  await logActivity({ userId: user.id, action: "purchase_delete", entity: "purchase", entityId: id });
  return ok({ ok: true });
}
