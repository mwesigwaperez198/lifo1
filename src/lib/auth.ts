// Authentication & session management (server-only).
import { db } from "@/db";
import { users, sessions, activityLogs } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { generateToken } from "./security";

export const SESSION_COOKIE = "lg_session";
export const CSRF_COOKIE = "lg_csrf";
const REMEMBER_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_MS = 1000 * 60 * 60 * 8; // 8 hours

export async function hashPassword(p: string) {
  return bcrypt.hash(p, 10);
}
export async function verifyPassword(p: string, hash: string) {
  return bcrypt.compare(p, hash);
}
export async function hashPin(p: string) {
  return bcrypt.hash(p, 10);
}
export async function verifyPin(p: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(p, hash);
}

export async function createSession(
  userId: number,
  opts: { rememberMe?: boolean; ip?: string; userAgent?: string } = {}
) {
  const token = generateToken(32);
  const csrfToken = generateToken(16);
  const remember = !!opts.rememberMe;
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_MS : SESSION_MS));

  await db.insert(sessions).values({
    userId,
    token,
    csrfToken,
    ip: opts.ip,
    userAgent: opts.userAgent,
    rememberMe: remember,
    expiresAt,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  // Readable by JS so the client can send it back as a CSRF header (double-submit).
  store.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return { token, csrfToken, expiresAt };
}

export async function getSession() {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const rows = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session) return null;
    const rows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!rows[0]) return null;
    if (rows[0].status !== "active") return null;
    return rows[0];
  } catch {
    return null;
  }
}

export async function getCsrfToken(): Promise<string | null> {
  const session = await getSession();
  return session?.csrfToken ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}

export async function logActivity(opts: {
  userId: number | null;
  action: string;
  entity?: string;
  entityId?: string | number | null;
  ip?: string;
  userAgent?: string;
  metadata?: unknown;
}) {
  try {
    await db.insert(activityLogs).values({
      userId: opts.userId,
      action: opts.action,
      entity: opts.entity ?? null,
      entityId: opts.entityId != null ? String(opts.entityId) : null,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
      metadata: opts.metadata ?? null,
    });
  } catch {
    // logging must never break the main flow
  }
}

/** Clear expired sessions (best-effort). */
export async function pruneSessions() {
  try {
    await db.delete(sessions).where(sql`${sessions.expiresAt} < now()`);
  } catch {
    // ignore
  }
}
