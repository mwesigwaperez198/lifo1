import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.EMAIL_FROM || "LifeOS <noreply@lifeos.app>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping password reset email.");
    return;
  }

  const resetUrl = `${BASE_URL}/reset-confirm?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "LifeOS — Reset your password",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 520px; margin: 0 auto; padding: 48px 24px; }
    .logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #2563eb); display: grid; place-items: center; color: #fff; font-weight: bold; font-size: 18px; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #f8fafc; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
    .btn { display: inline-block; padding: 12px 28px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #2563eb); color: #fff; font-weight: 600; font-size: 14px; text-decoration: none; }
    .link-text { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 24px; }
    .divider { border: none; border-top: 1px solid #1e293b; margin: 32px 0; }
    .footer { font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">L</div>
    <h1>Reset your password</h1>
    <p>We received a request to reset the password for your LifeOS account. Click the button below to choose a new one. This link expires in <strong style="color:#e2e8f0">1 hour</strong>.</p>
    <a href="${resetUrl}" class="btn">Set new password</a>
    <p class="link-text">If the button doesn't work, copy and paste this link into your browser:<br />${resetUrl}</p>
    <hr class="divider" />
    <p class="footer">If you didn't request this, you can safely ignore this email. Your password won't be changed unless you click the link above.</p>
    <p class="footer" style="margin-top: 8px">LifeOS — Shaping a new era of technology in Uganda</p>
  </div>
</body>
</html>`,
  });
}
