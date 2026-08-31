-- Fix infinite recursion on profiles RLS policies
-- Create a security definer function to check the current user's role
-- This function runs with elevated privileges, bypassing RLS

create or replace function public.get_current_user_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  select role into user_role
  from public.profiles
  where id = auth.uid();

  return user_role;
end;
$$;

-- Drop the recursive policy
drop policy if exists "Coordinators and admins can read all profiles" on profiles;

-- Replace with non-recursive version using the function
create policy "Coordinators and admins can read all profiles"
  on profiles
  for select
  using (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

-- Also fix the responders policies that reference profiles
drop policy if exists "Coordinators and admins can select all responders" on responders;
drop policy if exists "Admins can insert responders" on responders;
drop policy if exists "Coordinators and admins can update responder status" on responders;

create policy "Coordinators and admins can select all responders"
  on responders
  for select
  using (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

create policy "Admins can insert responders"
  on responders
  for insert
  with check (
    public.get_current_user_role() = 'admin'
  );

create policy "Coordinators and admins can update responder status"
  on responders
  for update
  using (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

-- Fix assignments policies that reference profiles
drop policy if exists "Coordinators and admins can select all assignments" on assignments;
drop policy if exists "Coordinators and admins can insert assignments" on assignments;
drop policy if exists "Coordinators and admins can update assignments" on assignments;

create policy "Coordinators and admins can select all assignments"
  on assignments
  for select
  using (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

create policy "Coordinators and admins can insert assignments"
  on assignments
  for insert
  with check (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

create policy "Coordinators and admins can update assignments"
  on assignments
  for update
  using (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

-- Fix emergency_requests policies that reference profiles
drop policy if exists "Coordinators and admins can select all emergency requests" on emergency_requests;
drop policy if exists "Coordinators and admins can update certain fields" on emergency_requests;
drop policy if exists "Admins can delete emergency requests" on emergency_requests;

create policy "Coordinators and admins can select all emergency requests"
  on emergency_requests
  for select
  using (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

create policy "Coordinators and admins can update certain fields"
  on emergency_requests
  for update
  using (
    public.get_current_user_role() in ('coordinator', 'admin')
  );

create policy "Admins can delete emergency requests"
  on emergency_requests
  for delete
  using (
    public.get_current_user_role() = 'admin'
  );
