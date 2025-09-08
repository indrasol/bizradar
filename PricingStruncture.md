# BizRadar Pricing Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for BizRadar's new pricing structure, including database changes, backend modifications, frontend updates, and cost optimization strategies.

## Current State vs Target State

### Current Pricing Structure
- **Basic Plan**: Free
- **Pro Plan**: $29.99/month
- **Premium Plan**: $99.99/month
- **Features**: Basic opportunity tracking, limited AI features
- **Limitations**: No usage tracking, no token counting, no limit enforcement

### Target Pricing Structure

| Plan | Price | Monthly Cost | Key Features |
|------|-------|--------------|--------------|
| **Basic (Free)** | $0 | $25 | Unlimited searches + limited results, 5 AI recommendations, 2 RFP drafts |
| **Pro** | $50 | $35 | Unlimited searches, unlimited pursuits + AI, 5 AI recommendations, 5 RFP drafts |
| **Premium** | $99.9 | $35-55 | Unlimited searches, unlimited pursuits + alerts + AI, 5 AI recommendations, 10 RFP drafts |

### Feature Restrictions by Plan

| Feature | Basic (Free) | Pro | Premium |
|---------|--------------|-----|---------|
| **Searches** | Unlimited (limited results) | Unlimited | Unlimited |
| **AI Recommendations** | 5/month | 5/month | 5/month |
| **RFP Drafts** | 2/month | 5/month | 10/month |
| **AI for Pursuits (Ask BizRadar AI)** | ❌ **BLOCKED** | ✅ Unlimited | ✅ Unlimited |
| **AI RFP Enhancement** | 2/month | ✅ Unlimited | ✅ Unlimited |
| **Pursuits** | Basic tracking only | Unlimited + AI | Unlimited + AI + Alerts |

## Implementation Roadmap

### Phase 1: Database Schema & Backend Foundation
### Phase 2: Usage Tracking & Limit Enforcement
### Phase 3: Frontend Updates & UI Components
### Phase 4: Email Alerts System
### Phase 5: Testing & Migration

---

## Phase 1: Database Schema & Backend Foundation

### 1.1 Database Schema Changes

#### New Tables

```sql
-- Usage tracking table (simplified - no token tracking)
CREATE TABLE user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: "2024-01"
    searches_count INTEGER DEFAULT 0,
    rfp_drafts_count INTEGER DEFAULT 0,
    ai_recommendations_count INTEGER DEFAULT 0,
    pursuits_count INTEGER DEFAULT 0,
    ai_pursuits_count INTEGER DEFAULT 0,  -- AI for Pursuits usage
    ai_rfp_enhancements_count INTEGER DEFAULT 0,  -- AI RFP enhancement usage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Plan limits configuration
CREATE TABLE plan_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_type VARCHAR(20) NOT NULL UNIQUE,
    monthly_searches INTEGER,
    monthly_rfp_drafts INTEGER,
    monthly_ai_recommendations INTEGER,
    monthly_pursuits INTEGER,
    monthly_ai_pursuits INTEGER,  -- AI for Pursuits limit
    monthly_ai_rfp_enhancements INTEGER,  -- AI RFP enhancement limit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature access control
CREATE TABLE feature_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_type VARCHAR(20) NOT NULL,
    feature_name VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    monthly_limit INTEGER NULL,  -- NULL = unlimited
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_type, feature_name)
);

-- Email alerts for pursuits
CREATE TABLE pursuit_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pursuit_id UUID REFERENCES pursuits(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ NOT NULL,
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Plan Limits Configuration

```sql
-- Insert plan limits
INSERT INTO plan_limits (plan_type, monthly_searches, monthly_rfp_drafts, monthly_ai_recommendations, monthly_pursuits, monthly_ai_pursuits, monthly_ai_rfp_enhancements) VALUES
('basic', NULL, 2, 5, NULL, 0, 2),     -- AI features limited for basic
('pro', NULL, 5, 5, NULL, NULL, NULL),       -- AI features unlimited
('premium', NULL, 10, 5, NULL, NULL, NULL); -- AI features unlimited, 5 recommendations

