import { NextRequest } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { clampText } from "@/lib/security";
import { toNum } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const rows = await db.select().from(goals).where(eq(goals.userId, user.id));
  return ok({ goals: rows });
}

const PRIOS = ["high", "medium", "low"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const b = await req.json().catch(() => ({}));
  const title = clampText(b.title, 120);
  if (!title) return bad("Goal title is required.");

  const target = Math.max(0, toNum(b.targetAmount));
  const current = Math.max(0, toNum(b.currentAmount));
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : Math.min(100, Math.round(toNum(b.progress)));

  const [goal] = await db
    .insert(goals)
    .values({
      userId: user.id,
      title,
      description: clampText(b.description, 1000),
      category: clampText(b.category, 50) || "Custom",
      priority: PRIOS.includes(b.priority) ? b.priority : "medium",
      targetAmount: String(target),
      currentAmount: String(current),
      deadline: b.deadline || null,
      status: "active",
      progress,
    })
    .returning();

  await logActivity({ userId: user.id, action: "goal_create", entity: "goal", entityId: goal.id });
  return ok({ goal }, 201);
}
