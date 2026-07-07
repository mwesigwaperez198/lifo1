import { db } from "@/db";
import { users, goals, purchases, savings, activityLogs, sessions } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized } from "@/lib/api-helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin") return bad("Admin access required.", 403);

  const [allUsers, logs, activeSessions] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        avatar: users.avatar,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(100),
    db.select({ count: sql<number>`count(*)::int` }).from(sessions).where(eq(sessions.userId, user.id)),
  ]);

  const [goalCount, purchaseCount, savingSum, userCount] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(goals),
    db.select({ c: sql<number>`count(*)::int` }).from(purchases),
    db.select({ s: sql<number>`coalesce(sum(amount),0)::float` }).from(savings),
    db.select({ c: sql<number>`count(*)::int` }).from(users),
  ]);

  return ok({
    users: allUsers,
    logs,
    totals: {
      users: userCount[0]?.c ?? 0,
      goals: goalCount[0]?.c ?? 0,
      purchases: purchaseCount[0]?.c ?? 0,
      totalSavings: savingSum[0]?.s ?? 0,
      activeSessions: activeSessions[0]?.count ?? 0,
    },
  });
}
