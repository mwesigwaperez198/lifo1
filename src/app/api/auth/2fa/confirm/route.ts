import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, createSession, logActivity } from "@/lib/auth";
import { ok, bad, unauthorized, checkCsrf } from "@/lib/api-helpers";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token))
    return bad("Verification code must be 6 digits.");

  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.twoFactorEnabled || !user.twoFactorSecret)
    return bad("2FA is not enabled on this account.");

  if (!verifyTotp(user.twoFactorSecret, token)) {
    await logActivity({ userId: user.id, action: "2fa_login_failed" });
    return bad("Invalid verification code.");
  }

  await db
    .update(users)
    .set({ failedLoginAttempts: 0, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  await logActivity({ userId: user.id, action: "2fa_login" });
  return ok({ ok: true });
}
