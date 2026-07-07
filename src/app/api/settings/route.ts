import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, aiPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, logActivity, hashPassword, hashPin, verifyPassword } from "@/lib/auth";
import { getOrCreatePrefs } from "@/lib/ai";
import { checkCsrf, ok, bad, unauthorized, sanitizeUser } from "@/lib/api-helpers";
import { clampText, validatePassword, validatePin } from "@/lib/security";
import { toNum } from "@/lib/format";

const PERSONALITIES = ["professional", "friendly", "motivational", "strategic", "minimalist", "coach", "mentor"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const b = await req.json().catch(() => ({}));

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (b.fullName !== undefined) updates.fullName = clampText(b.fullName, 80) || user.fullName;
  if (b.bio !== undefined) updates.bio = clampText(b.bio, 300);
  if (b.avatar !== undefined) updates.avatar = clampText(b.avatar, 40);
  if (b.theme !== undefined && ["light", "dark"].includes(b.theme)) updates.theme = b.theme;
  if (b.accentColor !== undefined) updates.accentColor = clampText(b.accentColor, 20);
  if (b.currency !== undefined) updates.currency = clampText(b.currency, 10).toUpperCase();
  if (b.monthlyIncome !== undefined) updates.monthlyIncome = String(Math.max(0, toNum(b.monthlyIncome)));
  if (b.twoFactorEnabled !== undefined) updates.twoFactorEnabled = !!b.twoFactorEnabled;

  if (b.newPassword) {
    if (!(await verifyPassword(String(b.currentPassword || ""), user.passwordHash)))
      return bad("Current password is incorrect.");
    const pErr = validatePassword(b.newPassword);
    if (pErr) return bad(pErr);
    updates.passwordHash = await hashPassword(b.newPassword);
  }

  if (b.pin !== undefined) {
    if (b.pin === "") updates.pinHash = null;
    else {
      const e = validatePin(b.pin);
      if (e) return bad(e);
      updates.pinHash = await hashPin(b.pin);
    }
  }

  await db.update(users).set(updates).where(eq(users.id, user.id));

  const prefs = await getOrCreatePrefs(user.id);
  const pUpdates: Record<string, unknown> = { updatedAt: new Date() };
  if (b.aiName !== undefined) pUpdates.aiName = clampText(b.aiName, 40) || "Chloe";
  if (b.aiAvatar !== undefined) pUpdates.avatar = clampText(b.aiAvatar, 40);
  if (b.personality !== undefined && PERSONALITIES.includes(b.personality)) pUpdates.personality = b.personality;
  if (b.aiThemeColor !== undefined) pUpdates.themeColor = clampText(b.aiThemeColor, 20);
  if (b.voice !== undefined) pUpdates.voice = clampText(b.voice, 30);
  await db.update(aiPreferences).set(pUpdates).where(eq(aiPreferences.id, prefs.id));

  const [updated] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  await logActivity({ userId: user.id, action: "settings_update" });
  return ok({ user: sanitizeUser(updated) });
}
