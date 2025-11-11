-- =====================================================
-- MIGRATION: Add 5 New Features
-- 1. Human-in-the-Loop Approval Workflow
-- 2. Content Performance Intelligence
-- 3. Content Repurposing Engine
-- 4. Community Engagement Suite
-- 5. Growth Experiments Framework
-- =====================================================

-- Create enums for new features
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'edited');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experiment_status') THEN
    CREATE TYPE experiment_status AS ENUM ('draft', 'running', 'completed', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engagement_action') THEN
    CREATE TYPE engagement_action AS ENUM ('like', 'retweet', 'reply', 'quote', 'upvote', 'comment');
  END IF;
END $$;

-- =====================================================
-- 1. APPROVAL WORKFLOW TABLES
-- =====================================================

-- Post approvals table
CREATE TABLE IF NOT EXISTS post_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status approval_status DEFAULT 'pending',
    original_content TEXT NOT NULL,
    edited_content TEXT,
    feedback TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning feedback table (tracks user edits to improve AI)
CREATE TABLE IF NOT EXISTS learning_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    original_content TEXT NOT NULL,
    edited_content TEXT NOT NULL,
    edit_type TEXT NOT NULL, -- 'tone', 'length', 'format', 'content', 'other'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CONTENT PERFORMANCE INTELLIGENCE TABLES
-- =====================================================

-- Performance insights table
CREATE TABLE IF NOT EXISTS performance_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'best_time', 'best_format', 'trending_topic', 'competitor_benchmark'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
    action_recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Content performance metrics (aggregated)
CREATE TABLE IF NOT EXISTS content_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    platform platform_type NOT NULL,
    total_posts INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_engagements INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(5,4) DEFAULT 0,
    top_performing_content_type TEXT,
    best_posting_hour INTEGER,
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CONTENT REPURPOSING ENGINE TABLES
-- =====================================================

-- Content sources table
CREATE TABLE IF NOT EXISTS content_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'blog', 'article', 'youtube', 'podcast', 'document'
    source_url TEXT,
    title TEXT NOT NULL,
    raw_content TEXT NOT NULL,
    extracted_points JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repurposed content table (tracks posts generated from sources)
CREATE TABLE IF NOT EXISTS repurposed_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    angle TEXT NOT NULL, -- 'tip', 'question', 'statistic', 'quote', 'how-to', 'thread'
    generated_content TEXT NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. COMMUNITY ENGAGEMENT SUITE TABLES
-- =====================================================

-- Engagement opportunities table
CREATE TABLE IF NOT EXISTS engagement_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    opportunity_type TEXT NOT NULL, -- 'mention', 'keyword_match', 'trending_topic', 'competitor_post'
    platform_post_id TEXT NOT NULL,
    platform_post_url TEXT,
    author_username TEXT,
    content TEXT NOT NULL,
    relevance_score INTEGER DEFAULT 0, -- 0-100
    suggested_response TEXT,
    engaged BOOLEAN DEFAULT false,
    engaged_at TIMESTAMP WITH TIME ZONE,
    engagement_type engagement_action,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engagement tracking table
CREATE TABLE IF NOT EXISTS engagement_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES engagement_opportunities(id) ON DELETE SET NULL,
    platform platform_type NOT NULL,
    action engagement_action NOT NULL,
    platform_post_id TEXT NOT NULL,
    response_content TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. GROWTH EXPERIMENTS FRAMEWORK TABLES
-- =====================================================

-- Experiments table
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT NOT NULL,
    experiment_type TEXT NOT NULL, -- 'time', 'content_format', 'cta', 'emoji', 'length', 'hook'
    status experiment_status DEFAULT 'draft',
    control_variant JSONB NOT NULL, -- Original variant
    test_variants JSONB DEFAULT '[]', -- Array of test variants
    sample_size_per_variant INTEGER DEFAULT 10,
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    winner_variant_index INTEGER,
    statistical_significance DECIMAL(5,4),
    results_summary JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment variants (detailed tracking)
CREATE TABLE IF NOT EXISTS experiment_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_index INTEGER NOT NULL,
    variant_name TEXT NOT NULL,
    variant_config JSONB NOT NULL,
    posts_count INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_engagements INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(5,4) DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Approval workflow indexes
CREATE INDEX IF NOT EXISTS idx_post_approvals_user_id ON post_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_post_id ON post_approvals(post_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_status ON post_approvals(status);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_user_id ON learning_feedback(user_id);

-- Performance intelligence indexes
CREATE INDEX IF NOT EXISTS idx_performance_insights_user_id ON performance_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_insights_type ON performance_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_content_performance_metrics_user_id ON content_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_metrics_period ON content_performance_metrics(period_start, period_end);

-- Content repurposing indexes
CREATE INDEX IF NOT EXISTS idx_content_sources_user_id ON content_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_content_sources_processed ON content_sources(processed);
CREATE INDEX IF NOT EXISTS idx_repurposed_content_source_id ON repurposed_content(source_id);
CREATE INDEX IF NOT EXISTS idx_repurposed_content_user_id ON repurposed_content(user_id);
CREATE INDEX IF NOT EXISTS idx_repurposed_content_used ON repurposed_content(used);

-- Engagement suite indexes
CREATE INDEX IF NOT EXISTS idx_engagement_opportunities_user_id ON engagement_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_opportunities_engaged ON engagement_opportunities(engaged);
CREATE INDEX IF NOT EXISTS idx_engagement_opportunities_platform ON engagement_opportunities(platform);
CREATE INDEX IF NOT EXISTS idx_engagement_opportunities_score ON engagement_opportunities(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_tracking_user_id ON engagement_tracking(user_id);

-- Experiments indexes
CREATE INDEX IF NOT EXISTS idx_experiments_user_id ON experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id ON experiment_variants(experiment_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_post_approvals_updated_at BEFORE UPDATE ON post_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_sources_updated_at BEFORE UPDATE ON content_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiment_variants_updated_at BEFORE UPDATE ON experiment_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurposed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Post approvals policies
CREATE POLICY "Users can view own post approvals" ON post_approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own post approvals" ON post_approvals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own post approvals" ON post_approvals FOR UPDATE USING (auth.uid() = user_id);

-- Learning feedback policies
CREATE POLICY "Users can view own learning feedback" ON learning_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning feedback" ON learning_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance insights policies
CREATE POLICY "Users can view own performance insights" ON performance_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own performance insights" ON performance_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own content performance metrics" ON content_performance_metrics FOR SELECT USING (auth.uid() = user_id);

-- Content sources policies
CREATE POLICY "Users can view own content sources" ON content_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content sources" ON content_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content sources" ON content_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content sources" ON content_sources FOR DELETE USING (auth.uid() = user_id);

-- Repurposed content policies
CREATE POLICY "Users can view own repurposed content" ON repurposed_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own repurposed content" ON repurposed_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own repurposed content" ON repurposed_content FOR UPDATE USING (auth.uid() = user_id);

-- Engagement opportunities policies
CREATE POLICY "Users can view own engagement opportunities" ON engagement_opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own engagement opportunities" ON engagement_opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own engagement opportunities" ON engagement_opportunities FOR UPDATE USING (auth.uid() = user_id);

-- Engagement tracking policies
CREATE POLICY "Users can view own engagement tracking" ON engagement_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own engagement tracking" ON engagement_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Experiments policies
CREATE POLICY "Users can view own experiments" ON experiments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own experiments" ON experiments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiments" ON experiments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own experiments" ON experiments FOR DELETE USING (auth.uid() = user_id);

-- Experiment variants policies
CREATE POLICY "Users can view experiment variants" ON experiment_variants FOR SELECT USING (EXISTS (SELECT 1 FROM experiments WHERE id = experiment_variants.experiment_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert experiment variants" ON experiment_variants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM experiments WHERE id = experiment_variants.experiment_id AND user_id = auth.uid()));
CREATE POLICY "Users can update experiment variants" ON experiment_variants FOR UPDATE USING (EXISTS (SELECT 1 FROM experiments WHERE id = experiment_variants.experiment_id AND user_id = auth.uid()));
