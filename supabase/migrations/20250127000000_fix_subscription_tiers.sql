-- Fix subscription tier constraints to match new tier system
-- Update plan_type constraint to use 'pro' instead of 'basic' and remove 'enterprise'

-- Drop the existing constraint
ALTER TABLE "public"."user_subscriptions" DROP CONSTRAINT IF EXISTS "user_subscriptions_plan_type_check";

-- Add the new constraint with correct tier names
ALTER TABLE "public"."user_subscriptions" 
ADD CONSTRAINT "user_subscriptions_plan_type_check" 
CHECK ((plan_type = ANY (ARRAY['trial'::text, 'free'::text, 'pro'::text, 'premium'::text])));

-- Update any existing 'basic' records to 'pro' and 'enterprise' to 'premium'
UPDATE "public"."user_subscriptions" 
SET plan_type = 'pro' 
WHERE plan_type = 'basic';

UPDATE "public"."user_subscriptions" 
SET plan_type = 'premium' 
WHERE plan_type = 'enterprise';
