// Pure shared constants — safe for both server and client code.

export const GOAL_CATEGORIES = [
  { name: "Education", icon: "🎓", color: "#3b82f6" },
  { name: "Technology", icon: "💻", color: "#8b5cf6" },
  { name: "Home", icon: "🏠", color: "#10b981" },
  { name: "Business", icon: "💼", color: "#f59e0b" },
  { name: "Transport", icon: "🚗", color: "#ef4444" },
  { name: "Health", icon: "💪", color: "#ec4899" },
  { name: "Entertainment", icon: "🎮", color: "#06b6d4" },
  { name: "Travel", icon: "✈️", color: "#14b8a6" },
  { name: "Custom", icon: "⭐", color: "#64748b" },
];

export function categoryMeta(name?: string | null) {
  return (
    GOAL_CATEGORIES.find((c) => c.name === name) || {
      name: name || "Custom",
      icon: "🎯",
      color: "#7c3aed",
    }
  );
}

export const PRIORITIES = [
  { value: "high", label: "High", icon: "🔴", color: "#ef4444" },
  { value: "medium", label: "Medium", icon: "🟡", color: "#f59e0b" },
  { value: "low", label: "Low", icon: "🟢", color: "#10b981" },
];

export const PURCHASE_STATUSES = [
  { value: "wishlist", label: "Wishlist", icon: "💖" },
  { value: "planned", label: "Planned", icon: "📋" },
  { value: "bought", label: "Bought", icon: "✅" },
];

export const PERSONALITIES = [
  {
    slug: "professional",
    name: "Professional",
    emoji: "🤝",
    description: "Formal, concise and data-driven.",
    traits: "professional, formal, concise, analytical",
  },
  {
    slug: "friendly",
    name: "Friendly",
    emoji: "😊",
    description: "Warm, supportive and conversational.",
    traits: "warm, supportive, cheerful, conversational",
  },
  {
    slug: "motivational",
    name: "Motivational",
    emoji: "🔥",
    description: "High-energy, inspiring and uplifting.",
    traits: "energetic, inspiring, enthusiastic, encouraging",
  },
  {
    slug: "strategic",
    name: "Strategic",
    emoji: "♟️",
    description: "Plans, steps and long-term wins.",
    traits: "strategic, logical, methodical, plan-oriented",
  },
  {
    slug: "minimalist",
    name: "Minimalist",
    emoji: "🍃",
    description: "Calm, simple, no-fluff guidance.",
    traits: "calm, simple, direct, serene",
  },
  {
    slug: "coach",
    name: "Coach",
    emoji: "📣",
    description: "Clear actions and accountability.",
    traits: "direct, accountable, action-oriented, firm",
  },
  {
    slug: "mentor",
    name: "Mentor",
    emoji: "🦉",
    description: "Wise, patient and reflective.",
    traits: "wise, patient, reflective, guiding",
  },
];

export function personalityMeta(slug?: string | null) {
  return (
    PERSONALITIES.find((p) => p.slug === slug) || PERSONALITIES[1]
  );
}

export const AI_AVATARS = ["✨", "🌸", "🤖", "🦊", "🦉", "🐉", "🧠", "🌟", "💎", "🦋", "🍀", "🌙"];

export const ACCENT_COLORS = [
  "#7c3aed",
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
];

// Achievement catalogue. Conditions are evaluated in lib/data.ts
export const ACHIEVEMENTS = [
  { code: "first_goal", title: "First Step", description: "Created your very first goal.", icon: "🎯", tier: "bronze" },
  { code: "five_goals", title: "Goal Getter", description: "Tracked 5 different goals.", icon: "📈", tier: "silver" },
  { code: "ten_goals", title: "Visionary", description: "Tracked 10 goals — big plans!", icon: "🌟", tier: "gold" },
  { code: "first_completion", title: "Mission Accomplished", description: "Completed your first goal.", icon: "✅", tier: "silver" },
  { code: "five_completions", title: "The Finisher", description: "Completed 5 goals.", icon: "🏅", tier: "gold" },
  { code: "saver_100", title: "Saver", description: "Logged $100 in savings.", icon: "💰", tier: "bronze" },
  { code: "saver_1000", title: "Wealth Builder", description: "Logged $1,000 in savings.", icon: "💎", tier: "platinum" },
  { code: "first_purchase", title: "Wishlist Starter", description: "Added your first purchase.", icon: "🛒", tier: "bronze" },
  { code: "ten_purchases", title: "Shop Strategist", description: "Added 10 items to your planner.", icon: "🧠", tier: "silver" },
  { code: "chatter", title: "Getting Acquainted", description: "Chatted with your AI 10 times.", icon: "💬", tier: "bronze" },
  { code: "planner", title: "The Planner", description: "Set a monthly income.", icon: "📅", tier: "bronze" },
  { code: "budget_master", title: "Budget Master", description: "Logged 10 expenses.", icon: "🧾", tier: "silver" },
];

export const TIER_META: Record<string, { label: string; color: string; ring: string }> = {
  bronze: { label: "Bronze", color: "#cd7f32", ring: "#cd7f32" },
  silver: { label: "Silver", color: "#c0c0c0", ring: "#c0c0c0" },
  gold: { label: "Gold", color: "#ffd700", ring: "#ffd700" },
  platinum: { label: "Platinum", color: "#7dd3fc", ring: "#7dd3fc" },
};
