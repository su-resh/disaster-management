# Security

## Security Overview

This section documents the security model, implementation details, and known risks of the Disaster Response & Resource Allocation System.

## Authentication Security

### Authentication Provider
- **Supabase Auth**: Industry-standard authentication service
- **Protocol**: OAuth 2.0 with JWT tokens
- **Transport Security**: HTTPS enforced for all communications

### Session Management
- **Session Lifetime**: Configurable, typically 24 hours
- **Token Storage**: Secure storage on device (Flutter) or HTTP-only cookies (Web)
- **Session Invalidation**: Immediate on logout or suspicious activity

### Password Security
- **Hashing**: Server-side secure hashing (bcrypt/argon2)
- **Password Requirements**: Minimum 8 characters, recommended complexity
- **Password Reset**: Secure token-based reset flow

## Row Level Security (RLS)

### Implementation
- PostgreSQL RLS policies enforce data access restrictions
- Policies defined at table level for all core tables
- Dynamic policies based on user role and ownership

### Key Policies

- **profiles**: Users can only access their own profile data
- **emergency_requests**: 
  - Users can insert/select their own requests
  - Coordinators and admins can view all requests
  - Admins can delete any request
  - Inventory managers can modify resource types
- **profiles**: 
  - Users can update their own profile
  - Admins only can change role field

## Authentication Security

- **Transport Security**: All communications use HTTPS/TLS
- **Token Storage**: Secure storage on device or HTTP-only cookies
- **Token Expiry**: Tokens expire after configurable period
- **Brute Force Protection**: Rate limiting on login attempts

## Storage Security

- **Bucket Policies**: Users can only upload to their own folder
- **Access Control**: Users can view photos if they have permission
- **File Validation**: Allowed file types strictly enforced
- **Virus Scanning**: Not currently implemented (planned)

## Vulnerabilities and Risks

### Known Risks

1. **Account Enumeration**: No clear error messages for invalid usernames/emails
2. **Brute Force Attacks**: No account lockout after failed attempts
3. **Session Management**: No automatic session timeout beyond app restart
4. **Data Exposure**: Potential exposure of sensitive personal information
5. **Location Privacy**: GPS coordinates shared with emergency requests

### Recommended Mitigations

- Implement account lockout after 5 failed attempts
- Add multi-factor authentication (MFA) in future versions
- Implement session timeout with idle detection
- Add content security policies (CSP) for web application
- Implement input validation for all user-generated content
- Add rate limiting for API endpoints

## Security Best Practices

- Always validate and sanitize user input
- Use parameterized queries to prevent SQL injection
- Keep dependencies updated to latest secure versions
- Regular security audits and penetration testing
- Monitor for suspicious activity patterns
- Implement audit logging for security-relevant actions

## Security Testing

- **Static Analysis**: Use linters and security scanners
- **Dynamic Testing**: Regular penetration testing
- **Code Review**: Mandatory code reviews for all changes
- **Penetration Testing**: Annual professional security assessment