-- Insert feature access control
INSERT INTO feature_access (plan_type, feature_name, is_enabled, monthly_limit) VALUES
-- Basic Plan
('basic', 'searches', true, NULL),
('basic', 'ai_recommendations', true, 5),
('basic', 'rfp_drafts', true, 2),
('basic', 'pursuits', true, NULL),
('basic', 'ai_pursuits', false, 0),  -- BLOCKED
('basic', 'ai_rfp_enhancements', true, 2),  -- LIMITED to 2

-- Pro Plan
('pro', 'searches', true, NULL),
('pro', 'ai_recommendations', true, 5),
('pro', 'rfp_drafts', true, 5),
('pro', 'pursuits', true, NULL),
('pro', 'ai_pursuits', true, NULL),  -- UNLIMITED
('pro', 'ai_rfp_enhancements', true, NULL),  -- UNLIMITED

-- Premium Plan
('premium', 'searches', true, NULL),
('premium', 'ai_recommendations', true, 5),
('premium', 'rfp_drafts', true, 10),
('premium', 'pursuits', true, NULL),
('premium', 'ai_pursuits', true, NULL),  -- UNLIMITED
('premium', 'ai_rfp_enhancements', true, NULL);  -- UNLIMITED
```

### 1.2 Backend Service Files

#### New Service Files

**`backend/app/services/usage_tracker.py`**
```python
from datetime import datetime
from typing import Dict, Any, Optional
from app.utils.db_utils import get_db_connection

class UsageTracker:
    @staticmethod
    def get_current_month() -> str:
        """Get current month in YYYY-MM format"""
        return datetime.now().strftime("%Y-%m")
    
    @staticmethod
    def get_usage_status(user_id: str) -> Dict[str, Any]:
        """Get current month usage status for all features"""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                current_month = UsageTracker.get_current_month()
                cursor.execute("""
                    SELECT searches_count, rfp_drafts_count, ai_recommendations_count, 
                           pursuits_count, ai_pursuits_count, ai_rfp_enhancements_count
                    FROM user_usage 
                    WHERE user_id = %s AND month_year = %s
                """, (user_id, current_month))
                
                usage = cursor.fetchone()
                if not usage:
                    return {
                        "searches": {"used": 0, "limit": None},
                        "rfpDrafts": {"used": 0, "limit": None},
                        "recommendations": {"used": 0, "limit": None},
                        "pursuits": {"used": 0, "limit": None},
                        "aiPursuits": {"used": 0, "limit": None},
                        "aiRfpEnhancements": {"used": 0, "limit": None}
                    }
                
                # Get user's plan limits
                from app.services.plan_limits import PlanLimits
                limits = PlanLimits.get_plan_limits(user_id)
                
                return {
                    "searches": {"used": usage[0], "limit": limits.get("searches")},
                    "rfpDrafts": {"used": usage[1], "limit": limits.get("rfp_drafts")},
                    "recommendations": {"used": usage[2], "limit": limits.get("ai_recommendations")},
                    "pursuits": {"used": usage[3], "limit": limits.get("pursuits")},
                    "aiPursuits": {"used": usage[4], "limit": limits.get("ai_pursuits")},
                    "aiRfpEnhancements": {"used": usage[5], "limit": limits.get("ai_rfp_enhancements")}
                }
        finally:
            conn.close()
    
    @staticmethod
    def increment_usage(user_id: str, feature: str) -> None:
        """Increment usage counter for a feature"""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                current_month = UsageTracker.get_current_month()
                
                # Map feature names to database columns
                feature_map = {
                    'searches': 'searches_count',
                    'rfp_drafts': 'rfp_drafts_count',
                    'ai_recommendations': 'ai_recommendations_count',
                    'pursuits': 'pursuits_count',
                    'ai_pursuits': 'ai_pursuits_count',
                    'ai_rfp_enhancements': 'ai_rfp_enhancements_count'
                }
                
                column = feature_map.get(feature)
                if not column:
                    raise ValueError(f"Unknown feature: {feature}")
                
                # Upsert usage record
                cursor.execute(f"""
                    INSERT INTO user_usage (user_id, month_year, {column})
                    VALUES (%s, %s, 1)
                    ON CONFLICT (user_id, month_year)
                    DO UPDATE SET 
                        {column} = user_usage.{column} + 1,
                        updated_at = NOW()
                """, (user_id, current_month))
                
                conn.commit()
        finally:
            conn.close()
    
    @staticmethod
    def check_usage_limits(user_id: str, feature: str) -> bool:
        """Check if user has remaining usage for a feature"""
        from app.services.plan_limits import PlanLimits
        
        # Check if feature is enabled for user's plan
        if not PlanLimits.is_feature_enabled(user_id, feature):
            return False
        
        # Check if feature has limits
        limits = PlanLimits.get_plan_limits(user_id)
        feature_limit = limits.get(feature)
        
        if feature_limit is None:  # Unlimited
            return True
        
        # Get current usage
        usage_status = UsageTracker.get_usage_status(user_id)
        feature_usage = usage_status.get(feature, {}).get("used", 0)
        
        return feature_usage < feature_limit
