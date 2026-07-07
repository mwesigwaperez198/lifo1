// Chloe — the personalised AI life-assistant engine (server-only, rule-based).
import { db } from "@/db";
import {
  goals,
  purchases,
  savings,
  expenses,
  aiConversations,
  aiMemory,
  aiPreferences,
  aiLearningData,
  users,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { PERSONALITIES, personalityMeta } from "./constants";
import { toNum, money, daysUntil, formatDate } from "./format";

const DAY = 1000 * 60 * 60 * 24;

interface AiContext {
  user: typeof users.$inferSelect;
  prefs: typeof aiPreferences.$inferSelect | null;
  goals: (typeof goals.$inferSelect)[];
  purchases: (typeof purchases.$inferSelect)[];
  savings: (typeof savings.$inferSelect)[];
  expenses: (typeof expenses.$inferSelect)[];
  memory: (typeof aiMemory.$inferSelect)[];
  recent: (typeof aiConversations.$inferSelect)[];
}

export async function getAiContext(userId: number): Promise<AiContext> {
  const [userRows, prefRows, goalRows, purchaseRows, savingRows, expenseRows, memRows, convRows] =
    await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db.select().from(aiPreferences).where(eq(aiPreferences.userId, userId)).limit(1),
      db.select().from(goals).where(eq(goals.userId, userId)),
      db.select().from(purchases).where(eq(purchases.userId, userId)),
      db.select().from(savings).where(eq(savings.userId, userId)),
      db.select().from(expenses).where(eq(expenses.userId, userId)),
      db.select().from(aiMemory).where(eq(aiMemory.userId, userId)).orderBy(desc(aiMemory.updatedAt)),
      db
        .select()
        .from(aiConversations)
        .where(eq(aiConversations.userId, userId))
        .orderBy(desc(aiConversations.id))
        .limit(20),
    ]);
  return {
    user: userRows[0],
    prefs: prefRows[0] ?? null,
    goals: goalRows,
    purchases: purchaseRows,
    savings: savingRows,
    expenses: expenseRows,
    memory: memRows,
    recent: convRows.reverse(),
  };
}

