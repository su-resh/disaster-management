-- Phase 1D: resource_requests (plan.md §13, §20)

create table resource_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references profiles,
  resource_type_id bigint not null references resource_types,
  requested_quantity numeric not null check (requested_quantity > 0),
  fulfilled_quantity numeric not null default 0 check (
    fulfilled_quantity >= 0 and fulfilled_quantity <= requested_quantity
  ),
  destination_location_id uuid references stock_locations,
  destination_shelter_id uuid, -- no FK yet: shelters table arrives in Phase 1E
  related_emergency_request_id uuid references emergency_requests,
  urgency text not null default 'MEDIUM' check (urgency in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status text not null default 'REQUESTED' check (status in (
    'REQUESTED', 'APPROVED', 'REJECTED', 'RESERVED',
    'DISPATCHED', 'RECEIVED', 'COMPLETED', 'CANCELLED'
  )),
  approved_by uuid references profiles,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table resource_requests enable row level security;

-- creator can read their own; coordinator/inventory_manager/admin can read all
create policy "Users can read own resource requests"
  on resource_requests
  for select
  to authenticated
  using (requested_by = auth.uid());

create policy "Inventory roles can read all resource requests"
  on resource_requests
  for select
  to authenticated
  using (
    public.get_current_user_role() in ('coordinator', 'inventory_manager', 'admin')
  );

-- any authenticated user can create a request (coordinators now, shelter managers later)
create policy "Authenticated users can create resource requests"
  on resource_requests
  for insert
  to authenticated
  with check (requested_by = auth.uid());

-- coordinator/inventory_manager/admin can update (approve/reject/reserve/dispatch/receive/complete)
create policy "Inventory roles can update resource requests"
  on resource_requests
  for update
  to authenticated
  using (
    public.get_current_user_role() in ('coordinator', 'inventory_manager', 'admin')
  );

create index idx_resource_requests_status on resource_requests(status);
create index idx_resource_requests_related_emergency on resource_requests(related_emergency_request_id);
create index idx_resource_requests_destination_shelter on resource_requests(destination_shelter_id);
create index idx_resource_requests_resource_type on resource_requests(resource_type_id);

-- updated_at trigger (same function as emergency_requests)
create trigger update_resource_requests_updated_at
before update on resource_requests
for each row
execute function update_updated_at_column();

-- Now that resource_requests exists, attach the deferred FK from the ledger
alter table inventory_transactions
  add constraint inventory_transactions_related_request_fkey
  foreign key (related_resource_request_id) references resource_requests;

-- Realtime (plan.md §16): ledger + request queue update live on the dashboard
alter publication supabase_realtime add table inventory_transactions;
alter publication supabase_realtime add table resource_requests;
