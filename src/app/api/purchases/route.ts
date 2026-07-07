import { NextRequest } from "next/server";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { clampText } from "@/lib/security";
import { toNum } from "@/lib/format";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const rows = await db.select().from(purchases).where(eq(purchases.userId, user.id));
  return ok({ purchases: rows });
}

const PRIOS = ["high", "medium", "low"];
const STATUSES = ["wishlist", "planned", "bought"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  const b = await req.json().catch(() => ({}));
  const productName = clampText(b.productName, 160);
  if (!productName) return bad("Product name is required.");

  const [purchase] = await db
    .insert(purchases)
    .values({
      userId: user.id,
      productName,
      image: b.image ? clampText(b.image, 500) : null,
      category: clampText(b.category, 50) || "General",
      desiredPrice: String(Math.max(0, toNum(b.desiredPrice))),
      currentPrice: String(Math.max(0, toNum(b.currentPrice))),
      link: b.link ? clampText(b.link, 500) : null,
      deadline: b.deadline || null,
      priority: PRIOS.includes(b.priority) ? b.priority : "medium",
      status: STATUSES.includes(b.status) ? b.status : "wishlist",
      notes: clampText(b.notes, 1000),
    })
    .returning();

  await logActivity({ userId: user.id, action: "purchase_create", entity: "purchase", entityId: purchase.id });
  return ok({ purchase }, 201);
}
