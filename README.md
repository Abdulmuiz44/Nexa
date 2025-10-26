# Nexa - Autonomous AI Growth Agent

## 🧩 Introduction

Nexa is an **AI Growth Agent** that autonomously promotes your SaaS or AI product across social platforms like X (Twitter) and Reddit. It generates, posts, engages, and tracks performance intelligently — turning automation into genuine growth.

## ⚙️ Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions)
- **AI Engine:** OpenAI GPT-4
- **Integrations:** Composio SDK (Reddit, X, Flutterwave)
- **Payments & Credits:** Flutterwave API (Credit-based monetization system)
- **Hosting:** Vercel

## 🧠 System Architecture Overview

User ↔ Nexa Web / WhatsApp Interface
↳ Pass messages/requests into a Composio-powered Agent

### Composio Agent (per user)

├── Tools / Toolkits: │   • connectToX(user) │   • connectToReddit(user) │   • generateContent(params) │   • postToX(tweet) │   • postToReddit(post) │   • replyToX(tweetId, content) │   • replyToReddit(commentId, content) │   • fetchAnalyticsX(postId) │   • fetchAnalyticsReddit(postId) │   • maybe "autoEngage" (monitor replies and reply) │ └── Agent logic / instructions: "You are Nexa, the growth agent. Based on user goal, you should generate posts, post them, reply to comments, and engage intelligently across connected platforms."

## 📊 NEXA SUMMARY DIAGRAM

```
Frontend (Next.js)
├── Supabase Auth (JWT)
├── API (Edge Functions)
│   ├── generate_post()
│   ├── schedule_post()
│   ├── publish_post()
│   ├── fetch_analytics()
│   ├── update_subscription()
│   └── cleanup_oauth()
├── AI Agent (OpenAI GPT-4)
│   ├── Campaign understanding
│   ├── Content generation
│   └── Adaptive learning
├── Integrations (Composio SDK)
│   ├── Twitter API
│   ├── Reddit API
│   └── Flutterwave API
└── Database (Supabase PostgreSQL)
├── users
├── connected_accounts
├── campaigns
├── posts
├── analytics
├── subscriptions
├── activity_log
├── composio_connections
├── oauth_states
 ├── credits_wallet
 ├── credit_transactions
 └── payment_history
```

## 🔄 NEXA SYSTEM FLOW DIAGRAM

```
┌────────────────────────┐
     │        Frontend        │
     │ (Next.js Web + WhatsApp│
  │    Interface Layer)    │
  └──────────┬─────────────┘
             │
                ▼
    ┌────────────────────────┐
 │       Supabase         │
    │ (Auth, DB, Storage,    │
    │  RLS, Triggers, etc.)  │
    └──────────┬─────────────┘
                │
                ▼
     ┌────────────────────────┐
     │        Nexa API        │
     │ (Edge functions / API  │
     │ routes for core logic) │
     └──────────┬─────────────┘
                │
                ▼
     ┌────────────────────────┐
     │        OpenAI API      │
     │ (Content generation,   │
     │ analysis, strategy AI) │
     └──────────┬─────────────┘
                │
                ▼
    ┌──────────────────────────┐
    │       Composio Agent      │
    │ (Integration engine for   │
    │ Reddit, X, etc.           │
    │ Tools:                    │
    │   • connectToX            │
    │   • connectToReddit       │
    │   • postToX/postToReddit  │
    │   • replyToX/replyToReddit│
    │   • fetchAnalytics        │
    │   • autoEngage            │
    └──────────┬───────────────┘
               │
               ▼
  ┌────────────────────────────┐
  │  External Platforms (APIs) │
  │   - X (Twitter)            │
  │   - Reddit                 │
  │   - Others (future)        │
  └──────────┬────────────────┘
             │
             ▼
   ┌──────────────────────────┐
   │     Analytics Engine     │
   │ (Track posts, engagement,│
   │ impressions, conversions │
   │  + feedback to Nexa DB)  │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │       Feedback Loop       │
   │ (Supabase ← Analytics ←  │
   │ Composio ← OpenAI)       │
   └──────────────────────────┘
```

## 🚀 Key Features

- AI-driven campaign generation and scheduling
- Autonomous posting & engagement across Reddit and X
- Smart analytics tracking and adaptive feedback loop
- Secure OAuth-based account linking via Composio
- Transparent scheduling & moderation flow for user trust
- Credit-based monetization system (1 credit = $0.10) with wallet management

## 🧾 Database Schema Summary

Key tables:
`users`, `connected_accounts`, `campaigns`, `posts`, `analytics`, `subscriptions`, `activity_log`, `composio_connections`, `oauth_states`, `credits_wallet`, `credit_transactions`, `payment_history`

Each record is protected by Row-Level Security and policy-based access rules. The credit system uses integer credits (1 credit = $0.10) for all transactions.

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key
- Supabase project
- Composio API key
- Flutterwave account (for payments)

### Installation

1. **Clone the repository**
 ```bash
git clone https://github.com/your-username/nexa.git
cd nexa
```

2. **Install dependencies**
```bash
pnpm install
 ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run database migrations**
   ```bash
 # Apply the schema to Supabase
 # Run: supabase db reset (if using Supabase CLI)
   ```

5. **Run development server**
```bash
pnpm dev
```

6. **Start background workers** (in separate terminal)
   ```bash
   pnpm workers
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Composio
COMPOSIO_API_KEY=your_composio_api_key

# Flutterwave (for payments)
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public

# Redis (optional, for production)
REDIS_URL=redis://localhost:6379
```

## 🧪 Testing

```bash
# Run all tests
pnpm run check

# Unit tests
pnpm run test
pnpm run test:watch

# E2E tests
pnpm run test:e2e
```

## 🧩 Deployment Notes

- Deploy on **Vercel** (Frontend + API routes)
- Supabase handles database, storage, and authentication
- Composio SDK manages external platform integrations
- Use environment variables for all API keys and OAuth credentials
- Run background workers on a separate service (Railway, Render, etc.)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.
