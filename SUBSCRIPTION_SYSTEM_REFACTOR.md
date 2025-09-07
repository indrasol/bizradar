# Subscription System Refactor

## Overview

This document outlines the complete refactor of the BizRadar subscription system to address the foreign key violation error and implement a proper tier-based subscription system with server-side control.

## Problem Analysis

### Original Issue
- **Error**: `psycopg2.errors.ForeignKeyViolation: insert or update on table "user_subscriptions" violates foreign key constraint "user_subscriptions_user_id_auth_fkey"`
- **Root Cause**: Mixed database architecture where backend used direct PostgreSQL with TEXT user_ids, while Supabase expected UUID references to `auth.users`

### Architecture Problems
1. **Database Mismatch**: Backend using direct PostgreSQL, frontend using Supabase
2. **Inconsistent Schema**: Different user_id types (TEXT vs UUID)
3. **Client-Side Logic**: Subscription logic scattered between frontend and backend
4. **No Usage Tracking**: No proper limits or usage monitoring

## Solution: Unified Server-Side Subscription System

### New Architecture

#### 1. Database Schema (Supabase)
```sql
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
```

#### 2. Subscription Tiers

| Tier | Price | Monthly Searches | AI RFP Responses | Features |
|------|-------|------------------|------------------|----------|
| **Free** | $0 | 10 | 2 | Basic tracking, email notifications, basic analytics |
| **Pro** | $29.99 | 100 | 20 | Advanced analytics, priority support |
| **Premium** | $99.99 | Unlimited | 50 | Team collaboration, custom integrations, dedicated support |

#### 3. Server-Side Components

**New Files Created:**
- `backend/app/utils/supabase_subscription.py` - Core subscription management
- `backend/app/routes/subscription_routes.py` - API endpoints
- `supabase/migrations/20250126000000_update_user_subscriptions.sql` - Database migration

**Modified Files:**
- `backend/app/main.py` - Updated to use new subscription system
- `backend/app/routes/search_routes.py` - Added usage tracking
- `frontend/src/api/subscription.ts` - Updated to use server APIs
- `frontend/src/config/apiEndpoints.ts` - Added new endpoints

### Key Features

#### 1. Automatic User Onboarding
- New users automatically get Free tier subscription
- Database trigger creates subscription on user registration

#### 2. Usage Tracking & Limits
- Real-time usage tracking for searches and AI RFP responses
- Automatic limit enforcement with clear error messages
- Monthly usage reset (via cron job)

#### 3. Server-Side Control
- All subscription logic handled server-side
- Frontend only displays status and triggers actions
- Secure validation of subscription access

#### 4. Comprehensive API

**New Endpoints:**
- `GET /api/subscription/status` - Get subscription status
- `GET /api/subscription/tiers` - Get available tiers
- `POST /api/subscription/upgrade` - Upgrade subscription
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/trial` - Start trial
- `GET /api/subscription/usage` - Get usage stats
- `POST /api/subscription/usage/increment` - Increment usage
- `GET /api/subscription/feature-access/{feature}` - Check feature access

## Implementation Details

### 1. Subscription Manager Class

The `SubscriptionManager` class in `supabase_subscription.py` handles:
- User subscription CRUD operations
- Usage tracking and limit enforcement
- Feature access control
- Trial management
- Automatic downgrades/upgrades

### 2. Route Integration

**Search Routes:**
```python
# Before search execution
check_and_increment_usage(user_id, "search")
```

**RFP Enhancement Routes:**
```python
# Before AI RFP generation
check_and_increment_usage(user_id, "ai_rfp")
```

### 3. Frontend Integration

**Updated Subscription API:**
- Uses server endpoints instead of direct Supabase queries
- Maintains compatibility with existing components
- Adds new methods for usage tracking

## Migration Steps

### 1. Database Migration
```bash
npx supabase migration up --local
```

### 2. Backend Updates
- New subscription system automatically handles existing users
- Old subscription logic replaced with new system
- Usage tracking integrated into search and RFP routes

### 3. Frontend Updates
- Subscription API updated to use server endpoints
- Existing components continue to work
- New usage tracking capabilities available

## Benefits

### 1. Resolved Issues
- ✅ Fixed foreign key violation error
- ✅ Unified database architecture
- ✅ Server-side subscription control
- ✅ Proper usage tracking and limits

### 2. New Capabilities
- ✅ Tier-based subscription system
- ✅ Real-time usage monitoring
- ✅ Automatic limit enforcement
- ✅ Feature-based access control
- ✅ Trial management
- ✅ Comprehensive API

### 3. Security & Reliability
- ✅ All subscription logic server-side
- ✅ Secure validation of access
- ✅ Consistent data model
- ✅ Proper error handling

## Usage Examples

### Check Subscription Status
```python
# Backend
status = subscription_manager.get_subscription_status(user_id)

# Frontend
const status = await subscriptionApi.getStatus(user.id);
```

### Increment Usage
```python
# Backend (automatic in search routes)
check_and_increment_usage(user_id, "search")

# Frontend (if needed)
await subscriptionApi.incrementUsage("search");
```

### Check Feature Access
```python
# Backend
has_access = subscription_manager.check_feature_access(user_id, "advanced_search")

# Frontend
const access = await subscriptionApi.checkFeatureAccess("advanced_search");
```

## Testing

### 1. Test Subscription Creation
- Register new user → Should get Free tier automatically
- Check database → Subscription record created

### 2. Test Usage Tracking
- Perform search → Usage incremented
- Reach limit → Proper error message
- Upgrade tier → Limits updated

### 3. Test API Endpoints
- All new endpoints return proper responses
- Error handling works correctly
- Authentication required where needed

## Future Enhancements

1. **Analytics Dashboard** - Usage analytics for admins
2. **Billing Integration** - Automated Stripe billing cycles
3. **Team Management** - Multi-user subscriptions
4. **API Rate Limiting** - Additional protection layers
5. **Usage Alerts** - Notify users approaching limits

## Conclusion

The refactored subscription system provides a robust, scalable foundation for BizRadar's subscription management. It resolves the immediate foreign key violation issue while establishing a comprehensive tier-based system with proper server-side control and usage tracking.

All existing functionality is preserved while adding significant new capabilities for subscription management and usage monitoring.
