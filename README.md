# Disaster Response Platform - Phase 0 Foundation

This repository contains the Phase 0 foundation implementation of the disaster response platform as specified in the plan.md document.

## What's Included

### 1. Supabase Setup (`supabase/` directory)
- **Migration files** for three lookup tables:
  - `disaster_types` (flood, landslide, earthquake, fire, storm, avalanche, accident, other)
  - `severity_levels` (critical rank 1, high rank 2, medium rank 3, low rank 4)
  - `resource_types` (water, food, medicine, tents, blankets, clothes, first_aid, flashlights, batteries, rescue_equipment, fuel, other with sensible units)
- **Seed data file** (`seed.sql`) with initial data for all lookup tables
- **Profiles table migration** with:
  - Proper schema (id, full_name, phone, role, created_at, is_active)
  - Role constraints (citizen, responder, coordinator, inventory_manager, admin)
  - RLS policies allowing users to read/update their own data only
  - Admin-only policies for write operations on lookup tables
  - Postgres trigger to auto-create profiles on auth.user creation

### 2. Next.js Dashboard (`dashboard/` directory)
- **Next.js 13+ App Router** with TypeScript and Tailwind CSS
- **Supabase client setup** following @supabase/ssr pattern
- **Authentication flow**:
  - `/login` page with phone OTP sign-in (request OTP → verify OTP)
  - `/dashboard` protected route showing user info
  - Automatic redirection based on auth status
- **User info display**: "Logged in as {full_name or phone}, role: {role}"

### 3. Flutter Mobile App (`mobile/` directory)
- **Flutter app** with supabase_flutter integration
- **Authentication flow**:
  - Login screen with phone OTP request and verification
  - Home screen showing logged-in user info
- **User info display**: "Logged in as {full_name or phone}, role: {role}"

## Setup Instructions

### Supabase
1. Copy the migration files from `supabase/migrations/` to your Supabase project
2. Apply the migrations in order:
   - 20260830000001_create_disaster_types_table.sql
   - 20260830000002_create_severity_levels_table.sql
   - 20260830000003_create_resource_types_table.sql
   - 20260830000004_create_profiles_table.sql
3. Run the seed.sql file to insert initial lookup data

### Next.js Dashboard
1. Navigate to `dashboard/` directory
2. Install dependencies: `npm install`
3. Create `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
4. Run the development server: `npm run dev`

### Flutter Mobile App
1. Navigate to `mobile/` directory
2. Get dependencies: `flutter pub get`
3. Update the Supabase credentials in `lib/main.dart`
4. Run the app: `flutter run`

## Security Implementation
- Row Level Security (RLS) enabled on all tables from the start
- Policies follow the principle of least privilege
- Phone-based authentication as primary method
- Role-based access control enforced at the database level
- No client-side security bypass possible

## Next Steps (Phase 1)
After verifying the Phase 0 foundation with test accounts, implement:
- Emergency request creation and management
- Responder assignment and status updates
- Resource inventory management
- Resource request workflow
- Coordinator dashboard with real-time updates
- Basic offline handling