import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { refreshNotifications } from "@/lib/data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  await refreshNotifications(user.id);
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  const unread = rows.filter((n) => !n.read).length;
  return ok({ notifications: rows, unread });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const b = await req.json().catch(() => ({}));
  if (b.all) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  } else if (b.id) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, Number(b.id)), eq(notifications.userId, user.id)));
  }
  return ok({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (id) {
    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  } else {
    await db.delete(notifications).where(and(eq(notifications.userId, user.id), eq(notifications.read, sql`true`)));
  }
  return ok({ ok: true });
}
