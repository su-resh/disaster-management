create table assignments (
  id uuid primary key default gen_random_uuid(),
  emergency_request_id uuid not null references emergency_requests on delete cascade,
  responder_id uuid not null references responders on delete cascade,
  assigned_by uuid not null references profiles,
  status text not null default 'ASSIGNED' check (status in ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'ON_WAY', 'ON_TASK', 'COMPLETED')),
  rejection_reason text,
  assigned_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz
);

alter table assignments enable row level security;

create index idx_assignments_responder_id on assignments(responder_id);
create index idx_assignments_emergency_request_id on assignments(emergency_request_id);
create index idx_assignments_status on assignments(status);

-- RLS policies

-- A responder can select their own assignments
create policy "Responders can select own assignments"
  on assignments
  for select
  using (
    responder_id in (select id from responders where id = auth.uid())
  );

-- A responder can update their own assignments (status, rejection_reason, responded_at, completed_at only)
create policy "Responders can update own assignments"
  on assignments
  for update
  using (
    responder_id in (select id from responders where id = auth.uid())
  )
  with check (
    responder_id in (select id from responders where id = auth.uid())
    and emergency_request_id = emergency_request_id  -- cannot reassign
    and responder_id = responder_id  -- cannot change responder
    and assigned_by = assigned_by  -- cannot change who assigned
  );

-- Coordinators and admins can select all assignments
create policy "Coordinators and admins can select all assignments"
  on assignments
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );

-- Coordinators and admins can insert assignments
create policy "Coordinators and admins can insert assignments"
  on assignments
  for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );

-- Coordinators and admins can update all assignments
create policy "Coordinators and admins can update assignments"
  on assignments
  for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );
