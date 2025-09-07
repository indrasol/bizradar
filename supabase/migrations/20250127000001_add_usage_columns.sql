-- Add missing usage tracking columns to user_subscriptions table
-- These columns are needed for the new subscription system

-- Add the missing columns if they don't exist
ALTER TABLE "public"."user_subscriptions" 
ADD COLUMN IF NOT EXISTS "monthly_searches_used" INTEGER DEFAULT 0;

ALTER TABLE "public"."user_subscriptions" 
ADD COLUMN IF NOT EXISTS "ai_rfp_responses_used" INTEGER DEFAULT 0;

-- Add indexes for performance on usage columns
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_monthly_searches ON "public"."user_subscriptions"("monthly_searches_used");
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ai_rfp_responses ON "public"."user_subscriptions"("ai_rfp_responses_used");
