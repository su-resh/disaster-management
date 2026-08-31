# Correct SQL for Creating Test Accounts

First, create the test accounts in Supabase Auth (via dashboard, API, or your app). Then get their actual auth.uid values from auth.users.

## Step 1: Create Accounts & Get Auth UIDs

After creating accounts `testa@example.com` and `testb@example.com` in Supabase Auth:

```sql
-- Get the actual auth.uid values
SELECT id, email FROM auth.users WHERE email IN ('testa@example.com', 'testb@example.com');
```

This will return something like:
```
 id                                   |       email       
--------------------------------------+-------------------
 11111111-1111-1111-1111-111111111111 | testa@example.com
 22222222-2222-2222-2222-222222222222 | testb@example.com
```

## Step 2: Insert Profile Records

Use the actual UUIDs from the query above:

```sql
-- For Account A (replace with actual UUID from above)
INSERT INTO public.profiles (id, full_name, phone, role, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',  -- <-- ACTUAL UUID FROM auth.users
  'Test Citizen A',
  '+97798XXXXXXX',
  'citizen',
  true
);

-- For Account B (replace with actual UUID from above)
INSERT INTO public.profiles (id, full_name, phone, role, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',  -- <-- ACTUAL UUID FROM auth.users
  'Test Citizen B', 
  '+97798XXXXXXX',
  'citizen',
  true
);
```

## Alternative: Create Profiles via Trigger (Recommended)

Since you have a trigger that auto-creates profiles on auth.user creation, you can simply:

1. Create the accounts in Supabase Auth
2. The profiles will be auto-created with role='citizen' (default from your trigger)
3. Then update any specific fields if needed:

```sql
-- Update full_name and phone for test accounts
UPDATE public.profiles 
SET full_name = 'Test Citizen A', phone = '+97798XXXXXXX'
WHERE id = '(auth.uid of testa@example.com)';

UPDATE public.profiles 
SET full_name = 'Test Citizen B', phone = '+97798XXXXXXX'
WHERE id = '(auth.uid of testb@example.com)';
```

## Verification SQL (to run AFTER setting up test accounts)

Once you have actual test accounts with known JWT tokens, use these verification queries:

```sql
-- SET your session token first (do this before each test set)
-- SET request.jwt.token.to 'your-jwt-token-here';

-- Test 1: Citizen A cannot see Citizen B's profile
SELECT id, full_name, role 
FROM public.profiles 
WHERE id = '(citizen-b-uuid)';
-- EXPECT: 0 rows

-- Test 2: Citizen A cannot change own role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '(citizen-a-uuid)';
-- EXPECT: Permission error

-- Test 3: Admin can see all profiles
SELECT id, full_name, role 
FROM public.profiles 
ORDER BY id;
-- EXPECT: 3+ rows including both citizens and admin

-- Test 4: Lookup table access
SELECT * FROM public.disaster_types;  -- Should succeed
SELECT * FROM public.severity_levels;  -- Should succeed
SELECT * FROM public.resource_types;   -- Should succeed

-- Test 5: Non-admin cannot write to lookup tables
INSERT INTO public.disaster_types (name) VALUES ('test_type');
-- EXPECT: Permission error
```