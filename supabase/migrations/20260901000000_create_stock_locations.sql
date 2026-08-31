-- Phase 1D: stock_locations — physical/logical places stock is tracked at (plan.md §20)
create table stock_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude numeric,
  longitude numeric,
  address_text text,
  type text not null default 'warehouse' check (type in ('warehouse', 'hub', 'shelter', 'other')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table stock_locations enable row level security;

-- Read: all authenticated users
create policy "Authenticated users can read stock locations"
  on stock_locations
  for select
  to authenticated
  using (true);

-- Write: inventory_manager / admin only
create policy "Inventory managers and admins can insert stock locations"
  on stock_locations
  for insert
  to authenticated
  with check (
    public.get_current_user_role() in ('inventory_manager', 'admin')
  );

create policy "Inventory managers and admins can update stock locations"
  on stock_locations
  for update
  to authenticated
  using (
    public.get_current_user_role() in ('inventory_manager', 'admin')
  );

create index idx_stock_locations_type on stock_locations(type);
create index idx_stock_locations_is_active on stock_locations(is_active);

-- Seed one starter warehouse so the flow is testable immediately
insert into stock_locations (name, type, address_text) values
  ('Central Warehouse', 'warehouse', 'Kathmandu');
