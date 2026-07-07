import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { chat } from "@/lib/ai";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { apiLimiter, sanitizeText } from "@/lib/security";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  if (!apiLimiter.check("chat:" + user.id).allowed)
    return bad("You're chatting a little too fast — give me a moment.", 429);

  const b = await req.json().catch(() => ({}));
  const message = sanitizeText(b.message).slice(0, 2000);
  if (!message.trim()) return bad("Please type a message.");

  const { reply, intent } = await chat(user.id, message);
  return ok({ reply, intent });
}
