import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export { sql as db }

// Initialize database schema for PostgreSQL
export async function initializeDatabase() {
  try {
    // Create users table (compatible with existing users_sync table)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
        api_key TEXT UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        raw_json JSONB
      )
    `

    // Create campaigns table
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        target_audience TEXT,
        goals TEXT,
        budget DECIMAL(10,2),
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
        channels JSONB,
        content_templates JSONB,
        schedule_config JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        started_at TIMESTAMP WITH TIME ZONE,
        ended_at TIMESTAMP WITH TIME ZONE
      )
    `

    // Create campaign_content table
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_content (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        channel TEXT NOT NULL,
        content_type TEXT NOT NULL CHECK (content_type IN ('post', 'email', 'article', 'ad')),
        title TEXT,
        content TEXT NOT NULL,
        media_urls JSONB,
        hashtags JSONB,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        posted_at TIMESTAMP WITH TIME ZONE,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
        engagement_metrics JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create agent_states table
    await sql`
      CREATE TABLE IF NOT EXISTS agent_states (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'paused', 'completed', 'failed')),
        current_task JSONB,
        completed_tasks JSONB DEFAULT '[]'::jsonb,
        failed_tasks JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        agent_id TEXT NOT NULL REFERENCES agent_states(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        priority INTEGER DEFAULT 0,
        scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        result JSONB,
        error TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3
      )
    `

    // Create analytics_events table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
        content_id TEXT REFERENCES campaign_content(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT
      )
    `

    // Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        flutterwave_tx_ref TEXT UNIQUE,
        flutterwave_tx_id TEXT,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
        payment_method TEXT,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key)`
    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_content_campaign_id ON campaign_content(campaign_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_states_user_id ON agent_states(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`

    console.log("Database initialized successfully with Neon PostgreSQL")
  } catch (error) {
    console.error("Failed to initialize database:", error)
    throw error
  }
}
