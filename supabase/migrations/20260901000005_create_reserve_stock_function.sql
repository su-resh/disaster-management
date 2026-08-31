-- Phase 1D: reservation safety check (plan.md §13 step 3, task step 5).
-- The ONE place a race condition matters, so it lives in the database:
-- checks CURRENT available_stock from stock_summary at attempt time and, only
-- if it passes, inserts the RESERVED ledger row AND updates the request status
-- atomically (both happen or neither does — single PL/pgSQL function).
--
-- Reservation is made at the SOURCE location (the warehouse that must hold the
-- goods), not the request's destination — you earmark stock where it physically
-- sits. p_fulfilled_quantity allows partial fulfillment; null = full quantity.

create or replace function reserve_stock_for_request(
  p_request_id uuid,
  p_source_location_id uuid,
  p_fulfilled_quantity numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request resource_requests%rowtype;
  v_qty numeric;
  v_available numeric;
begin
  -- only inventory roles may reserve
  if public.get_current_user_role() not in ('coordinator', 'inventory_manager', 'admin') then
    raise exception 'Only coordinators, inventory managers and admins can reserve stock';
  end if;

  -- lock the request row so concurrent reservations serialize
  select * into v_request
  from resource_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Resource request % not found', p_request_id;
  end if;

  if v_request.status <> 'APPROVED' then
    raise exception 'Only APPROVED requests can be reserved (current status: %)', v_request.status;
  end if;

  v_qty := coalesce(p_fulfilled_quantity, v_request.requested_quantity);
  if v_qty <= 0 or v_qty > v_request.requested_quantity then
    raise exception 'Fulfilled quantity must be between 0 and requested quantity (%)', v_request.requested_quantity;
  end if;

  if p_source_location_id is null or not exists (select 1 from stock_locations where id = p_source_location_id and is_active) then
    raise exception 'A valid, active source location is required to reserve stock';
  end if;

  -- the actual safety check: read CURRENT available stock from the derived view
  select coalesce(s.available_stock, 0) into v_available
  from stock_summary s
  where s.resource_type_id = v_request.resource_type_id
    and s.location_id = p_source_location_id;

  if v_available is null or v_available < v_qty then
    raise exception 'Insufficient stock: cannot reserve % of this resource — only % available at this location',
      v_qty, coalesce(v_available, 0);
  end if;

  -- check passed: insert the RESERVED ledger row
  insert into inventory_transactions (
    resource_type_id, transaction_type, quantity,
    destination_location_id, -- RESERVED stock is earmarked AT the source location
    related_resource_request_id, performed_by, notes
  ) values (
    v_request.resource_type_id, 'RESERVED', v_qty,
    p_source_location_id,
    v_request.id, auth.uid(), 'Reserved for resource request'
  );

  -- and flip the request status — same transaction, all-or-nothing
  update resource_requests
  set status = 'RESERVED',
      fulfilled_quantity = v_qty,
      approved_by = coalesce(approved_by, auth.uid()),
      updated_at = now()
  where id = v_request.id;

  return v_request.id;
end;
$$;
