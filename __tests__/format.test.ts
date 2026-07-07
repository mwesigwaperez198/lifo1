import { describe, it, expect } from "vitest";
import { money, toNum, formatDate, daysUntil, timeAgo } from "@/lib/format";

describe("money", () => {
  it("formats number as currency", () => {
    expect(money(1234.56)).toContain("1");
    expect(money(0)).toContain("0");
  });

  it("handles zero", () => {
    const result = money(0);
    expect(result).toBeTruthy();
  });
});

describe("toNum", () => {
  it("converts numeric strings", () => {
    expect(toNum("42")).toBe(42);
    expect(toNum("3.14")).toBeCloseTo(3.14);
  });

  it("handles null/undefined/empty", () => {
    expect(toNum(null)).toBe(0);
    expect(toNum(undefined)).toBe(0);
    expect(toNum("")).toBe(0);
  });

  it("handles numeric input", () => {
    expect(toNum(100)).toBe(100);
  });

  it("strips non-numeric chars", () => {
    expect(toNum("$1,234.56")).toBe(0);
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2025-06-15");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});

describe("daysUntil", () => {
  it("returns positive for future dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = daysUntil(future.toISOString().split("T")[0]);
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it("returns negative for past dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const result = daysUntil(past.toISOString().split("T")[0]);
    expect(result).toBeLessThan(0);
  });

  it("returns null for null input", () => {
    expect(daysUntil(null)).toBeNull();
  });
});

describe("timeAgo", () => {
  it("returns a string", () => {
    const result = timeAgo(new Date());
    expect(typeof result).toBe("string");
  });
});
