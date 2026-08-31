-- Phase 1D: inventory_transactions — the append-only ledger (plan.md §14, §20)
-- Core principle: stock quantity is NEVER a mutable column. Every change is an INSERT here.
-- Corrections are new offsetting rows; no UPDATE or DELETE policies exist for anyone.

create table inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  resource_type_id bigint not null references resource_types,
  transaction_type text not null check (transaction_type in (
    'RECEIVED', 'RESERVED', 'DISPATCHED', 'DISTRIBUTED',
    'RETURNED', 'DAMAGED', 'ADJUSTED'
  )),
  quantity numeric not null check (quantity > 0), -- direction is implied by type, never by sign
  source_location_id uuid references stock_locations,
  destination_location_id uuid references stock_locations,
  related_resource_request_id uuid, -- FK added in 20260901000003 after resource_requests exists
  related_emergency_request_id uuid references emergency_requests,
  performed_by uuid not null references profiles,
  notes text,
  created_at timestamptz not null default now(),

  -- notes are mandatory for DAMAGED and ADJUSTED (plan.md §14)
  check (
    transaction_type not in ('DAMAGED', 'ADJUSTED')
    or (notes is not null and btrim(notes) <> '')
  ),
  -- a damaged batch must come from somewhere
  check (transaction_type <> 'DAMAGED' or source_location_id is not null),
  -- dispatched goods must leave a source and head to a destination
  check (
    transaction_type <> 'DISPATCHED'
    or (source_location_id is not null and destination_location_id is not null)
  )
);

alter table inventory_transactions enable row level security;

-- Read: coordinator / inventory_manager / admin. Citizens and responders: no access.
create policy "Coordinators inventory managers and admins can read ledger"
  on inventory_transactions
  for select
  to authenticated
  using (
    public.get_current_user_role() in ('coordinator', 'inventory_manager', 'admin')
  );

-- Insert: inventory_manager / admin only.
-- (RESERVED rows are inserted by the security-definer reserve_stock_for_request() function.)
create policy "Inventory managers and admins can insert transactions"
  on inventory_transactions
  for insert
  to authenticated
  with check (
    public.get_current_user_role() in ('inventory_manager', 'admin')
  );

-- Deliberately NO update / delete policies: append-only ledger.

create index idx_inventory_transactions_resource_type_id on inventory_transactions(resource_type_id);
create index idx_inventory_transactions_resource_dest on inventory_transactions(resource_type_id, destination_location_id);
create index idx_inventory_transactions_created_at on inventory_transactions(created_at);
create index idx_inventory_transactions_related_request on inventory_transactions(related_resource_request_id);
