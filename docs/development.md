# Development Guide

## Prerequisites

- Flutter 3.12.0+
- Node.js 18.x
- npm 9.x
- Supabase account
- PostgreSQL database

## Flutter Application Setup

### Installation

```bash
cd mobile
flutter pub get
```

### Environment Variables

Create a `.env` file in the mobile directory:

```env
FLUTTER_SUPABASE_URL=your_supabase_url
FLUTTER_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

```bash
flutter run
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `flutter run` | Run on connected device or emulator |
| `flutter build apk` | Build Android APK |
| `flutter build ios` | Build iOS app |
| `flutter test` | Run unit tests |
| `flutter analyze` | Run static analysis |

### Authentication Flow

1. **Login Screen**: Uses `Supabase.instance.client.auth.signInWithPassword()`
2. **Auth State Management**: `AuthWrapper` component listens to `onAuthStateChange`
3. **Session Persistence**: Auth state persists across app restarts

### Key Screens

- **LoginScreen**: Email/password authentication form
- **HomeScreen**: Main dashboard after authentication
- **ReportEmergencyScreen**: Form for creating emergency reports
- **MyReportsScreen**: View user's submitted emergencies

## Next.js Web Application Setup

### Installation

```bash
cd dashboard
npm install
```

### Environment Variables

Create a `.env.local` file in the dashboard directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

```bash
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run code linting |

### Authentication Flow

1. **Login Page**: Uses `supabase.auth.signInWithPassword()`
2. **Session Management**: Next.js uses server-side session checking
3. **Protected Routes**: Dashboard route redirects to login if not authenticated

### Key Pages

- **LoginPage**: Authentication form
- **DashboardPage**: Main dashboard (redirects to emergencies page)
- **EmergenciesPage**: List of active emergencies with map view
- **ReportEmergencyPage**: Form for submitting new emergency reports

## Database Operations

### Flutter Emergency Reporting

```dart
await Supabase.instance.client
  .from('emergency_requests')
  .insert({
    'created_by': user.id,
    'disaster_type_id': selectedType,
    'emergency_type': emergencyType,
    'status': 'NEW',
    'severity_id': selectedSeverity,
    'people_count': int.parse(peopleCount),
    'injured_count': injuredCount,
    'description': description,
    'latitude': currentPosition?.latitude,
    'longitude': currentPosition?.longitude,
    'location_text': locationText,
    'contact_phone': contactPhone,
    'special_needs': specialNeeds,
  });
```

### Next.js Data Fetching

```javascript
const { data, error } = await supabase
  .from('emergency_requests')
  .select(`
    id,
    created_at,
    updated_at,
    status,
    emergency_type,
    severity_id,
    severity_levels!inner(name, color_hint),
    disaster_types!inner(name),
    people_count,
    injured_count,
    description,
    location_text,
    contact_phone,
    special_needs,
    photo_url,
    rejected_reason,
    verified_by,
    verified_at,
    latitude,
    longitude
  `)
  .order('created_at', { ascending: false });
```

## Testing Strategy

### Flutter Tests

- Unit tests for models and services
- Widget tests for screens
- Integration tests for authentication flow

### Next.js Tests

- Unit tests for components and hooks
- Integration tests for API routes
- End-to-end tests using Cypress

## Testing Commands

### Flutter

```bash
flutter test test/unit/
flutter test test/widget/
```

### Next.js

```bash
npm test
```

## Testing Best Practices

- Test authentication flow thoroughly
- Test form validation on both client and server
- Test realtime updates with mock payloads
- Test error cases (network failures, validation errors)
- Test permission checks for different user roles