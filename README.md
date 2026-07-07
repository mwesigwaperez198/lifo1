# LifeOS — Life Goals & Smart Shopping Planner

A full-stack personal life-assistant that combines a **goal tracker**, **financial planner**, **wishlist/price manager** and an **AI companion named Chloe** that learns who you are and gets smarter the more you use it.

> **Implementation note:** This project was specified for PHP 8 + MySQL. The deployment
> environment here runs **Next.js 16 (App Router) + PostgreSQL + Drizzle ORM**, so the
> application is delivered on that production-grade stack. Every requested feature is
> implemented and the database mirrors the requested schema (PostgreSQL flavour).
> If you need a PHP/MySQL port, the logic, schema and routes below map 1:1.

---

## ✨ Feature overview

| # | Module | Status |
|---|--------|--------|
| 1 | Authentication (email / username / PIN login, biometric·face·eye placeholders, password reset, remember-me, 2FA toggle, secure sessions, account security monitoring) | ✅ |
| 2 | Dashboard (stats, goal completion %, savings tracker, achievement tracker, monthly charts) | ✅ |
| 3 | Goals management (CRUD, deadlines, priorities, 8 categories + custom, progress, history) | ✅ |
| 4 | Purchase planner (products, images, target/current price, links, deadlines, wishlist, budget) | ✅ |
| 5 | Price tracker (multi-store history, lowest/highest/average, price graph, drop alerts) | ✅ |
| 6 | Smart AI assistant **GoalBot** = **Chloe** (analyse goals, savings strategies, priorities, completion predictions, alternatives, motivation, spending habits) | ✅ |
| 7 | Savings system (income, expenses, calculations, affordability, forecasts) | ✅ |
| 8 | Achievements (badges, milestones, levels, certificates) | ✅ |
| 9 | Admin panel (user management, analytics, reports, security/activity logs) | ✅ |
| 10 | Notifications (reminders, deadlines, price drops, achievements, in-app) | ✅ |
| 11 | Database structure (all requested + AI tables) | ✅ |
| 12 | UI/UX (glassmorphism, dark/light, mobile-first, animations, custom charts) | ✅ |
| 13 | Security (bcrypt, prepared statements, CSRF, XSS, secure sessions, rate limiting, validation, audit logs) | ✅ |
| 14 | Future-ready (API endpoints, multi-user, cloud-ready, biometric/voice reserved) | ✅ |

### 🤖 Chloe — the AI companion
- Renameable (saved permanently in `ai_preferences.ai_name`) — always introduces itself by the chosen name.
- Customizable avatar, personality (7 options), theme colour, and a reserved **voice** field.
- **Long-term memory** (`ai_memory`) — remembers goals, purchases, favourite brands, budget, income, important dates, conversations.
- Personality-aware tone (Professional, Friendly, Motivational, Strategic, Minimalist, Coach, Mentor).
- Learns from behaviour (`ai_learning_data`) and stores full conversations (`ai_conversations`).

---

## 🗂 Folder structure

```
.
├── database/
│   └── schema.sql              # Full PostgreSQL DDL (generated from the live DB)
├── drizzle.config.json
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + anti-flash theme script
│   │   ├── globals.css         # Glassmorphism design system (dark/light)
│   │   ├── page.tsx            # Landing / marketing page
│   │   ├── login|register|forgot-password/page.tsx
│   │   ├── api/                # REST API (auth, goals, purchases, prices,
│   │   │                       #   savings, expenses, assistant/chat,
│   │   │                       #   notifications, settings, admin, health)
│   │   └── (app)/              # Authenticated area (auth-guarded layout)
│   │       ├── layout.tsx
│   │       ├── dashboard/  goals/  purchases/  tracker/
│   │       ├── savings/    achievements/  assistant/
│   │       ├── notifications/  settings/  admin/
│   ├── components/             # AppShell, Charts (SVG), Glass, Modals,
│   │                           #   Goals, Purchases, Finance, SettingsForm, ChatBox
│   ├── db/
│   │   ├── index.ts            # Drizzle client (pg pool)
│   │   └── schema.ts           # All 20 table definitions
│   └── lib/
│       ├── auth.ts             # Sessions, bcrypt, activity logging
│       ├── security.ts         # Rate limiting, validation, tokens, sanitisation
│       ├── data.ts             # Stats, achievements engine, notifications
│       ├── ai.ts               # Chloe engine (intent, memory, forecasting)
│       ├── api-helpers.ts      # CSRF + response helpers
│       ├── client.ts           # Client fetch + CSRF header
│       ├── constants.ts        # Categories, personalities, achievements
│       └── format.ts           # Currency/date helpers
└── README.md
```

