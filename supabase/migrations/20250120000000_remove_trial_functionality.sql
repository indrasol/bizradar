-- Update plan types migration
-- This migration updates plan types to Basic, Pro, Premium and creates basic subscriptions for existing users

-- First, remove all trial subscriptions
DELETE FROM user_subscriptions WHERE plan_type = 'trial';

-- Update existing subscriptions to basic if they are free or enterprise
UPDATE user_subscriptions 
SET plan_type = 'basic' 
WHERE plan_type IN ('free', 'enterprise');

-- Drop the existing constraint
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_type_check;

-- Add the new constraint with new plan types
ALTER TABLE user_subscriptions 
ADD CONSTRAINT user_subscriptions_plan_type_check 
CHECK (plan_type IN ('basic', 'pro', 'premium'));

-- Validate the constraint
ALTER TABLE user_subscriptions VALIDATE CONSTRAINT user_subscriptions_plan_type_check;

-- Ensure user_id column is UUID type (in case it was created as TEXT)
ALTER TABLE user_subscriptions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Fix foreign key constraint to point to auth.users instead of users
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