```

**`backend/app/services/plan_limits.py`**
```python
from typing import Dict, Any, Optional
from app.utils.db_utils import get_db_connection
from app.utils.subscription import _fetch_user_subscription

class PlanLimits:
    @staticmethod
    def get_plan_limits(user_id: str) -> Dict[str, Any]:
        """Get limits for user's current plan"""
        # Get user's subscription
        sub = _fetch_user_subscription(user_id)
        if not sub:
            return {}
        
        plan_type = sub.get("plan_type", "basic")
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT monthly_searches, monthly_rfp_drafts, monthly_ai_recommendations,
                           monthly_pursuits, monthly_ai_pursuits, monthly_ai_rfp_enhancements
                    FROM plan_limits 
                    WHERE plan_type = %s
                """, (plan_type,))
                
                limits = cursor.fetchone()
                if not limits:
                    return {}
                
                return {
                    "searches": limits[0],
                    "rfp_drafts": limits[1],
                    "ai_recommendations": limits[2],
                    "pursuits": limits[3],
                    "ai_pursuits": limits[4],
                    "ai_rfp_enhancements": limits[5]
                }
        finally:
            conn.close()
    
    @staticmethod
    def is_feature_enabled(user_id: str, feature: str) -> bool:
        """Check if feature is enabled for user's plan"""
        sub = _fetch_user_subscription(user_id)
        if not sub:
            return False
        
        plan_type = sub.get("plan_type", "basic")
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT is_enabled FROM feature_access 
                    WHERE plan_type = %s AND feature_name = %s
                """, (plan_type, feature))
                
                result = cursor.fetchone()
                return result[0] if result else False
        finally:
            conn.close()
    
    @staticmethod
    def is_unlimited(plan_type: str, feature: str) -> bool:
        """Check if feature is unlimited for plan"""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT monthly_limit FROM feature_access 
                    WHERE plan_type = %s AND feature_name = %s
                """, (plan_type, feature))
                
                result = cursor.fetchone()
                return result[0] is None if result else False
        finally:
            conn.close()
