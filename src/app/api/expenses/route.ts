import { NextRequest } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
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

  const date = b.date || new Date().toISOString().slice(0, 10);
  const [row] = await db
    .insert(expenses)
    .values({
      userId: user.id,
      amount: String(amount),
      category: clampText(b.category, 50) || "General",
      description: clampText(b.description, 300),
      date,
    })
    .returning();
  await logActivity({ userId: user.id, action: "expense_add", entity: "expense", entityId: row.id });
  return ok({ expense: row }, 201);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return bad("id is required.");
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, user.id)));
  return ok({ ok: true });
}
