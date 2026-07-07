import { describe, it, expect } from "vitest";
import {
  generateToken,
  sanitizeText,
  clampText,
  validateEmail,
  validateUsername,
  validatePassword,
  validatePin,
  RateLimiter,
} from "@/lib/security";

describe("generateToken", () => {
  it("generates a hex string of the requested length", () => {
    const token = generateToken(16);
    expect(token).toHaveLength(32);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken(16)));
    expect(tokens.size).toBe(50);
  });
});

describe("sanitizeText", () => {
  it("strips control characters", () => {
    expect(sanitizeText("hello\x00world\x1f!")).toBe("helloworld!");
  });

  it("truncates to 5000 chars", () => {
    const long = "a".repeat(6000);
    expect(sanitizeText(long)).toHaveLength(5000);
  });

  it("returns empty string for null/undefined", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
  });
});

describe("clampText", () => {
  it("truncates to max length", () => {
    expect(clampText("hello world", 5)).toBe("hello");
  });

  it("returns full string if within limit", () => {
    expect(clampText("hi", 10)).toBe("hi");
  });
});

describe("validateEmail", () => {
  it("returns null for valid emails", () => {
    expect(validateEmail("test@example.com")).toBeNull();
    expect(validateEmail("user.name+tag@domain.co")).toBeNull();
  });

  it("returns error for invalid emails", () => {
    expect(validateEmail("")).toBeTruthy();
    expect(validateEmail("notanemail")).toBeTruthy();
    expect(validateEmail("@no-local.com")).toBeTruthy();
    expect(validateEmail(123)).toBeTruthy();
  });

  it("normalizes to lowercase", () => {
    expect(validateEmail("TEST@EXAMPLE.COM")).toBeNull();
  });
});

describe("validateUsername", () => {
  it("returns null for valid usernames", () => {
    expect(validateUsername("perez")).toBeNull();
    expect(validateUsername("user_123")).toBeNull();
    expect(validateUsername("a-b.c")).toBeNull();
  });

  it("rejects invalid usernames", () => {
    expect(validateUsername("ab")).toBeTruthy();
    expect(validateUsername("has spaces")).toBeTruthy();
    expect(validateUsername("special!chars")).toBeTruthy();
  });
});

describe("validatePassword", () => {
  it("returns null for valid passwords", () => {
    expect(validatePassword("123456")).toBeNull();
    expect(validatePassword("longpassword")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(validatePassword("12345")).toBeTruthy();
    expect(validatePassword("")).toBeTruthy();
  });
});

describe("validatePin", () => {
  it("returns null for valid pins", () => {
    expect(validatePin("1234")).toBeNull();
    expect(validatePin("123456")).toBeNull();
  });

  it("rejects invalid pins", () => {
    expect(validatePin("123")).toBeTruthy();
    expect(validatePin("abcdef")).toBeTruthy();
    expect(validatePin("1234567")).toBeTruthy();
  });
});

describe("RateLimiter", () => {
  it("allows requests within the limit", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(false);
  });

  it("tracks different keys independently", () => {
    const limiter = new RateLimiter(1, 60_000);
    expect(limiter.check("x").allowed).toBe(true);
    expect(limiter.check("x").allowed).toBe(false);
    expect(limiter.check("y").allowed).toBe(true);
  });
});
