# Database Schema

## Overview

The database uses PostgreSQL with Supabase's realtime and row-level security features. The schema is designed to support emergency reporting, resource management, and role-based access control.

## Tables

### profiles

Stores user profile information with role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | References `auth.users(id)` primary key |
| `full_name` | TEXT | User's full name |
| `phone` | TEXT | Unique phone number |
| `role` | TEXT | User role: 'citizen', 'responder', 'coordinator', 'inventory_manager', 'admin' |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation timestamp |
| `is_active` | BOOLEAN | Account status |

### disaster_types

Reference table for emergency types.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Generated identity |
| `name` | TEXT | Emergency type name (e.g., 'flood', 'fire') |
| `is_active` | BOOLEAN | Whether the type is active |

### severity_levels

Severity levels with color coding.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Generated identity |
| `name` | TEXT | Severity level name (critical, high, medium, low) |
| `rank` | INTEGER | Numeric rank (1-4) |
| `color_hint` | TEXT | Optional color hint for UI |

### resource_types

Resource inventory items.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Generated identity |
| `name` | TEXT | Resource name (e.g., 'water', 'food') |
| `category` | TEXT | Resource category |
| `unit` | TEXT | Unit of measure |
| `is_expiry_tracked` | BOOLEAN | Whether to track expiration |
| `default_minimum_stock` | INTEGER | Minimum stock level |
| `is_active` | BOOLEAN | Whether the resource type is active |

### emergency_requests

Main table for emergency reports.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_by` | UUID | References `profiles(id)` |
| `disaster_type_id` | BIGINT | References `disaster_types(id)` |
| `emergency_type` | TEXT | Type of emergency (e.g., 'flooding', 'fire') |
| `status` | TEXT | Request status ('NEW', 'VERIFIED', 'REJECTED', 'ASSIGNED', 'RESPONDER_ON_WAY', 'RESCUING', 'RESCUED', 'CANCELLED') |
| `severity_id` | BIGINT | References `severity_levels(id)` |
| `people_count` | INTEGER | Number of people affected |
| `injured_count` | INTEGER | Number of injured people (default 0) |
| `description` | TEXT | Detailed description |
| `latitude` | NUMERIC | Latitude coordinate |
| `longitude` | NUMERIC | Longitude coordinate |
| `location_text` | TEXT | Human-readable location description |
| `contact_phone` | TEXT | Contact phone number |
| `special_needs` | TEXT | Special requirements |
| `photo_url` | TEXT | URL to emergency photo |
| `rejected_reason` | TEXT | Reason for rejection (if any) |
| `verified_by` | UUID | References `profiles(id)` |
| `verified_at` | TIMESTAMP WITH TIME ZONE | Verification timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update timestamp |

### Storage

- **Bucket**: `emergency-photos`
- **Public**: false
- **File Size Limit**: 5242880 bytes (5MB)
- **Allowed MIME Types**: image/jpeg, image/png

## Authentication Integration

The database integrates with Supabase Auth for user management:

- `profiles.id` references `auth.users(id)`
- RLS policies ensure users can only access their own profile data
- Admin users have full access to all records

## Row Level Security (RLS)

### policies

- **profiles**: 
  - Users can read/update their own profile
  - Admins can manage all profiles
- **emergency_requests**:
  - Users can insert their own requests
  - Users can select their own requests
  - Coordinators and admins can view all requests
  - Coordinators and admins can update status fields
  - Admins can delete any request
- **resource_types**:
  - Authenticated users can read
  - Admins and inventory managers can modify

## Realtime Capabilities

- **Subscriptions**: Clients subscribe to `emergency_changes` channel
- **Events**: 
  - `INSERT` on `emergency_requests` - new emergency report
  - `UPDATE` on `emergency_requests` - emergency status change
  - `DELETE` - emergency request removal (admin only)
- **Channels**: Single channel for all emergency-related events

## Indexes

- `idx_emergency_requests_status` - Status filtering
- `idx_emergency_requests_severity_id` - Severity filtering
- `idx_emergency_requests_created_at` - Time-based queries
- `idx_emergency_requests_status_severity_id` - Combined status/severity filtering