```

---

## Phase 2: Usage Tracking & Limit Enforcement

### 2.1 API Endpoint Updates

#### AI RFP Enhancement Endpoint

**`backend/app/routes/search_routes.py` - NEW ENDPOINT**

```python
@search_router.post("/enhance-rfp-with-ai")
async def enhance_rfp_with_ai(request: Request):
    """Enhance RFP document with AI - with usage limits"""
    try:
        data = await request.json()
        user_id = data.get('user_id', 'anonymous')
        
        # Check if AI RFP enhancement is enabled for user's plan
        if not PlanLimits.is_feature_enabled(user_id, 'ai_rfp_enhancements'):
            raise HTTPException(
                status_code=402, 
                detail="AI RFP enhancement is only available in Pro and Premium plans. Please upgrade your plan."
            )
        
        # Check usage limits
        if not UsageTracker.check_usage_limits(user_id, 'ai_rfp_enhancements'):
            raise HTTPException(
                status_code=402, 
                detail="Monthly AI RFP enhancement limit reached. Please upgrade your plan."
            )
        
        # ... AI enhancement logic ...
        
        # Track usage
        UsageTracker.increment_usage(user_id, 'ai_rfp_enhancements')
        
        return {"success": True, "enhanced_content": enhanced_content}
        
    except Exception as e:
        logger.error(f"AI RFP enhancement error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### AI for Pursuits Endpoint

**`backend/app/routes/search_routes.py` - NEW ENDPOINT**

```python
@search_router.post("/ask-bizradar-ai")
async def ask_bizradar_ai(request: Request):
    """Ask BizRadar AI for pursuit assistance - PRO/PREMIUM ONLY"""
    try:
        data = await request.json()
        user_id = data.get('user_id', 'anonymous')
        
        # Check if AI for Pursuits is enabled for user's plan
        if not PlanLimits.is_feature_enabled(user_id, 'ai_pursuits'):
            raise HTTPException(
                status_code=402, 
                detail="AI for Pursuits is only available in Pro and Premium plans. Please upgrade your plan."
            )
        
        # Check usage limits
        if not UsageTracker.check_usage_limits(user_id, 'ai_pursuits'):
            raise HTTPException(
                status_code=402, 
                detail="Monthly AI for Pursuits limit reached. Please upgrade your plan."
            )
        
        # ... AI pursuit logic ...
        
        # Track usage
        UsageTracker.increment_usage(user_id, 'ai_pursuits')
        
        return {"success": True, "ai_response": ai_response}
        
    except Exception as e:
        logger.error(f"AI for Pursuits error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Phase 3: Frontend Updates & UI Components

### 3.1 Updated Models

**`frontend/src/models/subscription.ts` - Updates**

```typescript
export type PlanType = 'basic' | 'pro' | 'premium';

export interface UsageLimits {
  searches: number | null; // null = unlimited
  rfpDrafts: number | null;
  recommendations: number | null;
  pursuits: number | null;
  aiPursuits: number | null;  // AI for Pursuits
  aiRfpEnhancements: number | null;  // AI RFP enhancements
}

export interface FeatureAccess {
  searches: boolean;
  rfpDrafts: boolean;
  recommendations: boolean;
  pursuits: boolean;
  aiPursuits: boolean;  // AI for Pursuits
  aiRfpEnhancements: boolean;  // AI RFP enhancements
}

export interface SubscriptionPlan {
  type: PlanType;
  name: string;
  price: number;
  features: string[];
  description: string;
  limits: UsageLimits;
  featureAccess: FeatureAccess;
  estimatedCost: string;
}
```

### 3.2 Updated API Service

**`frontend/src/api/subscription.ts` - Updates**

```typescript
export const subscriptionApi = {
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    return [
      {
        type: 'basic',
        name: 'Basic Plan (Free)',
        price: 0,
        features: [
          'Unlimited searches + limited results',
          'Up to 5 AI recommendations',
          '2 AI RFP drafts/month',
          '2 AI RFP enhancements/month',
          'Basic opportunity tracking',
          'Email notifications'
        ],
        description: 'Perfect for getting started',
        limits: {
          searches: null, // unlimited
          rfpDrafts: 2,
          recommendations: 5,
          pursuits: null,
          aiPursuits: 0,  // BLOCKED
          aiRfpEnhancements: 2  // LIMITED to 2
        },
        featureAccess: {
          searches: true,
          rfpDrafts: true,
          recommendations: true,
          pursuits: true,
          aiPursuits: false,  // BLOCKED
          aiRfpEnhancements: true  // ENABLED with limits
        },
        estimatedCost: '$25/month'
      },
      {
        type: 'pro',
        name: 'Pro Plan',
        price: 50,
        features: [
          'Unlimited searches',
          'Unlimited pursuits + AI for pursuits',
          'Up to 5 AI recommendations',
          '5 AI RFP drafts/month',
          'Unlimited AI RFP enhancement',
          'Advanced analytics',
          'Priority support'
        ],
        description: 'Ideal for growing businesses',
        limits: {
          searches: null,
          rfpDrafts: 5,
          recommendations: 5,
          pursuits: null,
          aiPursuits: null,  // UNLIMITED
          aiRfpEnhancements: null  // UNLIMITED
        },
        featureAccess: {
          searches: true,
          rfpDrafts: true,
          recommendations: true,
          pursuits: true,
          aiPursuits: true,  // ENABLED
          aiRfpEnhancements: true  // ENABLED
        },
        estimatedCost: '$35/month'
      },
      {
        type: 'premium',
        name: 'Premium Plan',
        price: 99.9,
        features: [
          'Unlimited searches',
          'Unlimited pursuits + alerts + AI',
          'Up to 5 AI recommendations',
          '10 AI RFP drafts/month',
          'Unlimited AI RFP enhancement',
          'Email alerts for pursuits',
          'Priority support',
          'Team collaboration (up to 5 users)',
          'Dedicated account manager'
        ],
        description: 'For established businesses',
        limits: {
          searches: null,
          rfpDrafts: 10,
          recommendations: 5,  // CORRECTED: 5 not 10
          pursuits: null,
          aiPursuits: null,  // UNLIMITED
          aiRfpEnhancements: null  // UNLIMITED
        },
        featureAccess: {
          searches: true,
          rfpDrafts: true,
          recommendations: true,
          pursuits: true,
          aiPursuits: true,  // ENABLED
          aiRfpEnhancements: true  // ENABLED
        },
        estimatedCost: '$35-55/month'
      }
    ];
  },

  async checkFeatureAccess(feature: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const response = await fetch(`${API_ENDPOINTS.FEATURE_ACCESS}?user_id=${user.id}&feature=${feature}`);
    const data = await response.json();
    return data.hasAccess;
  }
};
```

### 3.3 New UI Components

**`frontend/src/components/usage/FeatureAccessGuard.tsx` - New File**

```typescript
import React from 'react';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import { Lock } from 'lucide-react';

