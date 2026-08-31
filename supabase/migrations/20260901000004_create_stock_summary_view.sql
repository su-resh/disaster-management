-- Phase 1D: stock_summary — the ONLY place stock math lives (plan.md §14).
-- Created after resource_requests because reserved_stock joins it.
-- Per resource_type + location:
--   current_stock   = inflows(RECEIVED, RETURNED, DISTRIBUTED-arrival, positive ADJUSTED) at the location
--                   - outflows(DISPATCHED, DAMAGED, DISTRIBUTED-departure, negative ADJUSTED) at the location
--   reserved_stock  = sum of RESERVED rows for requests still in status 'RESERVED'
--   available_stock = current_stock - reserved_stock
--   dispatched_stock (in transit from this location) = DISPATCHED - DISTRIBUTED offsets at this source
--
-- Location conventions for the ledger:
--   inflow rows (RECEIVED/RETURNED) carry destination_location_id only
--   outflow rows (DISPATCHED/DAMAGED) carry source_location_id
--   DISTRIBUTED carries BOTH: source (the dispatch origin, offsets in-transit) and destination (arrival, adds stock)
--   ADJUSTED carries exactly one location: destination = positive correction, source = negative correction
--   RESERVED carries destination_location_id = the location stock is earmarked at

create or replace view stock_summary
with (security_invoker = true) as
with movements as (
  -- side A: rows attributed to their destination (inflows)
  select
    t.resource_type_id,
    t.destination_location_id as location_id,
    case t.transaction_type
      when 'RECEIVED'    then t.quantity
      when 'RETURNED'    then t.quantity
      when 'DISTRIBUTED' then t.quantity
      when 'ADJUSTED'    then t.quantity
      else 0
    end as stock_delta,
    0 as dispatched_delta
  from inventory_transactions t
  where t.destination_location_id is not null
    and t.transaction_type in ('RECEIVED', 'RETURNED', 'DISTRIBUTED', 'ADJUSTED', 'RESERVED')

  union all

  -- side B: rows attributed to their source (outflows / in-transit departures)
  select
    t.resource_type_id,
    t.source_location_id as location_id,
    case t.transaction_type
      when 'DISPATCHED'  then -t.quantity
      when 'DAMAGED'     then -t.quantity
      when 'DISTRIBUTED' then -t.quantity -- offsets the in-transit departure side
      when 'ADJUSTED'    then -t.quantity -- negative correction
      else 0
    end as stock_delta,
    case t.transaction_type
      when 'DISPATCHED'  then t.quantity
      when 'DISTRIBUTED' then -t.quantity
      else 0
    end as dispatched_delta
  from inventory_transactions t
  where t.source_location_id is not null
    and t.transaction_type in ('DISPATCHED', 'DAMAGED', 'DISTRIBUTED', 'ADJUSTED')
),
aggregated as (
  select
    resource_type_id,
    location_id,
    sum(stock_delta) as current_stock,
    sum(dispatched_delta) as dispatched_stock
  from movements
  group by resource_type_id, location_id
),
reservations as (
  select
    t.resource_type_id,
    t.destination_location_id as location_id,
    sum(t.quantity) as reserved_stock
  from inventory_transactions t
  join resource_requests r on r.id = t.related_resource_request_id
  where t.transaction_type = 'RESERVED'
    and r.status = 'RESERVED' -- once DISPATCHED/CANCELLED, the reservation leaves this bucket
  group by t.resource_type_id, t.destination_location_id
)
select
  a.resource_type_id,
  a.location_id,
  a.current_stock,
  coalesce(r.reserved_stock, 0) as reserved_stock,
  a.current_stock - coalesce(r.reserved_stock, 0) as available_stock,
  a.dispatched_stock
from aggregated a
left join reservations r
  on r.resource_type_id = a.resource_type_id
  and r.location_id = a.location_id;
