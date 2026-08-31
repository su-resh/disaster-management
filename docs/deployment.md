# Deployment

## Overview

This section documents the deployment process for all components of the Disaster Response & Resource Allocation System.

## Environments

### Local Development

- **Flutter**: Run locally with `flutter run`
- **Next.js**: Run with `npm run dev`
- **Supabase**: Use local development mode or local instance

### Staging Environment

- Dedicated Supabase project for testing
- Separate database schema
- Staging subdomain (e.g., staging.rescueops.example.com)
- Mirror of production configuration

### Production

- **Flutter**: Build and deploy to app stores
- **Next.js**: Deploy to Vercel or similar platform
- **Supabase**: Production project with proper backups and monitoring
- **Database**: Regular backups and failover configuration

## Deployment Process

### Flutter Mobile App

1. **Build**: `flutter build apk --release` or `flutter build ios --release`
2. **Signing**: Use existing signing keys or generate new ones
3. **Upload**: Submit to Google Play Store or Apple App Store
4. **Update**: Submit new version through app store review process

### Next.js Web Application

1. **Build**: `npm run build`
2. **Deploy**: Push to Git repository or deploy directly to Vercel
3. **Environment**: Set production environment variables
4. **DNS**: Configure custom domain if needed

### Supabase Backend

1. **Migration Management**: Use Supabase migration system
2. **Schema Changes**: Use migration files with version control
3. **Backup Strategy**: Daily automated backups with retention policy
4. **Monitoring**: Enable Supabase dashboard monitoring

### CI/CD Pipeline

1. **Code Commit**: Push to GitHub repository
2. **Automated Testing**: Run tests on commit
3. **Build**: Automated build process
4. **Deploy**: Automatic deployment to staging or production

## Environment Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `DATABASE_URL` | Database connection string | ✅ |
| `STORAGE_BUCKET` | Storage bucket name | ✅ |
| `SESSION_COOKIE_NAME` | Session cookie name | ❌ |
| `SESSION_SECRET` | Session encryption key | ❌ |

### Build Commands

| Platform | Command | Description |
|----------|---------|-----------|
| Flutter | `flutter build apk --release` | Build Android APK |
| Flutter | `flutter build ios --release` | Build iOS IPA |
| Next.js | `npm run build` | Build production-ready app |
| Flutter | `flutter build apk --debug` | Debug build for testing |

## CI/CD Pipeline

1. **Code Commit**: Push to GitHub repository
2. **Automated Testing**: Run unit and integration tests
3. **Build Process**: Compile and optimize assets
4. **Deployment**: Auto-deploy to staging or production
5. **Monitoring**: Set up error tracking and performance monitoring

## Rollback Procedure

1. **Identify Issue**: Determine the cause of the problem
2. **Restore Previous Version**: Deploy previous stable version
3. **Database Rollback**: If schema changes caused issues, restore from backup
4. **Communication**: Notify users of maintenance downtime
5. **Post-Mortem**: Analyze root cause and implement fixes

## Rollback Strategy

1. **Code Rollback**: Deploy previous git commit
2. **Database Rollback**: Restore from most recent backup
3. **Configuration Rollback**: Revert environment variables to previous values
4. **Testing**: Verify rollback success before notifying users

## Monitoring & Maintenance

- **Uptime Monitoring**: Ensure 99.9% uptime
- **Error Tracking**: Implement error logging and alerting
- **Performance Monitoring**: Track response times and error rates
- **Security Audits**: Regular security assessments
- **Backup Verification**: Test backup restoration procedures