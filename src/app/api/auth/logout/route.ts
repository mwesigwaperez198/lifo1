import { NextRequest } from "next/server";
import { destroySession, getCurrentUser, logActivity } from "@/lib/auth";
import { getClientIp } from "@/lib/security";
import { ok, checkCsrf } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  if (!(await checkCsrf(req))) return ok({ ok: true });

  const user = await getCurrentUser();
  const ip = getClientIp(req.headers);
  if (user) await logActivity({ userId: user.id, action: "logout", ip });
  await destroySession();
  return ok({ ok: true });
}
