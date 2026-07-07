import { describe, it, expect } from "vitest";
import {
  GOAL_CATEGORIES,
  categoryMeta,
  PRIORITIES,
  PERSONALITIES,
  personalityMeta,
  ACHIEVEMENTS,
  TIER_META,
  AI_AVATARS,
  ACCENT_COLORS,
} from "@/lib/constants";

describe("GOAL_CATEGORIES", () => {
  it("has at least 8 categories", () => {
    expect(GOAL_CATEGORIES.length).toBeGreaterThanOrEqual(8);
  });

  it("each has name, icon, and color", () => {
    for (const cat of GOAL_CATEGORIES) {
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toMatch(/^#/);
    }
  });

  it("includes Custom", () => {
    expect(GOAL_CATEGORIES.some((c) => c.name === "Custom")).toBe(true);
  });
});

describe("categoryMeta", () => {
  it("returns matching category", () => {
    const result = categoryMeta("Education");
    expect(result.name).toBe("Education");
    expect(result.icon).toBeTruthy();
  });

  it("falls back for unknown", () => {
    const result = categoryMeta("Nonexistent");
    expect(result.name).toBe("Nonexistent");
    expect(result.icon).toBe("🎯");
  });

  it("handles null/undefined", () => {
    expect(categoryMeta(null).name).toBe("Custom");
    expect(categoryMeta(undefined).name).toBe("Custom");
  });
});

describe("PRIORITIES", () => {
  it("has high, medium, low", () => {
    const values = PRIORITIES.map((p) => p.value);
    expect(values).toContain("high");
    expect(values).toContain("medium");
    expect(values).toContain("low");
  });
});

describe("PERSONALITIES", () => {
  it("has 7 personalities", () => {
    expect(PERSONALITIES.length).toBe(7);
  });

  it("each has required fields", () => {
    for (const p of PERSONALITIES) {
      expect(p.slug).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.emoji).toBeTruthy();
      expect(p.description).toBeTruthy();
    }
  });

  it("slugs are unique", () => {
    const slugs = PERSONALITIES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("personalityMeta", () => {
  it("returns matching personality", () => {
    const result = personalityMeta("coach");
    expect(result.slug).toBe("coach");
    expect(result.name).toBe("Coach");
  });

  it("defaults to friendly", () => {
    expect(personalityMeta(null).slug).toBe("friendly");
    expect(personalityMeta("nonexistent").slug).toBe("friendly");
  });
});

describe("ACHIEVEMENTS", () => {
  it("has at least 10 achievements", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
  });

  it("each has code, title, icon, tier", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.code).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(["bronze", "silver", "gold", "platinum"]).toContain(a.tier);
    }
  });
});

describe("TIER_META", () => {
  it("has all four tiers", () => {
    expect(TIER_META.bronze).toBeDefined();
    expect(TIER_META.silver).toBeDefined();
    expect(TIER_META.gold).toBeDefined();
    expect(TIER_META.platinum).toBeDefined();
  });
});

describe("AI_AVATARS", () => {
  it("has at least 8 avatars", () => {
    expect(AI_AVATARS.length).toBeGreaterThanOrEqual(8);
  });
});

describe("ACCENT_COLORS", () => {
  it("has at least 6 colors", () => {
    expect(ACCENT_COLORS.length).toBeGreaterThanOrEqual(6);
  });

  it("all are hex colors", () => {
    for (const c of ACCENT_COLORS) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
