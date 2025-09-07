-- Create user_addons table for tracking subscription add-ons
CREATE TABLE IF NOT EXISTS user_addons (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    addon_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_addons_status_check CHECK (status IN ('active', 'cancelled', 'expired')),
    CONSTRAINT user_addons_addon_type_check CHECK (addon_type IN ('rfp_boost_pack')),
    CONSTRAINT user_addons_user_addon_unique UNIQUE (user_id, addon_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_addons_user_id ON user_addons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_status ON user_addons(status);
CREATE INDEX IF NOT EXISTS idx_user_addons_addon_type ON user_addons(addon_type);

-- Add addon_info column to user_subscriptions table if it doesn't exist
-- This provides a fallback for tracking add-ons in the subscription record
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'addon_info'
    ) THEN
        ALTER TABLE user_subscriptions ADD COLUMN addon_info JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create an index on the addon_info column for better JSON queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_addon_info ON user_subscriptions USING GIN (addon_info);
