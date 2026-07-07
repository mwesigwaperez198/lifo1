import { describe, it, expect } from "vitest";
import {
  generateTotpSecret,
  getOtpauthUrl,
  verifyTotp,
  generateBackupCodes,
} from "@/lib/totp";
import speakeasy from "speakeasy";

describe("TOTP utilities", () => {
  it("generates a base32 secret", () => {
    const secret = generateTotpSecret("test@example.com");
    expect(secret).toBeTruthy();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });

  it("generates valid otpauth URL", () => {
    const secret = generateTotpSecret("user@test.com");
    const url = getOtpauthUrl("user@test.com", secret);
    expect(url).toMatch(/^otpauth:\/\/totp\//);
    expect(url).toContain("LifeOS");
    expect(url).toContain("user@test.com");
  });

  it("verifies a valid TOTP token", () => {
    const secret = generateTotpSecret("test@example.com");
    const token = speakeasy.totp({ secret, encoding: "base32" });
    expect(verifyTotp(secret, token)).toBe(true);
  });

  it("rejects an invalid token", () => {
    const secret = generateTotpSecret("test@example.com");
    expect(verifyTotp(secret, "000000")).toBe(false);
    expect(verifyTotp(secret, "123456")).toBe(false);
  });

  it("generates backup codes", () => {
    const codes = generateBackupCodes(8);
    expect(codes).toHaveLength(8);
    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    }
  });

  it("generates unique backup codes", () => {
    const codes = generateBackupCodes(20);
    expect(new Set(codes).size).toBe(20);
  });
});
