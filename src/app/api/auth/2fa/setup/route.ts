import { NextRequest } from "next/server";
import { getCurrentUser, logActivity } from "@/lib/auth";
import { checkCsrf, ok, bad, unauthorized } from "@/lib/api-helpers";
import { generateTotpSecret, getOtpauthUrl, generateQrDataUrl } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await checkCsrf(req))) return bad("Invalid CSRF token.", 403);
  if (user.twoFactorEnabled) return bad("2FA is already enabled. Disable it first to reconfigure.");

  const secret = generateTotpSecret(user.email);
  const otpauthUrl = getOtpauthUrl(user.email, secret);
  const qrDataUrl = await generateQrDataUrl(otpauthUrl);

  return ok({ secret, qr: qrDataUrl, otpauthUrl });
}
