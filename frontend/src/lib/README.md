# API Centralization

This document describes the centralized API structure used in the BizRadar application.

## Architecture

The API structure is organized around these key components:

1. **Endpoint Definitions** - Located in `src/config/apiEndpoints.ts`
2. **API Client** - Located in `src/lib/api.ts`
3. **Feature-specific API modules** - Located in `src/api/` directory

## Endpoint Definitions

All API endpoints are centrally defined in `apiEndpoints.ts`. This includes:

- `API_ENDPOINTS` - URL paths for REST API endpoints
- `STRIPE_PRICES` - Stripe price IDs for different subscription plans
- `SUPABASE_TABLES` - Supabase table names used across the application

## API Client

The `apiClient` in `src/lib/api.ts` provides common HTTP methods with standard error handling:

- `get(url, options?)` - For GET requests
- `post(url, data?, options?)` - For POST requests 
- `put(url, data?, options?)` - For PUT requests
- `delete(url, options?)` - For DELETE requests

Each method handles authentication headers and response processing automatically.

## Feature-specific API Modules

Domain-specific API functionality is organized in separate modules:

- `subscription.ts` - Subscription management
- `payment.ts` - Payment processing 
- `notifications.ts` - User notifications
- `support.ts` - Support tickets and messages

These modules use the centralized endpoints and API client while exposing high-level business functions.

## Usage Example

```typescript
// Import the API module for the feature you're working with
import { subscriptionApi } from '@/api/subscription';

// Use the module's methods
async function upgradeUserSubscription() {
  try {
    const subscription = await subscriptionApi.createSubscription('premium');
    return subscription;
  } catch (error) {
    console.error('Failed to upgrade subscription:', error);
    throw error;
  }
}
```

## Benefits

- **Maintainability**: All endpoints defined in one place
- **Consistency**: Standard error handling and auth headers
- **Type Safety**: TypeScript types for request/response data
- **Testability**: API modules can be mocked for testing
- **Separation of Concerns**: Business logic separated from API calls
