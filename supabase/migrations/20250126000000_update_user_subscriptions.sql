-- Update user_subscriptions table for tier-based subscription system
-- This migration ensures compatibility with the new subscription system

-- First, drop the existing table if it has incompatible constraints
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Recreate user_subscriptions table with proper structure
CREATE TABLE user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'cancelled', 'expired')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    monthly_searches_used INTEGER DEFAULT 0,
    ai_rfp_responses_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own subscription
CREATE POLICY "Users can read own subscription" ON user_subscriptions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own subscription (for usage tracking)
CREATE POLICY "Users can update own subscription" ON user_subscriptions
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON user_subscriptions
    FOR ALL TO service_role
    USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create free tier subscription for new users
CREATE OR REPLACE FUNCTION create_free_subscription_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_subscriptions (user_id, plan_type, status, start_date)
    VALUES (NEW.id, 'free', 'active', NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create free subscription for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_free_subscription_for_new_user();

-- Insert default free subscriptions for existing users (if any)
INSERT INTO user_subscriptions (user_id, plan_type, status, start_date)
SELECT 
    id,
    'free',
    'active',
    NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