export async function getOrCreatePrefs(userId: number) {
  const existing = await db.select().from(aiPreferences).where(eq(aiPreferences.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db.insert(aiPreferences).values({ userId }).returning();
  return created;
}

/* ----------------------------- memory helpers ---------------------------- */

async function remember(userId: number, key: string, value: string, category: string, importance = 5) {
  const existing = await db
    .select()
    .from(aiMemory)
    .where(and(eq(aiMemory.userId, userId), eq(aiMemory.memoryKey, key)))
    .limit(1);
  if (existing[0]) {
    await db
      .update(aiMemory)
      .set({ memoryValue: value, category, importance, updatedAt: new Date() })
      .where(eq(aiMemory.id, existing[0].id));
  } else {
    await db.insert(aiMemory).values({ userId, memoryKey: key, memoryValue: value, category, importance });
  }
}

function extractFacts(userId: number, message: string) {
  const m = message.trim();
  const facts: Promise<unknown>[] = [];
  let match: RegExpMatchArray | null;

  match = m.match(/(?:i want|i'm planning|i'd like|i need|gonna|going to|planning to)\s+(?:to\s+)?(?:buy|get|purchase|save up (?:for|to))\s+(.+)/i);
  if (match)
    facts.push(
      remember(
        userId,
        `want_${match[1].toLowerCase().slice(0, 40)}`,
        match[1].replace(/[.!?]+$/g, "").trim().slice(0, 120),
        "shopping_preference",
        7
      )
    );

  match = m.match(/(?:my )?(?:monthly )?(?:income|salary|pay|earnings)(?: is| of)?\s*\$?([\d,]+)/i);
  if (match) facts.push(remember(userId, "income", match[1].replace(/,/g, ""), "income_pattern", 8));

  match = m.match(/(?:budget|spending limit)(?: is| of)?\s*\$?([\d,]+)/i);
  if (match) facts.push(remember(userId, "budget", match[1].replace(/,/g, ""), "budget_habit", 7));

  match = m.match(/(?:my )?(?:favorite|favourite|preferred|love) (?:brand|store|product|company|thing)?(?: is|:)?\s+(.+)/i);
  if (match)
    facts.push(
      remember(
        userId,
        `favorite_${match[1].toLowerCase().slice(0, 30)}`,
        match[1].replace(/[.!?]+$/, "").trim().slice(0, 80),
        "favorite_brand",
        6
      )
    );

  match = m.match(/(?:save|saving|need)\s+\$?([\d,]+)\s*(?:for|to|toward|towards)\s+(.+)/i);
  if (match)
    facts.push(
      remember(
        userId,
        `saving_${match[2].toLowerCase().slice(0, 30)}`,
        `$${match[1].replace(/,/g, "")} for ${match[2]}`,
        "saving_target",
        8
      )
    );

  match = m.match(/(?:remind me (?:to|about)|don't forget to|don't forget)\s+(.+)/i);
  if (match)
    facts.push(
      remember(userId, `reminder_${Date.now()}`, match[1].replace(/[.!?]+$/, "").trim().slice(0, 120), "recurring_task", 6)
    );

  return Promise.all(facts);
}

/* ------------------------------ computations ----------------------------- */

function monthlyCapacity(ctx: AiContext): number {
  const income = toNum(ctx.user.monthlyIncome);
  const byMonth = new Map<string, number>();
  for (const s of ctx.savings) {
    const key = `${s.year}-${s.month}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + toNum(s.amount));
  }
  const monthlyVals = [...byMonth.values()].sort((a, b) => b - a).slice(0, 3);
  const avg = monthlyVals.length ? monthlyVals.reduce((s, v) => s + v, 0) / monthlyVals.length : 0;
  return Math.max(income * 0.2, avg);
}

function etaForGoal(goal: typeof goals.$inferSelect, cap: number): string {
  const remaining = toNum(goal.targetAmount) - toNum(goal.currentAmount);
  if (remaining <= 0) return "already fully funded 🎉";
  if (cap <= 0) return "unknown — set a monthly income or log savings so I can project a date";
  const months = Math.max(1, Math.ceil(remaining / cap));
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return `~${months} month(s) — around ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}

/* ------------------------------- personality ----------------------------- */

function voice(prefs: AiContext["prefs"]) {
  const slug = prefs?.personality ?? "friendly";
  const meta = personalityMeta(slug);
  const name = prefs?.aiName ?? "Chloe";
  const openers: Record<string, string[]> = {
    professional: ["Here is the analysis.", "Based on your data:", "Reviewing your progress —"],
    friendly: ["Great question!", "Happy to help! 💛", "Of course —"],
    motivational: ["Let's do this! 🔥", "You're on fire — here's the plan!", "Time to level up! ⚡"],
    strategic: ["Strategic view:", "Here's the optimal path:", "Step by step —"],
    minimalist: ["Short answer:", "Simply put —", "Here's the gist:"],
    coach: ["Listen up —", "Here's your action item:", "No excuses, let's go:"],
    mentor: ["Let me share a perspective:", "Reflect on this:", "From experience —"],
  };
  const closers: Record<string, string> = {
    professional: "",
    friendly: " I'm here whenever you need me. 😊",
    motivational: " You've absolutely got this! 💪",
    strategic: " Stay disciplined and revisit this weekly.",
    minimalist: "",
    coach: " Now go execute. 🎯",
    mentor: " Trust the process — growth takes time. 🌱",
  };
  const list = openers[slug] ?? openers.friendly;
  return {
    meta,
    name,
    open: list[Math.floor(Math.random() * list.length)],
    close: closers[slug] ?? "",
    identity: `I'm ${name}, your personal life-assistant — currently in my ${meta.name.toLowerCase()} mode. I learn your goals, savings and shopping habits so I can give you personalised, data-driven advice that gets sharper the more we talk.`,
  };
}

function recall(ctx: AiContext, message: string): string {
  const words = message.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  for (const mem of ctx.memory) {
    const v = mem.memoryValue.toLowerCase();
    if (words.some((w) => v.includes(w))) {
      const ago = Math.max(1, Math.round((Date.now() - new Date(mem.updatedAt).getTime()) / DAY));
      return `I remember you mentioned "${mem.memoryValue}" about ${ago} day(s) ago — I've kept that in mind. `;
    }
  }
  return "";
}

/* ------------------------------ intent engine ---------------------------- */

function detectIntent(message: string): string {
  const m = message.toLowerCase();
  if (/(^|\s)(hi|hello|hey|yo|howdy|good (morning|evening|afternoon))\b/.test(m)) return "greeting";
  if (/who are you|your name|what.{0,6}your name|what can you do|help me understand you/.test(m)) return "identity";
  if (/monthly report|yearly report|annual report|how am i doing|overall summary|progress report/.test(m)) return "report";
  if (/prioriti|focus on|what should i|most important|what.{0,5}next|tackle first/.test(m)) return "priorities";
  if (/when|predict|estimate|how long|reach|finish|achiev(e|ing)|complete/.test(m)) return "predict";
  if (/sav(e|ings|ing)|put aside|set aside|nest egg|emergency fund/.test(m)) return "savings";
  if (/budget|afford|income|spend|expense|money|cash/.test(m)) return "budget";
  if (/price|deal|discount|cheap|sale|drop|bargain/.test(m)) return "price";
  if (/buy|shop|purchase|wishlist|product|want (a|to get|the)/.test(m)) return "shopping";
  if (/abandon|forgot|stuck|behind|gave up|procrastinat/.test(m)) return "abandoned";
  if (/motivat|inspire|sad|tired|stressed|anxious|burnt|overwhelm/.test(m)) return "motivation";
  if (/goal|target|aim|dream/.test(m)) return "goals";
  if (/thank/.test(m)) return "thanks";
  return "default";
}

function buildReply(intent: string, message: string, ctx: AiContext): string {
  const v = voice(ctx.prefs);
  const active = ctx.goals.filter((g) => g.status === "active");
  const completed = ctx.goals.filter((g) => g.status === "completed");
  const cap = monthlyCapacity(ctx);
  const totalTarget = active.reduce((s, g) => s + toNum(g.targetAmount), 0);
  const totalSaved = active.reduce((s, g) => s + toNum(g.currentAmount), 0);
  const overall = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const totalSavings = ctx.savings.reduce((s, r) => s + toNum(r.amount), 0);
  const totalExpenses = ctx.expenses.reduce((s, r) => s + toNum(r.amount), 0);
  const mem = recall(ctx, message);
  const firstName = (ctx.user.fullName || "there").split(" ")[0];

  switch (intent) {
    case "greeting":
      return `${mem}Hi ${firstName}! I'm ${v.name}. You currently have ${active.length} active goal(s) and you're ${overall}% toward your targets overall. What would you like to work on today?${v.close}`;

    case "identity":
      return v.identity;

    case "thanks":
      return `Anytime, ${firstName}! That's exactly what I'm here for. 💛${v.close}`;

    case "priorities": {
      if (active.length === 0)
        return `${v.open} You don't have any active goals yet. Let's set one — what matters most to you right now?${v.close}`;
      const pr: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const ranked = [...active].sort((a, b) => {
        const da = daysUntil(a.deadline) ?? 9999;
        const dbd = daysUntil(b.deadline) ?? 9999;
        return pr[a.priority ?? "medium"] - pr[b.priority ?? "medium"] || da - dbd;
      });
      const lines = ranked
        .slice(0, 3)
        .map(
          (g, i) =>
            `${i + 1}. ${g.title} (${g.priority ?? "medium"} priority${g.deadline ? `, due ${formatDate(g.deadline)}` : ""}) — ${g.progress ?? 0}% done`
        )
        .join("\n");
      return `${mem}${v.open} I'd focus on these in order:\n${lines}\n\nKnocking out the high-priority, soonest-deadline items first creates the most momentum.${v.close}`;
    }

    case "predict": {
      if (active.length === 0)
        return `${v.open} No active goals to project yet. Create one with a target amount and I'll estimate when you'll reach it.${v.close}`;
      const lines = active.slice(0, 5).map((g) => `• ${g.title}: ${etaForGoal(g, cap)}`);
      return `${mem}${v.open} Based on your savings pace (~${money(cap)}/mo available), here's my projection:\n${lines.join("\n")}\n\n${cap <= 0 ? "Tip: log your monthly income so I can forecast precisely." : "Keep this pace and you'll hit these targets."}${v.close}`;
    }

    case "savings": {
      const suggestion = cap > 0 ? money(cap) : money(toNum(ctx.user.monthlyIncome) * 0.2 || 200);
      const income = toNum(ctx.user.monthlyIncome);
      return `${mem}${v.open} So far you've saved ${money(totalSavings)} across all records.\n• Recommended monthly target: ${suggestion}\n• 50/30/20 rule: aim to put ~20% of income (${money(income * 0.2)}) toward goals.\n• You're ${overall}% toward funding your active goals (${money(totalSaved)} of ${money(totalTarget)}).\n${cap <= 0 ? "Set your monthly income in Settings and I can sharpen these numbers." : ""}${v.close}`;
    }

    case "budget": {
      const income = toNum(ctx.user.monthlyIncome);
      const net = income - totalExpenses;
      const affordable = active.filter((g) => cap > 0 && toNum(g.targetAmount) - toNum(g.currentAmount) <= cap * 6);
      return `${mem}${v.open} Financial snapshot:\n• Logged income: ${money(income)}/mo\n• Logged expenses: ${money(totalExpenses)}\n• Net position: ${money(net)}\n• Affordable soon (within ~6 months at current pace): ${affordable.length ? affordable.map((g) => g.title).join(", ") : "none yet"}.\n${income === 0 ? "Set your monthly income for an accurate affordability analysis." : ""}${v.close}`;
    }

    case "price": {
      const deals = ctx.purchases
        .filter((p) => p.status !== "bought" && toNum(p.desiredPrice) > 0 && toNum(p.currentPrice) > 0)
        .map((p) => ({ p, off: (toNum(p.desiredPrice) - toNum(p.currentPrice)) / toNum(p.desiredPrice) }))
        .filter((x) => x.off > 0)
        .sort((a, b) => b.off - a.off);
      if (!deals.length)
        return `${mem}${v.open} No price drops detected yet. Add products with desired + current prices in the Purchase Planner and I'll flag the best buying opportunities automatically.${v.close}`;
      const best = deals[0];
      return `${mem}${v.open} 📉 Best opportunity right now:\n• ${best.p.productName}: now ${money(best.p.currentPrice)} (target ${money(best.p.desiredPrice)}, ${Math.round(best.off * 100)}% below).\n${deals.length > 1 ? `• ${deals.length - 1} more item(s) are also under target price.` : ""}\nI'd grab it if it fits this month's budget.${v.close}`;
    }

    case "shopping": {
      const wishlist = ctx.purchases.filter((p) => p.status !== "bought");
      const totalWish = wishlist.reduce((s, p) => s + toNum(p.currentPrice || p.desiredPrice), 0);
      const recalled = ctx.memory.filter((mm) => mm.category === "shopping_preference");
      const memNote =
        recalled.length > 0
          ? ` You previously mentioned wanting: ${recalled.map((mm) => mm.memoryValue).slice(0, 3).join(", ")}.`
          : "";
      return `${mem}${v.open} Your planner has ${wishlist.length} item(s) on the wishlist worth ~${money(totalWish)} total.${memNote}\nI can rank them by priority-vs-budget and suggest cheaper alternatives when you add price history.${v.close}`;
    }

    case "abandoned": {
      const stale = active.filter((g) => (g.progress ?? 0) < 25 && Date.now() - new Date(g.createdAt).getTime() > 14 * DAY);
      if (!stale.length)
        return `${mem}${v.open} Good news — I don't see any goals slipping. All ${active.length} active goals have healthy momentum.${v.close}`;
      const lines = stale.map((g) => `• ${g.title} — only ${g.progress ?? 0}% after ${Math.round((Date.now() - new Date(g.createdAt).getTime()) / DAY)} day(s)`).join("\n");
      return `${mem}${v.open} I noticed a few goals going cold:\n${lines}\n\nWant to break one into a smaller milestone this week? Momentum beats perfection.${v.close}`;
    }

    case "motivation":
      return `${mem}${v.open} Hey — progress isn't linear and you've already completed ${completed.length} goal(s). That's real proof you finish what matters. Pick the smallest next step on your top goal and do it today. Small wins compound. 💪${v.close}`;

    case "report":
      return `${mem}${v.open} 📊 Your snapshot:\n• Goals: ${active.length} active, ${completed.length} completed (${overall}% funded overall)\n• Saved: ${money(totalSavings)} • Logged expenses: ${money(totalExpenses)}\n• Achievements ready to review on your Achievements page.\n${overall >= 75 ? "You're in the home stretch — push!" : overall >= 40 ? "Solid momentum. Keep stacking months." : "Early days — consistency is your superpower."}${v.close}`;

    case "goals": {
      const nearest =
        cap > 0 && active.length
          ? [...active].sort((a, b) => toNum(a.targetAmount) - toNum(b.targetAmount))[0]
          : null;
      const eta = nearest
        ? ` At ~${money(cap)}/mo your smallest target (${nearest.title}) is ${etaForGoal(nearest, cap)} away.`
        : "";
      return `${mem}${v.open} You have ${active.length} active and ${completed.length} completed goal(s), ${overall}% funded overall (${money(totalSaved)} of ${money(totalTarget)}).${eta} Want me to prioritise them or set a savings plan?${v.close}`;
    }

    default:
      return `${mem}${v.open} I'm ${v.name}, your life-assistant. I can analyse your goals, forecast completion dates, suggest savings strategies, spot price drops, recommend priorities, or just motivate you. Try asking "what should I focus on?" or "when will I reach my goals?"${v.close}`;
  }
}

/* -------------------------------- main API ------------------------------- */

export async function chat(userId: number, message: string): Promise<{ reply: string; intent: string }> {
  const ctx = await getAiContext(userId);
  const intent = detectIntent(message);
  await extractFacts(userId, message);
  const reply = buildReply(intent, message, ctx);

  await db.insert(aiConversations).values([
    { userId, role: "user", content: message.slice(0, 2000), intent },
    { userId, role: "assistant", content: reply.slice(0, 4000), intent },
  ]);
  await db.insert(aiLearningData).values({
    userId,
    behaviorType: "chat_intent",
    data: { intent, length: message.length },
    score: "1",
  });
  return { reply, intent };
}

export async function getRecentConversation(userId: number, limit = 30) {
  const rows = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.id))
    .limit(limit);
  return rows.reverse();
}

export { PERSONALITIES };
