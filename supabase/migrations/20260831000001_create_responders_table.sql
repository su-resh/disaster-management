create table responders (
  id uuid primary key references profiles on delete cascade,
  skills text[] not null default '{}',
  vehicle_type text,
  equipment_notes text,
  base_latitude numeric,
  base_longitude numeric,
  status text not null default 'OFFLINE' check (status in ('AVAILABLE', 'ASSIGNED', 'ON_WAY', 'ON_TASK', 'OFFLINE')),
  last_status_update timestamptz not null default now()
);

alter table responders enable row level security;

create index idx_responders_status on responders(status);

-- RLS policies

-- A responder can select their own row
create policy "Responders can select own row"
  on responders
  for select
  using (auth.uid() = id);

-- A responder can update their own row (status, skills, vehicle_type, equipment_notes only)
create policy "Responders can update own row"
  on responders
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and id = id  -- cannot change id
  );

-- Coordinators and admins can select all responder rows
create policy "Coordinators and admins can select all responders"
  on responders
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );

-- Only admin can insert new responder rows (promote a profile to responder)
create policy "Admins can insert responders"
  on responders
  for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Coordinators and admins can update responder status in exceptional cases
create policy "Coordinators and admins can update responder status"
  on responders
  for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );
