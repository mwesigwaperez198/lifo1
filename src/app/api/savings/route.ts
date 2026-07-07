import { NextRequest } from "next/server";
import { db } from "@/db";
import { savings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { clampText } from "@/lib/security";
import { toNum } from "@/lib/format";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const b = await req.json().catch(() => ({}));
  const amount = toNum(b.amount);
  if (amount <= 0) return bad("Enter a positive amount.");

  const now = new Date();
  const month = b.month ? Number(b.month) : now.getMonth() + 1;
  const year = b.year ? Number(b.year) : now.getFullYear();

  const [row] = await db
    .insert(savings)
    .values({
      userId: user.id,
      amount: String(amount),
      month,
      year,
      note: clampText(b.note, 300),
      source: "manual",
    })
    .returning();
  await logActivity({ userId: user.id, action: "saving_add", entity: "saving", entityId: row.id });
  return ok({ saving: row }, 201);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return bad("id is required.");
  await db.delete(savings).where(and(eq(savings.id, id), eq(savings.userId, user.id)));
  return ok({ ok: true });
}
