// Server-side data aggregation, achievements engine, and notifications.
import { db } from "@/db";
import {
  goals,
  purchases,
  savings,
  expenses,
  achievements,
  notifications,
  aiConversations,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { ACHIEVEMENTS } from "./constants";
import { toNum, daysUntil } from "./format";

const DAY = 1000 * 60 * 60 * 24;

export interface DashboardStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  abandonedGoals: number;
  overallProgress: number;
  totalTarget: number;
  totalSaved: number;
  totalSavings: number;
  totalExpenses: number;
  monthlyIncome: number;
  netSaved: number;
  achievementCount: number;
  purchaseCount: number;
  wishlistCount: number;
  boughtCount: number;
  upcoming: (typeof goals.$inferSelect)[];
  overdue: (typeof goals.$inferSelect)[];
  abandoned: (typeof goals.$inferSelect)[];
}

export async function getUserStats(userId: number): Promise<DashboardStats> {
  const [goalRows, purchaseRows, savingRows, expenseRows, achRows] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)),
    db.select().from(purchases).where(eq(purchases.userId, userId)),
    db.select().from(savings).where(eq(savings.userId, userId)),
    db.select().from(expenses).where(eq(expenses.userId, userId)),
    db.select().from(achievements).where(eq(achievements.userId, userId)),
  ]);

  const activeGoals = goalRows.filter((g) => g.status === "active");
  const completed = goalRows.filter((g) => g.status === "completed");
  const totalTarget = activeGoals.reduce((s, g) => s + toNum(g.targetAmount), 0);
  const totalSavedGoals = activeGoals.reduce((s, g) => s + toNum(g.currentAmount), 0);
  const totalSavings = savingRows.reduce((s, r) => s + toNum(r.amount), 0);
  const totalExpenses = expenseRows.reduce((s, r) => s + toNum(r.amount), 0);

  const upcoming = activeGoals.filter((g) => {
    const d = daysUntil(g.deadline);
    return d !== null && d >= 0 && d <= 14;
  });
  const overdue = activeGoals.filter((g) => {
    const d = daysUntil(g.deadline);
    return d !== null && d < 0;
  });
  const abandoned = activeGoals.filter(
    (g) => (g.progress ?? 0) < 25 && Date.now() - new Date(g.createdAt).getTime() > 14 * DAY
  );

  const incomeRows = await db.select({ mi: users.monthlyIncome }).from(users).where(eq(users.id, userId));

  return {
    totalGoals: goalRows.length,
    activeGoals: activeGoals.length,
    completedGoals: completed.length,
    abandonedGoals: abandoned.length,
    overallProgress: totalTarget > 0 ? Math.round((totalSavedGoals / totalTarget) * 100) : 0,
    totalTarget,
    totalSaved: totalSavedGoals,
    totalSavings,
    totalExpenses,
    monthlyIncome: toNum(incomeRows[0]?.mi),
    netSaved: totalSavings - totalExpenses,
    achievementCount: achRows.length,
    purchaseCount: purchaseRows.length,
    wishlistCount: purchaseRows.filter((p) => p.status === "wishlist").length,
    boughtCount: purchaseRows.filter((p) => p.status === "bought").length,
    upcoming,
    overdue,
    abandoned,
  };
}

