create table emergency_requests (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles not null,
  disaster_type_id bigint references disaster_types,
  emergency_type text,
  status text not null default 'NEW' check (status in ('NEW', 'VERIFIED', 'REJECTED', 'ASSIGNED', 'RESPONDER_ON_WAY', 'RESCUING', 'RESCUED', 'CANCELLED')),
  severity_id bigint references severity_levels,
  people_count integer not null check (people_count >= 0),
  injured_count integer not null default 0 check (injured_count >= 0),
  description text,
  latitude numeric,
  longitude numeric,
  location_text text,
  contact_phone text not null,
  special_needs text,
  photo_url text,
  rejected_reason text,
  verified_by uuid references profiles,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table emergency_requests enable row level security;

-- Policies
-- Allow any authenticated user to insert their own emergency request
create policy "Users can insert own emergency request"
  on emergency_requests
  for insert
  with check (auth.uid() = created_by);

-- Allow users to select their own emergency requests
create policy "Users can select own emergency requests"
  on emergency_requests
  for select
  using (auth.uid() = created_by);

-- Allow coordinators and admins to select all emergency requests
create policy "Coordinators and admins can select all emergency requests"
  on emergency_requests
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );

-- Allow coordinators and admins to update specific fields (status, verified_by, verified_at, rejected_reason)
create policy "Coordinators and admins can update certain fields"
  on emergency_requests
  for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('coordinator', 'admin')
    )
  );

-- No DELETE policy for anyone except admin (we'll rely on admin bypassing RLS? Actually, we can create a policy for admin to delete)
-- But the requirement says: No DELETE policy for anyone except admin.
-- We'll create a policy that allows admin to delete.
create policy "Admins can delete emergency requests"
  on emergency_requests
  for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Indexes
create index idx_emergency_requests_status on emergency_requests(status);
create index idx_emergency_requests_severity_id on emergency_requests(severity_id);
create index idx_emergency_requests_created_at on emergency_requests(created_at);
create index idx_emergency_requests_status_severity_id on emergency_requests(status, severity_id);

-- Trigger to update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_emergency_requests_updated_at
before update on emergency_requests
for each row
execute function update_updated_at_column();

-- Storage bucket for emergency photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('emergency-photos', 'emergency-photos', false, 5242880, '{image/jpeg,image/png}')
on conflict (id) do nothing;

-- Storage policy: allow authenticated users to upload to their own folder
create policy "Users can upload own emergency photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'emergency-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policy: allow users to view photos if they can view the request (simplified: own folder or coordinator/admin)
create policy "Users can view own emergency photos"
  on storage.objects
  for select
  using (
    bucket_id = 'emergency-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role in ('coordinator', 'admin')
      )
    )
  );
