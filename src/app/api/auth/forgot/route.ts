import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, passwordResets } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sanitizeText, authLimiter, getClientIp, generateToken } from "@/lib/security";
import { sendPasswordResetEmail } from "@/lib/email";
import { ok, bad } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!authLimiter.check("forgot:" + ip).allowed)
    return bad("Too many requests. Please slow down.", 429);

  const body = await req.json().catch(() => ({}));
  const email = sanitizeText(body.email).toLowerCase();

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  // Always respond positively to avoid user enumeration.
  if (!rows[0]) return ok({ sent: true });

  const token = generateToken(24);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await db.insert(passwordResets).values({ userId: rows[0].id, token, expiresAt });

  try {
    await sendPasswordResetEmail(rows[0].email, token);
  } catch {
    // Email failure shouldn't block the flow — user gets a generic success either way
  }

  return ok({ sent: true });
}

// Verify a reset token + set a new password.
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = sanitizeText(body.token);
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) return bad("Invalid or expired reset token.");
  if (password.length < 6) return bad("Password must be at least 6 characters.");

  const rows = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.token, token), eq(passwordResets.used, false), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  const reset = rows[0];
  if (!reset) return bad("Invalid or expired reset token.");

  const { hashPassword } = await import("@/lib/auth");
  const hash = await hashPassword(password);
  await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, reset.userId));
  await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, reset.id));

  return ok({ ok: true });
}