/** Evaluate the whole achievement catalogue and grant anything newly earned. */
export async function grantAchievements(userId: number) {
  const [goalRows, purchaseRows, savingRows, expenseRows, convRows, userRows] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)),
    db.select().from(purchases).where(eq(purchases.userId, userId)),
    db.select().from(savings).where(eq(savings.userId, userId)),
    db.select().from(expenses).where(eq(expenses.userId, userId)),
    db.select().from(aiConversations).where(eq(aiConversations.userId, userId)),
    db.select({ mi: users.monthlyIncome }).from(users).where(eq(users.id, userId)),
  ]);

  const totalSavings = savingRows.reduce((s, r) => s + toNum(r.amount), 0);
  const completedGoals = goalRows.filter((g) => g.status === "completed").length;
  const aiUserTurns = convRows.filter((c) => c.role === "user").length;
  const income = toNum(userRows[0]?.mi);

  const earned: string[] = [];
  if (goalRows.length >= 1) earned.push("first_goal");
  if (goalRows.length >= 5) earned.push("five_goals");
  if (goalRows.length >= 10) earned.push("ten_goals");
  if (completedGoals >= 1) earned.push("first_completion");
  if (completedGoals >= 5) earned.push("five_completions");
  if (totalSavings >= 100) earned.push("saver_100");
  if (totalSavings >= 1000) earned.push("saver_1000");
  if (purchaseRows.length >= 1) earned.push("first_purchase");
  if (purchaseRows.length >= 10) earned.push("ten_purchases");
  if (aiUserTurns >= 10) earned.push("chatter");
  if (expenseRows.length >= 10) earned.push("budget_master");
  if (income > 0) earned.push("planner");

  const existing = await db.select({ code: achievements.code }).from(achievements).where(eq(achievements.userId, userId));
  const have = new Set(existing.map((e) => e.code));
  const toAdd = ACHIEVEMENTS.filter((a) => earned.includes(a.code) && !have.has(a.code));

  for (const a of toAdd) {
    await db.insert(achievements).values({
      userId,
      code: a.code,
      title: a.title,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
    });
    await db.insert(notifications).values({
      userId,
      type: "achievement",
      title: `Achievement unlocked: ${a.title}`,
      message: a.description,
      link: "/achievements",
    });
  }
  return toAdd;
}

export interface MonthPoint {
  label: string;
  savings: number;
  expenses: number;
}

export async function getMonthlySeries(userId: number, months = 6): Promise<MonthPoint[]> {
  const rows = await db.select().from(savings).where(eq(savings.userId, userId));
  const expRows = await db.select().from(expenses).where(eq(expenses.userId, userId));

  const now = new Date();
  const buckets: (MonthPoint & { key: string })[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ label: d.toLocaleDateString("en-US", { month: "short" }), savings: 0, expenses: 0, key: `${d.getFullYear()}-${d.getMonth()}` });
  }

  for (const r of rows) {
    const key = `${r.year}-${r.month - 1}`;
    const b = buckets.find((x) => x.key === key);
    if (b) b.savings += toNum(r.amount);
  }
  for (const r of expRows) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = buckets.find((x) => x.key === key);
    if (b) b.expenses += toNum(r.amount);
  }
  return buckets.map(({ label, savings, expenses }) => ({ label, savings, expenses }));
}

/** Generate proactive alerts (deadlines, price drops, abandoned goals). Idempotent. */
export async function refreshNotifications(userId: number) {
  const [allGoals, purchaseRows, existing] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)),
    db.select().from(purchases).where(eq(purchases.userId, userId)),
    db.select({ title: notifications.title }).from(notifications).where(eq(notifications.userId, userId)),
  ]);
  const have = new Set(existing.map((e) => e.title));
  const toInsert: (typeof notifications.$inferInsert)[] = [];

  for (const g of allGoals.filter((g) => g.status === "active" && g.deadline)) {
    const d = daysUntil(g.deadline);
    if (d === null) continue;
    if (d < 0) {
      const title = `⚠️ Overdue: ${g.title}`;
      if (!have.has(title))
        toInsert.push({ userId, type: "deadline", title, message: "This goal passed its deadline — time to reassess.", link: "/goals" });
    } else if (d <= 7) {
      const title = `⏰ Due soon: ${g.title}`;
      if (!have.has(title))
        toInsert.push({ userId, type: "reminder", title, message: `Only ${d} day(s) left until the deadline.`, link: "/goals" });
    }
  }

  for (const p of purchaseRows.filter((p) => p.status !== "bought")) {
    const desired = toNum(p.desiredPrice);
    const current = toNum(p.currentPrice);
    if (desired > 0 && current > 0 && current <= desired * 0.9) {
      const title = `📉 Price drop: ${p.productName}`;
      if (!have.has(title))
        toInsert.push({
          userId,
          type: "price_drop",
          title,
          message: `Now at $${current.toFixed(2)} (target $${desired.toFixed(2)}) — good time to buy.`,
          link: "/purchases",
        });
    }
  }

  if (toInsert.length) await db.insert(notifications).values(toInsert);
  return toInsert.length;
}