interface FeatureAccessGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureAccessGuard: React.FC<FeatureAccessGuardProps> = ({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}) => {
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { openModal } = useUpgradeModal();

  React.useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await subscriptionApi.checkFeatureAccess(feature);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Lock className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Feature Not Available
          </h3>
          <p className="text-gray-600 mb-4">
            This feature is only available in Pro and Premium plans.
          </p>
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upgrade Plan
          </button>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};
```

### 3.4 Frontend Component Updates

#### Pursuits Page Updates

**`frontend/src/pages/Pursuits.tsx` - Updates**

```typescript
import { FeatureAccessGuard } from '@/components/usage/FeatureAccessGuard';

// In the Pursuits component, wrap the AI button calls with feature access check
const PursuitsPage = () => {
  // ... existing code ...

  const handleAskAI = async (pursuit: Pursuit) => {
    // Check if AI for Pursuits is enabled for user's plan
    const hasAccess = await subscriptionApi.checkFeatureAccess('ai_pursuits');
    
    if (!hasAccess) {
      toast?.error("AI for Pursuits is only available in Pro and Premium plans. Please upgrade your plan.");
      return;
    }

    // ... existing AI logic ...
  };

  // ... rest of component ...
};
```

#### ListView Component Updates

**`frontend/src/components/pursuits/ListView.tsx` - Updates**

```typescript
import { FeatureAccessGuard } from '@/components/usage/FeatureAccessGuard';

