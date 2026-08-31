# RLS Verification Checklist for Phase 0 Foundation

Before proceeding to Phase 1, verify the Row Level Security policies are working correctly using the following tests:

## Test Setup
1. Create two test accounts in Supabase Auth dashboard (skip SMS for testing):
   - Account A: email `testa@example.com` (or use phone if preferred)
   - Account B: email `testb@example.com` (or use phone if preferred)

2. After accounts exist, manually set their profiles via SQL editor:
   ```sql
   -- For Account A
   INSERT INTO public.profiles (id, full_name, phone, role, is_active)
   VALUES (
     '(get auth.uid() of testa@example.com from auth.users)',
     'Test Citizen A',
     '+97798XXXXXXX',
     'citizen',
     true
   );

   -- For Account B  
   INSERT INTO public.profiles (id, full_name, phone, role, is_active)
   VALUES (
     '(get auth.uid() of testb@example.com from auth.users)',
     'Test Citizen B', 
     '+97798XXXXXXX',
     'citizen',
     true
   );
   ```

## Test 1: Citizen Cannot See Other Citizens' Profiles
**Logged in as Account A:**
```sql
-- Should return ONLY Account A's row (not Account B's)
SELECT id, full_name, role FROM public.profiles WHERE id = '(Account B's auth.uid())';

-- Expected result: 0 rows returned
```

**Logged in as Account B:**
```sql
-- Should return ONLY Account B's row (not Account A's)
SELECT id, full_name, role FROM public.profiles WHERE id = '(Account A's auth.uid())';

-- Expected result: 0 rows returned
```

## Test 2: Citizen Cannot Change Own Role
**Logged in as Account A:**
```sql
-- Should fail with permission error
UPDATE public.profiles SET role = 'admin' WHERE id = '(Account A's auth.uid())';

-- Expected result: Error: "new row for relation "profiles" violates check constraint "profiles_role_check""
-- OR: Error from trigger: "Only admins can change the role"
```

## Test 3: Admin Can Read All Profiles
1. Create Account C and set role to 'admin' via SQL editor
2. **Logged in as Account C (admin):**
```sql
-- Should return ALL profiles (A, B, and C)
SELECT id, full_name, role FROM public.profiles ORDER BY id;

-- Expected result: 3 rows returned with roles: citizen, citizen, admin
```

## Test 4: Lookup Table Access
**Logged in as any authenticated user (A, B, or C):**
```sql
-- Should succeed for all users
SELECT * FROM public.disaster_types;
SELECT * FROM public.severity_levels;  
SELECT * FROM public.resource_types;

-- Expected result: All lookup data returned
```

**Logged in as any authenticated user (non-admin):**
```sql
-- Should fail with permission error
INSERT INTO public.disaster_types (name) VALUES ('test');

-- Expected result: Error: "new row for relation "disaster_types" violates row security policy"
```

## Verification Results
If all tests pass as expected:
- ✅ RLS policies are correctly implemented
- ✅ Security boundary is functioning
- ✅ Ready to proceed to Phase 1

If any test fails:
- ❌ Note the specific test and error message
- ❌ Share the failing test details for debugging
- ❌ Do not proceed to Phase 1 until RLS is verified

## Next Steps
Once you've completed these tests and they all pass as described, confirm here and I'll provide the Phase 1 implementation prompt covering:
- Emergency request creation (form + map picker + single photo upload)
- Coordinator dashboard: live emergency list + map, verify/reject/assign actions, realtime updates
- Per Section 35 of plan.md

**Important:** Do not skip this verification. RLS is the actual security boundary for the application, and catching misconfigurations now is vastly easier than after Phase 1 features are built.