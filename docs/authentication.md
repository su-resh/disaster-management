# Authentication

## Overview

The platform uses Supabase Auth for user authentication, providing secure email/password authentication with JWT-based session management.

## Authentication Flow

### 1. Login Process

1. User enters email and password on the login screen
2. Client calls `supabase.auth.signInWithPassword()` with credentials
3. On success, Supabase creates a session with a JWT token
4. Session is stored and listener is triggered
5. User is redirected to the home screen

### 2. Session Management

- **Session Lifetime**: Typically 24 hours, extendable with refresh tokens
- **Session Storage**: Managed by Supabase client library
- **Auth State Events**: Listen to `onAuthStateChange` for state changes

### 3. Protected Routes

- **Flutter**: `AuthWrapper` widget monitors auth state changes
- **Next.js**: Server-side session validation before rendering protected content

### 4. Password Recovery

- Users can request password reset through the login page
- Reset link sent to registered email address
- 24-hour expiration on reset tokens

## Authentication Providers

- **Primary**: Email/password authentication
- **Social Logins**: Not currently implemented (planned for future)

## Session Management

### Session Lifetime
- Default lifetime: 24 hours
- Refresh mechanism available
- Session invalidation on logout

### Session Storage
- Managed automatically by Supabase client libraries
- Available via `Supabase.instance.client.auth.currentSession()`

## Security Measures

- **Password Hashing**: Server-side hashing with salt
- **JWT Tokens**: Signed tokens with expiration
- **Session Revocation**: Immediate invalidation on logout
- **Audit Logs**: Track login attempts and session changes

## Security Policies

- **Password Requirements**: Minimum 8 characters, recommended complexity
- **Session Timeout**: Automatic logout after inactivity
- **Brute Force Protection**: Rate limiting on login attempts
- **Session Validation**: Regular token verification

## Security Gaps (Known)

- No account lockout after multiple failed attempts
- No multi-factor authentication currently implemented
- Session hijacking possible if JWT tokens are intercepted
- No password strength validation on registration (planned)

## Security Best Practices

- Always use HTTPS for all communications
- Store tokens securely in device keychain (Flutter) or HTTP-only cookies (Web)
- Regular security audits recommended
- Monitor for suspicious login activity