// In the ListView component, wrap the AI button with FeatureAccessGuard
const ListView: React.FC<ListViewProps> = ({
  pursuits,
  onPursuitSelect,
  onRfpAction,
  onDelete,
  onAskAI,
  onToggleSubmission,
}) => {
  // ... existing code ...

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ... existing table structure ... */}
          <tbody>
            {pursuits.map((pursuit, index) => (
              <tr key={pursuit.id} className="...">
                {/* ... existing table cells ... */}
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium w-64">
                  <div className="flex items-center justify-end space-x-2">
                    {renderRfpActionButton(pursuit)}
                    
                    {/* Wrap AI button with FeatureAccessGuard */}
                    <FeatureAccessGuard 
                      feature="ai_pursuits"
                      fallback={
                        <button
                          disabled
                          className="p-1.5 rounded-full text-gray-400 cursor-not-allowed"
                          title="AI for Pursuits (Pro/Premium Only)"
                        >
                          <Bot size={18} />
                        </button>
                      }
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAskAI(pursuit);
                        }}
                        className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                        title="Ask BizRadar AI"
                      >
                        <Bot size={18} />
                      </button>
                    </FeatureAccessGuard>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pursuit.id);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                      title="Delete Pursuit"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

#### KanbanView Component Updates

**`frontend/src/components/pursuits/KanbanView.tsx` - Updates**

```typescript
import { FeatureAccessGuard } from '@/components/usage/FeatureAccessGuard';

// In the KanbanView component, wrap the AI button with FeatureAccessGuard
const KanbanView: React.FC<KanbanViewProps> = ({
  pursuits,
  onPursuitSelect,
  onRfpAction,
  onDelete,
  onAskAI,
}) => {
  // ... existing code ...

  return (
    <div className="flex gap-4 p-4 pb-6 overflow-auto h-[calc(100vh-280px)] min-h-[600px] scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
      {STAGES.map((stage) => (
        <div key={stage.id} className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4">
          {/* ... existing stage header ... */}
          
          <div className="space-y-3">
            {getPursuitsForStage(stage.id).map((pursuit) => (
              <div key={pursuit.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm text-gray-900">{pursuit.title}</h4>
                  <div className="flex items-center space-x-1">
                    
                    {/* Wrap AI button with FeatureAccessGuard */}
                    <FeatureAccessGuard 
                      feature="ai_pursuits"
                      fallback={
                        <button
                          disabled
                          className="p-1.5 rounded-full text-gray-400 cursor-not-allowed"
                          title="AI for Pursuits (Pro/Premium Only)"
                        >
                          <Bot size={16} />
                        </button>
                      }
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskAI(pursuit);
                        }}
                        className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                        title="Ask BizRadar AI"
                      >
                        <Bot size={16} />
                      </button>
                    </FeatureAccessGuard>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pursuit.id);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                      title="Delete Pursuit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* ... rest of pursuit card content ... */}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### RFP Response Page Updates

**`frontend/src/components/rfp/rfpResponse.tsx` - Updates**

```typescript
import { FeatureAccessGuard } from '@/components/usage/FeatureAccessGuard';

// In the RfpResponse component, show button for all users but with different behavior
const RfpResponse = () => {
  const [showLimitMessage, setShowLimitMessage] = useState(false);

  const handleEnhanceWithAI = async () => {
    try {
      const response = await fetch('/api/enhance-rfp-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* data */ })
      });

      if (response.status === 402) {
        // Show limit reached message
        setShowLimitMessage(true);
        return;
      }

      // Handle successful enhancement
      const data = await response.json();
      // ... handle success
    } catch (error) {
      console.error('Error enhancing RFP:', error);
    }
  };

  return (
    <div className="rfp-response">
      {/* ... existing code ... */}
      
      {/* AI Enhancement Button - Show for all users */}
      <button 
        onClick={handleEnhanceWithAI}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Enhance with AI
      </button>

      {/* Show limit message when limit is reached */}
      {showLimitMessage && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            You've reached your monthly limit for AI RFP enhancements. 
            <button 
              onClick={() => {/* open upgrade modal */}}
              className="ml-2 text-blue-600 underline"
            >
              Upgrade your plan
            </button>
            to get unlimited enhancements.
          </p>
        </div>
      )}
      
      {/* ... rest of component ... */}
    </div>
  );
};
```

---

## Phase 4: Email Alerts System

### 4.1 Email Service Setup

**`backend/app/services/email_service.py` - New File**

```python
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta

