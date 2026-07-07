import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  if (user.twoFactorEnabled) return bad("2FA is already enabled.");

  const body = await req.json().catch(() => ({}));
  const secret = typeof body.secret === "string" ? body.secret : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!secret || !token) return bad("Secret and verification code are required.");
  if (token.length !== 6 || !/^\d{6}$/.test(token)) return bad("Verification code must be 6 digits.");

  if (!verifyTotp(secret, token)) return bad("Invalid verification code. Check your authenticator app and try again.");

  await db
    .update(users)
    .set({ twoFactorEnabled: true, twoFactorSecret: secret, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await logActivity({ userId: user.id, action: "2fa_enable" });
  return ok({ enabled: true });
}
