# Real-time System

## Overview

The platform uses Supabase Realtime to provide real-time updates for emergency requests. This enables coordinators and responders to see changes as they happen.

## Realtime Features

### Supported Events

- **INSERT**: New emergency request created
- **UPDATE**: Existing emergency request updated
- **DELETE**: Emergency request removed (admin only)

### Subscription Pattern

```javascript
const channel = supabase
  .channel('emergency_changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'emergency_requests'
  }, (payload) => {
    // Handle new emergency
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'emergency_requests'
  }, (payload) => {
    // Handle emergency update
  })
  .subscribe((status) => {
    // Handle connection status
  });
```

### Reconnection Logic

- Automatic reconnection when network is restored
- Connection status tracked via `status` events:
  - `SUBSCRIBED`: Successfully connected
  - `CHANNEL_ERROR`: Connection issue
  - `TIMED_OUT`: Connection timeout
  - `CLOSED`: Channel closed

## Client Implementation

### Flutter

```dart
Supabase.instance.client.auth.onAuthStateChange.listen((event) {
  // Handle auth state changes
});
```

### Next.js

```javascript
const channel = supabase
  .channel('emergency_changes')
  .on('postgres_changes', { /* parameters */ }, (payload) => {
    // Handle event
  })
  .subscribe((status) => {
    // Handle connection status
  });
```

## Reconnection Policy

- Automatic reconnection when network is restored
- Persistent connection attempts during outages
- Status indicators in UI for connected/reconnecting/disconnected states

## Performance Considerations

- Minimal payload size for realtime events
- Batched updates when possible
- Efficient query patterns to minimize bandwidth
- Connection persistence during temporary outages