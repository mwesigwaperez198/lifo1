import speakeasy from "speakeasy";
import QRCode from "qrcode";

const APP_NAME = "LifeOS";

export function generateTotpSecret(email: string) {
  return speakeasy.generateSecret({ name: `${APP_NAME}:${email}`, length: 20 }).base32;
}

export function getOtpauthUrl(email: string, secret: string) {
  return speakeasy.otpauthURL({ secret, label: `${APP_NAME}:${email}`, issuer: APP_NAME });
}

export async function generateQrDataUrl(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl, { width: 256, margin: 2 });
}

export function verifyTotp(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}
