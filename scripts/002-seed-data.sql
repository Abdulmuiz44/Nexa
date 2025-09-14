-- Updated seed data for PostgreSQL compatibility
-- Seed data for development and testing
-- Insert sample users (passwords are hashed for 'password123')
INSERT INTO users (id, email, password_hash, name, subscription_tier, api_key) VALUES
('user1', 'demo@nexa.ai', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.hl.vHm', 'Demo User', 'pro', 'nexa_demo_key_123456789abcdef'),
('user2', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.hl.vHm', 'Test User', 'free', 'nexa_test_key_987654321fedcba')
ON CONFLICT (id) DO NOTHING;

-- Insert sample campaigns
INSERT INTO campaigns (id, user_id, name, description, target_audience, goals, budget, status, channels, content_templates) VALUES
('camp1', 'user1', 'AI Tool Launch Campaign', 'Launch campaign for new AI productivity tool', 'Tech professionals, entrepreneurs', 'Generate 1000 leads, increase brand awareness', 5000.00, 'active', '["twitter", "linkedin", "email"]'::jsonb, '{"twitter": "Check out our new AI tool! #AI #Productivity", "linkedin": "Introducing our revolutionary AI productivity suite", "email": "Subject: Transform your workflow with AI"}'::jsonb),
('camp2', 'user1', 'SaaS Growth Campaign', 'Growth campaign for SaaS product', 'Small business owners', 'Increase signups by 50%', 3000.00, 'draft', '["twitter", "email"]'::jsonb, '{"twitter": "Grow your business with our SaaS solution", "email": "Subject: Scale your business efficiently"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert sample campaign content
INSERT INTO campaign_content (id, campaign_id, channel, content_type, title, content, hashtags, status) VALUES
('content1', 'camp1', 'twitter', 'post', NULL, 'Excited to announce our new AI productivity tool! It will revolutionize how you work. #AI #Productivity #Innovation', '["AI", "Productivity", "Innovation"]'::jsonb, 'posted'),
('content2', 'camp1', 'linkedin', 'post', 'Introducing Our AI Suite', 'We are thrilled to introduce our comprehensive AI productivity suite designed for modern professionals...', '["AI", "Productivity", "Business"]'::jsonb, 'scheduled'),
('content3', 'camp2', 'email', 'email', 'Transform Your Business Today', 'Dear valued customer, discover how our SaaS solution can help you scale your business efficiently...', '[]'::jsonb, 'draft')
ON CONFLICT (id) DO NOTHING;

-- Insert sample analytics events
INSERT INTO analytics_events (campaign_id, content_id, event_type, event_data) VALUES
('camp1', 'content1', 'impression', '{"platform": "twitter", "count": 1250}'::jsonb),
('camp1', 'content1', 'engagement', '{"platform": "twitter", "likes": 45, "retweets": 12, "replies": 8}'::jsonb),
('camp1', 'content2', 'impression', '{"platform": "linkedin", "count": 890}'::jsonb)
ON CONFLICT (id) DO NOTHING;
