-- Add stripe_subscription_id column to user_subscriptions table
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id 
ON user_subscriptions(stripe_subscription_id);
