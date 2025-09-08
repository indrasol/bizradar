# Database Schema Fix for Subscription System

## Issue
The subscription API is returning 500 errors because the `user_subscriptions` table is missing required columns:
- `monthly_searches_used`
- `ai_rfp_responses_used`

## Solution
Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Add missing usage tracking columns
ALTER TABLE "public"."user_subscriptions" 
ADD COLUMN IF NOT EXISTS "monthly_searches_used" INTEGER DEFAULT 0;

ALTER TABLE "public"."user_subscriptions" 
ADD COLUMN IF NOT EXISTS "ai_rfp_responses_used" INTEGER DEFAULT 0;

-- Update plan_type constraint to support new tier names
ALTER TABLE "public"."user_subscriptions" 
DROP CONSTRAINT IF EXISTS "user_subscriptions_plan_type_check";

ALTER TABLE "public"."user_subscriptions" 
ADD CONSTRAINT "user_subscriptions_plan_type_check" 
CHECK ((plan_type = ANY (ARRAY['trial'::text, 'free'::text, 'pro'::text, 'premium'::text])));

-- Update existing records to use new tier names
UPDATE "public"."user_subscriptions" 
SET plan_type = 'pro' 
WHERE plan_type = 'basic';

UPDATE "public"."user_subscriptions" 
SET plan_type = 'premium' 
WHERE plan_type = 'enterprise';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_monthly_searches 
ON "public"."user_subscriptions"("monthly_searches_used");

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_ai_rfp_responses 
ON "public"."user_subscriptions"("ai_rfp_responses_used");
```

## Steps to Fix
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the above SQL commands
4. Execute them
5. Restart your backend server

## Verification
After running the SQL commands, test the subscription API:
```bash
cd backend
python -c "
from app.utils.supabase_subscription import subscription_manager
import uuid
test_user_id = str(uuid.uuid4())
result = subscription_manager.get_subscription_status(test_user_id, create_if_missing=True)
print('Success! Created subscription:', result.get('plan_type'))
"
```

This should now work without errors.
