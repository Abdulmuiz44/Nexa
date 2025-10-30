🧭 NEXA ROADMAP — UPDATED (2025–2026)
🧠 Overview
Nexa is an AI Growth Agent that autonomously promotes AI tools or SaaS products on social platforms (Reddit, X, etc.). It replaces traditional social media managers by creating, scheduling, and analyzing growth campaigns 24/7.
Core Vision: Build Nexa as a 3-phase autonomous growth platform for AI founders and SaaS teams.

🚀 Phase 1 — MVP (Core System)
Goal: Launch foundational Nexa platform with AI posting agent, user onboarding, analytics, and billing.
✅ Deliverables
Landing page with clear CTA (Signup / Try Nexa)


Supabase authentication (Signup, Login, Logout)


Onboarding flow for new users (tool details, niche, goals)


Dashboard with sidebar navigation and modular pages:


Chat: AI chat with Nexa (OpenAI integration)


Campaigns: Create, view, and manage campaigns


Analytics: Basic performance insights per post


Connections: Manage Reddit/X accounts via Composio


Billing: Manage credit balance and payments (Flutterwave)


Settings: Update profile, preferences


Credit system (deduct credits per AI post)


Flutterwave integration for top-ups and subscription billing


Database schema with RLS and policies per user



📈 Phase 2 — Growth & Intelligence
Goal: Enable autonomous campaign management, analytics depth, and AI-assisted optimization.
✅ Deliverables
Smart content generation per platform (Reddit/X)


Engagement tracking: likes, comments, reach


A/B testing mode for posts


Weekly growth summary reports


Advanced analytics charts (Plotly)


Strategy insights from performance trends


Supabase + OpenAI hybrid functions for insight generation


Credit usage and campaign optimization suggestions



🤖 Phase 3 — Autonomy & Scale
Goal: Make Nexa a fully autonomous growth system for teams and agencies.
✅ Deliverables
Autonomous campaign scheduling and execution


Multi-agent collaboration mode


Platform expansion: LinkedIn, Product Hunt, Indie Hackers


Team & agency accounts


White-label dashboards and reporting


API access for enterprise clients


Human-AI strategy mode (review + execute)



💰 Pricing Model
Growth ($49/mo) — Solo founders (core AI + analytics)


Scale ($99/mo) — Startups/agencies (multi-agent + cross-platform)


Enterprise ($199/mo) — Agencies (dedicated instance + white-label + API)



🏗️ NEXA FOLDER STRUCTURE (FINAL)
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



🔄 SYSTEM FLOW DIAGRAM
[ User ]
   ↓
[ Signup/Login ] → (Supabase Auth)
   ↓
[ Onboarding Form ] → store profile in `users`
   ↓
[ Dashboard Layout ]
   ├─ Chat → OpenAI API (Chat Agent)
   ├─ Campaigns → CRUD via Supabase
   ├─ Connections → OAuth via Composio
   ├─ Billing → Flutterwave → update credits
   ├─ Analytics → Query `analytics` table
   └─ Settings → Manage profile
   ↓
[ RLS Policies ] → Each user sees only their data




⚙️ Integration Flow
Frontend → Backend → Services → Data Layer
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


⚙️ TECHNOLOGY STACK
Frontend: Next.js 15 (App Router), TypeScript, TailwindCSS, Shadcn/UI


Backend: Supabase (Postgres + Auth + Storage + Edge Functions)


AI: OpenAI GPT API (Chat & Content Generation)


Payments: Flutterwave


Automation: Composio SDK (Reddit/X Integration)


Charts: Plotly


Deployment: Vercel + Supabase Cloud



🧩 DEVELOPMENT PLAN
Phase 1 — Setup & Auth ✅
Scaffold app shell (Landing + Dashboard)


Integrate Supabase Auth + Middleware


Build protected dashboard and user session provider


Phase 2 — Database & Credits ⚙️
Regenerate Supabase schema from codebase


Verify RLS policies and insert triggers


Implement credits and payment flows


Phase 3 — Core AI Modules 🤖
Nexa Chat (OpenAI-powered assistant)


Campaign generator (AI post writer)


Analytics computation and charts


Phase 4 — Automation & Scaling ⚡
Composio integration (Reddit/X posting)


Autonomous posting logic


Weekly reports + insights


Phase 5 — Monetization 💳
Flutterwave subscriptions (Growth, Scale, Enterprise)


Subscription-based feature gating


Profile + settings sync


Phase 6 — Finalization & Release 🚀
Testing & deployment to Vercel


Docs + user onboarding guides


Product Hunt + marketing push



✅ ENDGOAL
A full SaaS platform where users can:
Connect social accounts.


Auto-generate and post AI-written content.


Analyze growth and performance.


Pay for credit/subscription-based access.


This document represents the official Nexa roadmap, structure, and technical plan for the next 12 months.