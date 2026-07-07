import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import {
  verifyPassword,
  verifyPin,
  createSession,
  logActivity,
} from "@/lib/auth";
import { sanitizeText, authLimiter, getClientIp, getUserAgent } from "@/lib/security";
import { ok, bad, sanitizeUser } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const ua = getUserAgent(req.headers);
  if (!authLimiter.check("login:" + ip).allowed)
    return bad("Too many login attempts. Please try again shortly.", 429);

  const body = await req.json().catch(() => ({}));
  const method = body.method === "pin" ? "pin" : "password";
  const identifier = sanitizeText(body.identifier).toLowerCase();
  const rememberMe = !!body.rememberMe;

  if (!identifier) return bad("Please enter your email or username.");

  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);
  const user = rows[0];
  if (!user) return bad("No account found with those credentials.", 404);
  if (user.status !== "active") return bad("This account has been suspended.", 403);
  if ((user.failedLoginAttempts ?? 0) >= 5)
    return bad("Account locked after too many failed attempts. Please reset your password.", 423);

  const fail = async () => {
    await db
      .update(users)
      .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1` })
      .where(eq(users.id, user.id));
    await logActivity({ userId: user.id, action: "login_failed", ip, userAgent: ua });
    return bad("Incorrect credentials. Please try again.", 401);
  };

  let valid: boolean;
  if (method === "pin") {
    if (!user.pinHash) return bad("PIN login is not set up for this account.");
    valid = await verifyPin(String(body.pin ?? ""), user.pinHash);
  } else {
    valid = await verifyPassword(String(body.password ?? ""), user.passwordHash);
  }
  if (!valid) return fail();

  await db
    .update(users)
    .set({ failedLoginAttempts: 0, lastLoginAt: new Date(), lastLoginIp: ip })
    .where(eq(users.id, user.id));
  await createSession(user.id, { rememberMe, ip, userAgent: ua });
  await logActivity({ userId: user.id, action: "login", ip, userAgent: ua });

  if (user.twoFactorEnabled) {
    return ok({ user: sanitizeUser(user), requiresTwoFactor: true });
  }

  return ok({ user: sanitizeUser(user) });
}
