app/
 ├─ layout.tsx
 ├─ page.tsx                        → Landing Page
 │
 ├─ auth/
 │   ├─ signup/page.tsx             → Sign-up (Supabase Auth)
 │   ├─ login/page.tsx              → Login
 │
 ├─ onboarding/
 │   └─ page.tsx                    → Multi-step onboarding
 │
 ├─ pricing-intro/
 │   └─ page.tsx                    → Pricing modal/page
 │
 ├─ dashboard/
 │   ├─ layout.tsx                  → Sidebar layout
 │   ├─ page.tsx                    → Default chat with Nexa
 │   ├─ chat/page.tsx               → Chat interface
 │   ├─ campaigns/page.tsx          → Campaign manager
 │   ├─ analytics/page.tsx          → Analytics dashboard
 │   ├─ connections/page.tsx        → Composio connections
 │   ├─ billing/page.tsx            → Credit balance, payments
 │   ├─ settings/page.tsx           → Profile & preferences
 │   ├─ reports/page.tsx            → Growth summaries (new)
 │   ├─ logs/page.tsx               → Activity logs (new)
 │
 ├─ docs/
 │   └─ page.tsx                    → Help/Getting Started (new)
 │
 ├─ api/
 │   ├─ credits/
 │   │   ├─ deduct/route.ts
 │   │   ├─ add/route.ts
 │   ├─ composio/
 │   │   ├─ connect/route.ts
 │   │   ├─ post/route.ts
 │   ├─ chat/route.ts
 │   ├─ payments/webhook/route.ts
 │   ├─ logs/route.ts               → System event logs (new)
 │   ├─ reports/route.ts            → Weekly/Monthly summaries (new)
 │
 ├─ components/
 │   ├─ ui/                         → Shadcn atomic components
 │   ├─ charts/                     → Recharts/Plotly charts (new)
 │   ├─ widgets/                    → Dashboard KPIs, trends (new)
 │   ├─ Navbar.tsx
 │   ├─ Sidebar.tsx
 │   ├─ ChatUI.tsx
 │   ├─ OnboardingForm.tsx
 │   ├─ PricingIntro.tsx
 │   ├─ DashboardHeader.tsx
 │
 ├─ lib/
 │   ├─ supabaseClient.ts
 │   ├─ openaiClient.ts
 │   ├─ composioClient.ts
 │   ├─ flutterwaveClient.ts
 │   ├─ logger.ts                   → Centralized logging (new)
 │   ├─ agents/                     → Agent configurations (new)
 │   │   ├─ nexaBase.ts
 │   │   ├─ growthAgent.ts
 │   │   ├─ analyticsAgent.ts
 │   ├─ utils/
 │       ├─ credits.ts
 │       ├─ campaigns.ts
 │       ├─ analytics.ts
 │       ├─ authGuard.ts
 │       ├─ reports.ts              → Helpers for report generation (new)
 │
 ├─ middleware.ts                   → Route protection & roles
 ├─ theme.config.ts                 → UI theme and tokens (new)
 ├─ globals.css


User (Dashboard/Chat) 
   ↓
Next.js Route Handlers (/api)
   ↓
Supabase (Auth + DB) + Composio (Social Posting)
   ↓
OpenAI (Campaign Intelligence)
   ↓
Flutterwave (Payments)
   ↓
Analytics/Reports → UI (Charts, Widgets)