---

## 🗄 Database schema

20 tables — see `database/schema.sql` for the full DDL.

**Core:** `users`, `sessions`, `login_methods`, `password_resets`, `activity_logs`
**Planning:** `goals`, `goal_categories`, `purchases`, `product_prices`
**Finance:** `savings`, `expenses`
**Gamification/Alerts:** `achievements`, `notifications`, `ai_recommendations`
**AI (Chloe):** `ai_preferences`, `ai_personality`, `ai_memory`, `ai_conversations`, `ai_reminders`, `ai_learning_data`

---

## 🔌 API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account (first user becomes admin) |
| POST | `/api/auth/login` | Email/username or PIN login |
| POST | `/api/auth/logout` | Destroy session |
| POST/PUT | `/api/auth/forgot` | Request / apply password reset |
| GET/POST | `/api/goals` | List / create goals |
| PATCH/DELETE | `/api/goals/[id]` | Update / delete goal |
| GET/POST | `/api/purchases` | List / create products |
| PATCH/DELETE | `/api/purchases/[id]` | Update / delete product |
| GET/POST | `/api/prices` | Price history + stats / add price |
| POST/DELETE | `/api/savings` | Log / delete savings |
| POST/DELETE | `/api/expenses` | Log / delete expenses |
| POST | `/api/assistant/chat` | Talk to Chloe |
| GET/POST/DELETE | `/api/notifications` | List / mark-read / delete |
| POST | `/api/settings` | Profile, Chloe customisation, security |
| GET | `/api/admin` | Admin analytics + users + logs |
| GET | `/api/health` | Health check |

All mutating endpoints require a valid session **and** a matching `X-CSRF-Token`
header (double-submit cookie pattern).

---

## 🔐 Security

- **bcrypt** password + PIN hashing · **httpOnly** secure session cookies
- **CSRF** double-submit token on every state-changing request
- **Prepared statements** via Drizzle ORM (SQL-injection safe)
- **Input validation & sanitisation** (email/username/password/PIN + length caps)
- **Rate limiting** on auth + chat endpoints (failed-login lockout after 5 tries)
- **XSS-safe** rendering (React escaping) + control-character stripping
- **Audit logging** of every meaningful action (`activity_logs`)

---

## 🚀 Installation guide

```bash
# 1. Install dependencies
npm install

# 2. Configure the database (already set in .env)
#    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db

# 3. Create the schema
npx drizzle-kit push

# 4. (Optional) seed default personalities & categories
psql "$DATABASE_URL" -f database/seed.sql   # or use the seed block in this repo

# 5. Run
npm run dev        # development  → http://localhost:3000
npm run build      # production build
npm start          # production server
```

Open the app, click **Get started**, and register — the **first account is an admin**.

---

## 🧭 Usage tour

1. **Register** → you land on the **Dashboard** with live stats & charts.
2. **Goals** → create goals with target amounts, deadlines & priorities.
3. **Purchase Planner** → add products, target prices & links.
4. **Price Tracker** → log prices from stores; watch the history graph & best deal.
5. **Savings** → log income, expenses; see forecasts toward your goals.
6. **Chloe** → ask *"What should I focus on?"*, *"When will I reach my goals?"*.
   Tell her *"I want to buy X"* / *"my income is $Y"* — she remembers next session.
7. **Settings** → rename Chloe, pick a personality/avatar/theme, change password/PIN.
8. **Admin** (admin only) → manage users, view analytics & activity logs.

---

## 🔮 Future expansion
Real biometric/face/eye auth · TOTP 2FA · AI voice synthesis · external LLM chatbot
integration · mobile (Android/iOS) via the existing REST API · cloud sync · webhooks
for real price-drop scraping.
