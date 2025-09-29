# Event Tracking System

## Overview

The BizRadar application includes a comprehensive event tracking system that automatically captures user interactions and sends them to the backend for analytics and monitoring.

## Key Features

- **Automatic Session Tracking**: All events automatically include the `session_id` extracted from the JWT token
- **Geolocation Support**: Automatically captures user location when available
- **Universal Coverage**: All user interactions are tracked across the application
- **Real-time Sending**: Events are sent immediately using `fetch` or `sendBeacon` for reliability

## Architecture

### Core Components

1. **`tracker.ts`**: Core tracking logic and event posting
2. **`tracker-react.tsx`**: React context provider for tracking
3. **`jwtUtils.ts`**: JWT token utilities for session extraction

### Event Structure

```typescript
interface ClientEvent {
  session_id?: string | null;           // Extracted from JWT token
  event_name: string;                   // Event identifier
  event_type: string;                   // Event category
  latitude?: number | null;             // User location
  longitude?: number | null;            // User location
  created_at?: string | null;           // ISO 8601 UTC timestamp
  metadata?: Record<string, unknown>;   // Additional event data
}
```

## Usage

### Basic Tracking

```typescript
import { useTrack } from '@/logging';

function MyComponent() {
  const track = useTrack();
  
  const handleClick = () => {
    track({
      event_name: "button_click",
      event_type: "interaction",
      metadata: {
        button_name: "submit",
        page: "dashboard"
      }
    });
  };
}
```

### Event Tracker Hook

```typescript
import { useEventTracker } from '@/logging';

function MyComponent() {
  const trackButtonClick = useEventTracker("button_click");
  
  const handleSubmit = () => {
    trackButtonClick("interaction", {
      button_name: "submit",
      form: "contact"
    });
  };
}
```

## Session ID Integration

The tracking system automatically extracts the `session_id` from the current user's JWT token and includes it in all events. This happens transparently without requiring any changes to existing tracking calls.

### How It Works

1. **Auth State Monitoring**: The `TrackerProvider` listens for Supabase auth state changes
2. **JWT Decoding**: When a session is available, the JWT token is decoded to extract the `session_id`
3. **Automatic Inclusion**: All tracking events automatically include the current `session_id`
4. **Session Updates**: When users log in/out, the session tracking is updated automatically

### Benefits

- **Session Correlation**: All events from the same user session are linked
- **Security**: Session-based tracking provides better security than user-based tracking
- **Analytics**: Enables session-based analytics and user journey tracking
- **Debugging**: Easier to debug issues by correlating events to specific sessions

## Configuration

The tracking system is configured in `App.tsx`:

```typescript
<TrackerProvider endpoint={API_ENDPOINTS.EVENTS}>
  <App />
</TrackerProvider>
```

## Backend Integration

Events are sent to the `/api/events/one` endpoint and stored in the database with the following structure:

- `session_id`: Session identifier (extracted from JWT token)
- `event_name`: Event type
- `event_type`: Event category
- `latitude/longitude`: User location
- `created_at`: Timestamp
- `metadata`: Additional event data (JSONB)

## Testing

JWT utilities are tested in `__tests__/jwtUtils.test.ts` to ensure proper session ID extraction.

## Migration Notes

- **No Breaking Changes**: Existing tracking calls continue to work without modification
- **Automatic Enhancement**: All events now automatically include `session_id`
- **Backward Compatible**: The system gracefully handles cases where `session_id` is not available
