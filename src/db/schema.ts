import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  ENUMS                                                                     */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);
export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "paused",
  "abandoned",
]);
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "wishlist",
  "planned",
  "bought",
]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

/* -------------------------------------------------------------------------- */
/*  USERS & SECURITY                                                          */
/* -------------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  pinHash: text("pin_hash"),
  fullName: text("full_name").notNull().default("New Explorer"),
  avatar: text("avatar"), // emoji or url
  bio: text("bio").default(""),
  theme: text("theme").default("dark"), // light | dark
  accentColor: text("accent_color").default("#7c3aed"),
  currency: text("currency").default("USD"),
  monthlyIncome: numeric("monthly_income").default("0"),
  role: userRoleEnum("role").default("user"),
  status: userStatusEnum("status").default("active"),
  // two factor
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  // security tracking
  rememberToken: text("remember_token"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  csrfToken: text("csrf_token").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  rememberMe: boolean("remember_me").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("sessions_user_id_idx").on(t.userId),
  index("sessions_expires_at_idx").on(t.expiresAt),
]);

export const loginMethods = pgTable("login_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  method: text("method").notNull(), // email | username | pin | biometric | face | eye
  enabled: boolean("enabled").default(true),
  metadata: jsonb("metadata"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("login_methods_user_id_idx").on(t.userId),
  index("login_methods_user_method_idx").on(t.userId, t.method),
]);

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("password_resets_user_id_idx").on(t.userId),
  index("password_resets_token_used_idx").on(t.token, t.used),
]);

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("activity_logs_user_id_idx").on(t.userId),
  index("activity_logs_action_idx").on(t.action),
  index("activity_logs_user_action_created_idx").on(t.userId, t.action, t.createdAt),
]);

/* -------------------------------------------------------------------------- */
/*  GOALS & CATEGORIES                                                        */
/* -------------------------------------------------------------------------- */

export const goalCategories = pgTable("goal_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }), // null = system default
  name: text("name").notNull(),
  icon: text("icon").default("🎯"),
  color: text("color").default("#7c3aed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("goal_categories_user_id_idx").on(t.userId),
]);

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  category: text("category").default("Custom"),
  priority: text("priority").default("medium"), // low | medium | high
  targetAmount: numeric("target_amount").default("0"),
  currentAmount: numeric("current_amount").default("0"),
  deadline: date("deadline"),
  status: goalStatusEnum("status").default("active"),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (t) => [
  index("goals_user_id_idx").on(t.userId),
  index("goals_category_idx").on(t.category),
  index("goals_user_status_idx").on(t.userId, t.status),
  index("goals_user_deadline_idx").on(t.userId, t.deadline),
]);

/* -------------------------------------------------------------------------- */
/*  PURCHASES & PRICE TRACKING                                                */
/* -------------------------------------------------------------------------- */

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  image: text("image"),
  category: text("category").default("General"),
  desiredPrice: numeric("desired_price").default("0"),
  currentPrice: numeric("current_price").default("0"),
  link: text("link"),
  deadline: date("deadline"),
  priority: text("priority").default("medium"), // low | medium | high
  status: purchaseStatusEnum("status").default("wishlist"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("purchases_user_id_idx").on(t.userId),
  index("purchases_user_status_idx").on(t.userId, t.status),
]);

export const productPrices = pgTable("product_prices", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  store: text("store").notNull(),
  price: numeric("price").notNull(),
  url: text("url"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (t) => [
  index("product_prices_purchase_id_idx").on(t.purchaseId),
  index("product_prices_purchase_recorded_idx").on(t.purchaseId, t.recordedAt),
]);

/* -------------------------------------------------------------------------- */
/*  SAVINGS & EXPENSES                                                        */
/* -------------------------------------------------------------------------- */

export const savings = pgTable("savings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  note: text("note").default(""),
  source: text("source").default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("savings_user_id_idx").on(t.userId),
  index("savings_user_year_month_idx").on(t.userId, t.year, t.month),
]);

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  category: text("category").default("General"),
  description: text("description").default(""),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("expenses_user_id_idx").on(t.userId),
  index("expenses_category_idx").on(t.category),
  index("expenses_user_date_idx").on(t.userId, t.date),
]);

/* -------------------------------------------------------------------------- */
/*  ACHIEVEMENTS & NOTIFICATIONS                                              */
/* -------------------------------------------------------------------------- */

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  icon: text("icon").default("🏆"),
  tier: text("tier").default("bronze"), // bronze | silver | gold | platinum
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
}, (t) => [
  index("achievements_user_id_idx").on(t.userId),
  index("achievements_user_code_idx").on(t.userId, t.code),
]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // reminder | deadline | price_drop | achievement | system
  title: text("title").notNull(),
  message: text("message"),
  read: boolean("read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notifications_user_id_idx").on(t.userId),
  index("notifications_user_read_created_idx").on(t.userId, t.read, t.createdAt),
]);

export const aiRecommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  content: text("content").notNull(),
  dismissed: boolean("dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("ai_recommendations_user_id_idx").on(t.userId),
]);

/* -------------------------------------------------------------------------- */
/*  AI COMPANION SYSTEM (CHLOE)                                               */
/* -------------------------------------------------------------------------- */

export const aiPreferences = pgTable("ai_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  aiName: text("ai_name").default("Chloe"),
  avatar: text("avatar").default("✨"),
  personality: text("personality").default("friendly"),
  themeColor: text("theme_color").default("#7c3aed"),
  voice: text("voice").default("soft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("ai_preferences_user_id_idx").on(t.userId),
]);

export const aiPersonality = pgTable("ai_personality", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  traits: text("traits").default(""),
  emoji: text("emoji").default("🤖"),
});

export const aiMemory = pgTable("ai_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memoryKey: text("memory_key").notNull(),
  memoryValue: text("memory_value").notNull(),
  category: text("category").default("general"),
  importance: integer("importance").default(5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("ai_memory_user_id_idx").on(t.userId),
  index("ai_memory_category_idx").on(t.category),
  index("ai_memory_user_key_idx").on(t.userId, t.memoryKey),
  index("ai_memory_user_updated_idx").on(t.userId, t.updatedAt),
]);

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  intent: text("intent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("ai_conversations_user_id_idx").on(t.userId),
  index("ai_conversations_user_created_idx").on(t.userId, t.createdAt),
]);

export const aiReminders = pgTable("ai_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").default(""),
  remindAt: timestamp("remind_at").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("ai_reminders_user_id_idx").on(t.userId),
  index("ai_reminders_user_remind_idx").on(t.userId, t.remindAt),
]);

export const aiLearningData = pgTable("ai_learning_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  behaviorType: text("behavior_type").notNull(),
  data: jsonb("data"),
  score: numeric("score").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("ai_learning_data_user_id_idx").on(t.userId),
  index("ai_learning_type_idx").on(t.behaviorType),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Saving = typeof savings.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AiPreference = typeof aiPreferences.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
export type AiMemory = typeof aiMemory.$inferSelect;
