import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function setupDatabase() {
  console.log("Setting up Nexa AI database...")

  try {
    // Create users table (extending the existing users_sync)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT,
        api_key TEXT UNIQUE,
        subscription_tier TEXT DEFAULT 'free',
        credits_remaining INTEGER DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create campaigns table
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        target_audience JSONB,
        channels JSONB DEFAULT '[]'::jsonb,
        content_strategy JSONB,
        status TEXT DEFAULT 'draft',
        budget DECIMAL(10,2),
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create agent_runs table
    await sql`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        config JSONB NOT NULL,
        results JSONB,
        logs JSONB DEFAULT '[]'::jsonb,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT
      );
    `

    // Create content_generated table
    await sql`
      CREATE TABLE IF NOT EXISTS content_generated (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        agent_run_id TEXT REFERENCES agent_runs(id) ON DELETE CASCADE,
        channel TEXT NOT NULL,
        content_type TEXT NOT NULL,
        content JSONB NOT NULL,
        metadata JSONB,
        status TEXT DEFAULT 'draft',
        scheduled_for TIMESTAMP WITH TIME ZONE,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create analytics table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        content_id TEXT REFERENCES content_generated(id) ON DELETE CASCADE,
        metric_name TEXT NOT NULL,
        metric_value DECIMAL(15,4),
        metadata JSONB,
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create payments table
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        transaction_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create onboarding table
    await sql`
      CREATE TABLE IF NOT EXISTS onboarding (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        company_name TEXT,
        brand_voice TEXT,
        content_pillars TEXT,
        target_audience TEXT,
        twitter TEXT,
        linkedin TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `

    // Secure the onboarding table with Row Level Security
    await sql`ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;`
    await sql`
      CREATE POLICY "Allow users to read their own onboarding data" 
      ON onboarding 
      FOR SELECT 
      USING (auth.uid() = user_id);
    `
    await sql`
      CREATE POLICY "Allow users to create their own onboarding data" 
      ON onboarding 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    `
    await sql`
      CREATE POLICY "Allow users to update their own onboarding data" 
      ON onboarding 
      FOR UPDATE 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_runs_campaign_id ON agent_runs(campaign_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_content_campaign_id ON content_generated(campaign_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_campaign_id ON analytics(campaign_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);`

    // Insert sample data
    const sampleUserId = "sample-user-" + Date.now()
    await sql`
      INSERT INTO users (id, email, name, api_key, subscription_tier, credits_remaining)
      VALUES (${sampleUserId}, 'demo@nexa.ai', 'Demo User', 'nexa_' || gen_random_uuid()::text, 'pro', 1000)
      ON CONFLICT (email) DO NOTHING;
    `

    const sampleCampaignId = "sample-campaign-" + Date.now()
    await sql`
      INSERT INTO campaigns (id, user_id, name, description, target_audience, channels, status)
      VALUES (
        ${sampleCampaignId},
        ${sampleUserId},
        'AI Product Launch Campaign',
        'Launch campaign for our new AI-powered growth agent',
        '{"demographics": {"age": "25-45", "interests": ["AI", "Marketing", "SaaS"]}}',
        '["twitter", "linkedin", "email"]',
        'active'
      )
      ON CONFLICT DO NOTHING;
    `

    console.log("✅ Database setup completed successfully!")
    console.log("✅ Sample data inserted")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    throw error
  }
}

setupDatabase().catch(console.error)
