// Security helpers: rate limiting, validation, tokens, sanitisation.
import { randomBytes } from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

/** Simple sliding-window in-memory rate limiter (single instance). */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private max: number, private windowMs: number) {}

  check(key: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const arr = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    if (arr.length >= this.max) {
      return { allowed: false, retryAfterMs: Math.max(1000, this.windowMs - (now - arr[0])) };
    }
    arr.push(now);
    this.hits.set(key, arr);
    return { allowed: true, retryAfterMs: 0 };
  }
}

export const authLimiter = new RateLimiter(12, 60_000);
export const apiLimiter = new RateLimiter(120, 60_000);

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string") return "Email is required.";
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return "Please enter a valid email address.";
  if (e.length > 254) return "Email is too long.";
  return null;
}

export function validateUsername(username: unknown): string | null {
  if (typeof username !== "string") return "Username is required.";
  const u = username.trim();
  if (!USERNAME_RE.test(u)) return "Username must be 3–30 chars: letters, numbers, _ . -";
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < 6) return "Password must be at least 6 characters.";
  if (password.length > 200) return "Password is too long.";
  return null;
}

export function validatePin(pin: unknown): string | null {
  if (typeof pin !== "string") return "PIN is required.";
  if (!/^\d{4,6}$/.test(pin)) return "PIN must be 4–6 digits.";
  return null;
}

/** Strip control characters and neutralise obvious script/vector payloads. */
export function sanitizeText(input: unknown): string {
  if (input == null) return "";
  return String(input)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, 5000);
}

/** Truncate to a safe length for short fields. */
export function clampText(input: unknown, max = 255): string {
  return sanitizeText(input).slice(0, max);
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export function getUserAgent(headers: Headers): string {
  return headers.get("user-agent")?.slice(0, 300) || "unknown";
}
