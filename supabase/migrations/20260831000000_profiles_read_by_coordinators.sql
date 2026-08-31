-- Allow coordinators and admins to read all profiles
-- This is needed for emergency_requests queries that join with profiles
create policy "Coordinators and admins can read all profiles"
  on profiles
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );
