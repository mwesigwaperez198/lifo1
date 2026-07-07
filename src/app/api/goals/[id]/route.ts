import { NextRequest } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { clampText } from "@/lib/security";
import { toNum } from "@/lib/format";

const STATUSES = ["active", "completed", "paused", "abandoned"];
const PRIOS = ["high", "medium", "low"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const { id } = await ctx.params;
  const b = await req.json().catch(() => ({}));

  const existing = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, Number(id)), eq(goals.userId, user.id)))
    .limit(1);
  if (!existing[0]) return bad("Goal not found.", 404);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (b.title !== undefined) updates.title = clampText(b.title, 120);
  if (b.description !== undefined) updates.description = clampText(b.description, 1000);
  if (b.category !== undefined) updates.category = clampText(b.category, 50) || "Custom";
  if (b.priority !== undefined) updates.priority = PRIOS.includes(b.priority) ? b.priority : "medium";
  if (b.deadline !== undefined) updates.deadline = b.deadline || null;
  if (b.targetAmount !== undefined) updates.targetAmount = String(Math.max(0, toNum(b.targetAmount)));
  if (b.currentAmount !== undefined) {
    updates.currentAmount = String(Math.max(0, toNum(b.currentAmount)));
    const target = b.targetAmount !== undefined ? toNum(b.targetAmount) : toNum(existing[0].targetAmount);
    updates.progress = target > 0 ? Math.min(100, Math.round((toNum(b.currentAmount) / target) * 100)) : 0;
  }
  if (b.progress !== undefined) updates.progress = Math.min(100, Math.max(0, Math.round(toNum(b.progress))));
  if (b.status !== undefined && STATUSES.includes(b.status)) {
    updates.status = b.status;
    if (b.status === "completed") {
      updates.completedAt = new Date();
      updates.progress = 100;
    }
  }

  const [updated] = await db.update(goals).set(updates).where(eq(goals.id, Number(id))).returning();
  await logActivity({ userId: user.id, action: "goal_update", entity: "goal", entityId: id });
  return ok({ goal: updated });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const { id } = await ctx.params;
  await db.delete(goals).where(and(eq(goals.id, Number(id)), eq(goals.userId, user.id)));
  await logActivity({ userId: user.id, action: "goal_delete", entity: "goal", entityId: id });
  return ok({ ok: true });
}