class EmailService:
    def __init__(self):
        self.sg = sendgrid.SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))
        self.from_email = Email(os.getenv('FROM_EMAIL', 'noreply@bizradar.com'))
    
    def send_pursuit_alert(self, user_email: str, pursuit_data: Dict[str, Any]) -> bool:
        """Send email alert for pursuit due date"""
        try:
            to_email = To(user_email)
            subject = f"Pursuit Alert: {pursuit_data['title']} - Due Soon"
            
            # Calculate days until due
            due_date = datetime.fromisoformat(pursuit_data['due_date'].replace('Z', '+00:00'))
            days_until_due = (due_date - datetime.now()).days
            
            content = Content(
                "text/html",
                f"""
                <html>
                <body>
                    <h2>Pursuit Alert</h2>
                    <p>Your pursuit <strong>{pursuit_data['title']}</strong> is due in {days_until_due} days.</p>
                    <p><strong>Due Date:</strong> {pursuit_data['due_date']}</p>
                    <p><strong>Description:</strong> {pursuit_data['description']}</p>
                    <p><strong>Stage:</strong> {pursuit_data['stage']}</p>
                    <br>
                    <p>Please review and take necessary action.</p>
                    <p>Best regards,<br>BizRadar Team</p>
                </body>
                </html>
                """
            )
            
            mail = Mail(self.from_email, to_email, subject, content)
            response = self.sg.send(mail)
            return response.status_code == 202
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def send_bulk_pursuit_alerts(self, alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Send bulk pursuit alerts"""
        results = {
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for alert in alerts:
            if self.send_pursuit_alert(alert['user_email'], alert['pursuit_data']):
                results["success"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"Failed to send alert for pursuit {alert['pursuit_data']['id']}")
        
        return results
```

### 4.2 Alert Scheduler

**`backend/app/services/alert_scheduler.py` - New File**

```python
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.utils.db_utils import get_db_connection
from app.services.email_service import EmailService

class AlertScheduler:
    def __init__(self):
        self.email_service = EmailService()
    
    def check_and_send_pursuit_alerts(self) -> Dict[str, Any]:
        """Check for pursuits due soon and send alerts"""
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Get pursuits due in the next 7 days
                cursor.execute("""
                    SELECT p.id, p.title, p.description, p.stage, p.due_date, p.user_id, u.email
                    FROM pursuits p
                    JOIN auth.users u ON p.user_id = u.id
                    WHERE p.due_date IS NOT NULL 
                    AND p.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
                    AND p.user_id IN (
                        SELECT user_id FROM user_subscriptions 
                        WHERE plan_type = 'premium' AND status = 'active'
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM pursuit_alerts pa 
                        WHERE pa.pursuit_id = p.id AND pa.alert_sent = true
                    )
                """)
                
                pursuits = cursor.fetchall()
                
                alerts = []
                for pursuit in pursuits:
                    alert_data = {
                        'user_email': pursuit[6],
                        'pursuit_data': {
                            'id': pursuit[0],
                            'title': pursuit[1],
                            'description': pursuit[2],
                            'stage': pursuit[3],
                            'due_date': pursuit[4].isoformat()
                        }
                    }
                    alerts.append(alert_data)
                
                # Send alerts
                results = self.email_service.send_bulk_pursuit_alerts(alerts)
                
                # Mark alerts as sent
                for pursuit in pursuits:
                    cursor.execute("""
                        INSERT INTO pursuit_alerts (user_id, pursuit_id, due_date, alert_sent, alert_sent_at)
                        VALUES (%s, %s, %s, true, NOW())
                        ON CONFLICT (user_id, pursuit_id) DO NOTHING
                    """, (pursuit[5], pursuit[0], pursuit[4]))
                
                conn.commit()
                return results
                
        finally:
            conn.close()
    
    def schedule_daily_alerts(self):
        """Schedule daily alert checks"""
        # This would be called by a cron job or scheduler
        return self.check_and_send_pursuit_alerts()
```

### 4.3 Cron Job Setup

**`backend/app/cron/alert_cron.py` - New File**

```python
from app.services.alert_scheduler import AlertScheduler
from app.utils.logger import get_logger

logger = get_logger(__name__)

def run_daily_alerts():
    """Run daily pursuit alerts"""
    try:
        scheduler = AlertScheduler()
        results = scheduler.schedule_daily_alerts()
        
        logger.info(f"Daily alerts completed: {results['success']} sent, {results['failed']} failed")
        return results
        
    except Exception as e:
        logger.error(f"Error running daily alerts: {e}")
        return {"success": 0, "failed": 0, "errors": [str(e)]}
```

---

## Detailed Implementation Locations

### Backend Changes

#### 1. Database Migrations
**Location**: `backend/supabase/migrations/`
**Files to Create**:
- `20240120000000_add_usage_tracking.sql`
- `20240120000001_add_feature_access_control.sql`
- `20240120000002_add_pursuit_alerts.sql`
- `20240120000003_populate_plan_limits.sql`

#### 2. Service Files
**Location**: `backend/app/services/`
**Files to Create**:
- `usage_tracker.py` - Usage tracking logic
- `plan_limits.py` - Plan limit enforcement
- `email_service.py` - SendGrid email service
- `alert_scheduler.py` - Alert scheduling logic

#### 3. Route Updates
**Location**: `backend/app/routes/`
**Files to Modify**:
- `search_routes.py` - Add usage tracking to existing endpoints
- `usage_routes.py` - New file for usage-related endpoints

#### 4. Cron Jobs
**Location**: `backend/app/cron/`
**Files to Create**:
- `alert_cron.py` - Daily alert scheduling

### Frontend Changes

#### 1. Model Updates
**Location**: `frontend/src/models/`
**Files to Modify**:
- `subscription.ts` - Add new interfaces for usage tracking

#### 2. API Updates
**Location**: `frontend/src/api/`
**Files to Modify**:
- `subscription.ts` - Add usage tracking API calls

#### 3. Component Updates
**Location**: `frontend/src/components/`
**Files to Create**:
- `usage/FeatureAccessGuard.tsx` - Feature access control

**Files to Modify**:
- `subscription/UpgradeModal.tsx` - Update pricing display
- `rfp/rfpResponse.tsx` - Add AI enhancement restrictions

#### 4. Page Updates
**Location**: `frontend/src/pages/`
**Files to Modify**:
- `Pursuits.tsx` - Add AI feature restrictions

---

## Testing Strategy

### 1. Unit Tests
**Location**: `backend/tests/` and `frontend/src/tests/`
**Files to Create**:
- `test_usage_tracker.py` - Test usage tracking logic
- `test_plan_limits.py` - Test plan limit enforcement
- `test_feature_access.py` - Test feature access control
- `test_email_service.py` - Test email functionality
- `FeatureAccessGuard.test.tsx` - Test feature access guard

### 2. Integration Tests
**Location**: `backend/tests/`
**Files to Create**:
- `test_usage_endpoints.py` - Test usage tracking endpoints
- `test_feature_restrictions.py` - Test feature restrictions
- `test_alert_system.py` - Test email alert system

---

## Migration Checklist

### Pre-Migration
- [ ] Backup existing database
- [ ] Deploy to staging environment
- [ ] Test with production data copy
- [ ] Validate all functionality
- [ ] Set up SendGrid API key

### Migration
- [ ] Run database migrations
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Set up cron jobs for alerts
- [ ] Monitor for errors

### Post-Migration
- [ ] Monitor usage patterns
- [ ] Test email alerts
- [ ] Gather user feedback
- [ ] Optimize based on data

---

## Summary of Key Changes

1. **Corrected Premium Plan**: AI recommendations limited to 5 (not 10)
2. **Removed Token Tracking**: Simplified usage tracking without token counting
3. **Removed UI Usage Tracker**: No usage display in UI
4. **Simplified Pursuits**: Just hide/show AI button based on plan
5. **AI RFP Enhancement**: Show button for all users, show limit message when reached
6. **Email Alerts**: Added SendGrid integration for Premium plan pursuit alerts
7. **Basic Plan AI RFP**: Limited to 2 enhancements per month

This implementation provides a clean, simple approach that meets all your requirements while maintaining good user experience.