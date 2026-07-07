import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, loginMethods } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import {
  hashPassword,
  hashPin,
  createSession,
  logActivity,
} from "@/lib/auth";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePin,
  sanitizeText,
  authLimiter,
  getClientIp,
  getUserAgent,
} from "@/lib/security";
import { ok, bad, sanitizeUser } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const ua = getUserAgent(req.headers);
  if (!authLimiter.check("register:" + ip).allowed)
    return bad("Too many attempts. Please slow down.", 429);

  const body = await req.json().catch(() => ({}));
  const email = sanitizeText(body.email).toLowerCase();
  const username = sanitizeText(body.username).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = sanitizeText(body.fullName) || "New Explorer";
  const pin = body.pin ? String(body.pin) : "";
  const rememberMe = !!body.rememberMe;

  const eErr = validateEmail(email);
  if (eErr) return bad(eErr);
  const uErr = validateUsername(username);
  if (uErr) return bad(uErr);
  const pErr = validatePassword(password);
  if (pErr) return bad(pErr);
  if (pin) {
    const pinErr = validatePin(pin);
    if (pinErr) return bad(pinErr);
  }

  const dup = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1);
  if (dup.length) return bad("An account with that email or username already exists.");

  const passwordHash = await hashPassword(password);
  const pinHash = pin ? await hashPin(pin) : null;

  const userCount = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  const isFirstUser = (userCount[0]?.c ?? 0) === 0;

  const [user] = await db
    .insert(users)
    .values({
      email,
      username,
      fullName,
      passwordHash,
      pinHash: pinHash ?? undefined,
      avatar: "🙂",
      role: isFirstUser ? "admin" : "user",
    })
    .returning();

  const methods: (typeof loginMethods.$inferInsert)[] = [
    { userId: user.id, method: "email", enabled: true },
    { userId: user.id, method: "username", enabled: true },
  ];
  if (pinHash) methods.push({ userId: user.id, method: "pin", enabled: true });
  // future-ready biometric placeholders (disabled until hardware exists)
  methods.push(
    { userId: user.id, method: "biometric", enabled: false },
    { userId: user.id, method: "face", enabled: false },
    { userId: user.id, method: "eye", enabled: false }
  );
  await db.insert(loginMethods).values(methods);

  await createSession(user.id, { rememberMe, ip, userAgent: ua });
  await logActivity({ userId: user.id, action: "register", ip, userAgent: ua });

  return ok({ user: sanitizeUser(user) }, 201);
}
