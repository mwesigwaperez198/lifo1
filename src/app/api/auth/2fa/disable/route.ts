import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, logActivity, verifyPassword } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  if (!user.twoFactorEnabled) return bad("2FA is not enabled.");

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  if (!password) return bad("Enter your current password to disable 2FA.");

  if (!(await verifyPassword(password, user.passwordHash)))
    return bad("Incorrect password.");

  await db
    .update(users)
    .set({ twoFactorEnabled: false, twoFactorSecret: null, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await logActivity({ userId: user.id, action: "2fa_disable" });
  return ok({ disabled: true });
}
