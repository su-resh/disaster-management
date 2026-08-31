create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text unique,
  role text not null check (role in ('citizen', 'responder', 'coordinator', 'inventory_manager', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Policies
-- Allow users to read their own profile
create policy "Users can read own profile"
  on profiles
  for select
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles
  for update
  using (auth.uid() = id);

-- Trigger to prevent non-admin users from changing the role
create or replace function prevent_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    if (select role from profiles where id = auth.uid()) <> 'admin' then
      raise exception 'Only admins can change the role';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger prevent_role_change_trigger
  before update on profiles
  for each row
  execute function prevent_role_change();