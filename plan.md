# Disaster Response & Resource Allocation System

**Status:** Planning document — no code written yet
**Owner:** Solo developer (student, Flutter + Next.js + limited backend experience)
**Target context:** Nepal, real disasters, no government/telecom/satellite data access

---

## 1. Vision

A coordination layer that lets citizens report emergencies, coordinators triage and assign responders, and resource teams track exactly what supplies exist and where they went — using only data the platform's own users generate. It should be useful the day it ships, not after some future integration that may never happen.

The system does not predict disasters, does not replace emergency services, and does not depend on any data source outside its own users. Its value is entirely from organizing human-reported information faster and more reliably than phone calls, WhatsApp groups, and paper logs — which is what actually happens in Nepal today.

## 2. Problem

During floods, landslides, earthquakes, and fires in Nepal, coordination currently happens through scattered phone calls, Facebook posts, and ad-hoc WhatsApp/Viber groups. This causes:

- No single view of "who needs help, where, how urgent"
- No visibility into which responders are free vs. already assigned
- No record of what resources exist, what's been promised twice, what's already been given out
- No audit trail — supplies get sent but nobody can say where 500 water bottles went
- Duplicate or contradictory reports, with no way to verify or deduplicate
- Total breakdown when the person coordinating loses phone battery or signal

None of this requires satellite data or government APIs to fix. It requires a shared, structured, realtime source of truth that many people can read and write to at once.

## 3. Goals

- Give citizens a fast way to report an emergency with location and severity
- Give coordinators a live dashboard to triage, verify, and assign
- Give responders a clear queue of assignments and a way to update status
- Give inventory/resource teams an auditable ledger of stock and dispatch
- Connect emergency operations to resource needs (a rescue can trigger a resource request)
- Work in a genuinely low-connectivity environment, with explicit and honest offline behavior
- Be buildable and deployable by one student developer in a realistic timeframe
- Be disaster-type agnostic (floods, landslides, earthquakes, fires, storms, avalanches, accidents) via configuration, not hardcoding

## 4. Non-Goals

- Not a replacement for police, ambulance, fire brigade, or government emergency response
- Not a prediction/early-warning system (no seismic, hydrological, or weather modeling)
- Not a drone/satellite/GIS analytics platform
- Not a hospital or ambulance dispatch system
- Not a general-purpose donation/crowdfunding platform (may be revisited later, explicitly deferred)
- Not a multi-country, multi-language, enterprise-scale platform in v1
- Not a chat/messaging replacement (no in-app chat in MVP)
- Not an automatic routing/logistics optimizer in MVP

## 5. Real-World Constraints

Explicitly acknowledged and designed around:

- **No government, telecom, hospital, or police APIs.** All data is user-generated.
- **No satellite/drone feeds.** Location comes from citizen GPS or manual pin placement.
- **No large disaster datasets.** No historical flood maps, no seismic zoning data baked in.
- **One developer, limited backend experience.** Architecture must minimize custom backend code — lean hard on Supabase (Auth, Postgres, Realtime, Storage, RLS) instead of building a custom server.
- **Poor connectivity is the norm during disasters, not the exception.** Every feature must degrade gracefully, not silently fail.
- **No dedicated ops team.** No 24/7 NOC, no on-call engineers, no SLA. This shapes what "coordinator" verification even means (best-effort, not guaranteed).
- **Nepal-specific realities:** intermittent electricity, patchy 3G/4G outside cities, low willingness to install a new app unless it's simple, Nepali/English mixed usage, phone numbers as the practical identity anchor.

## 6. Target Users

- Citizens/bystanders in or near a disaster zone, reporting emergencies
- Trained or informal responders (rescue teams, ward-level volunteers, Red Cross-style local units)
- Coordinators — the person(s) triaging incoming reports and assigning responders (could be a ward officer, an NGO staff member, a CAPEC-style volunteer org lead)
- Inventory/resource managers at a relief hub or warehouse
- Shelter managers running a temporary shelter
- Administrators who configure the system for a specific district/organization deployment

## 7. User Roles

Evaluated critically — not every role listed in the brief is necessary for MVP.

| Role | MVP? | Reasoning |
|---|---|---|
| Citizen | **Yes** | Core input source; must be as frictionless as possible (phone-based auth, minimal fields) |
| Coordinator | **Yes** | Core triage function; without this role nothing gets assigned |
| Responder | **Yes** | Core execution function; needs a status they can update themselves |
| Inventory Manager | **Yes** | Needed the moment resource requests exist; without it inventory numbers rot |
| Shelter Manager | **Should have, not MUST for launch day** | Shelters matter but the emergency+resource loop can launch without shelter records; shelters can be added as simple entities in Phase 1 with a lightweight manager role reusing Coordinator permissions initially |
| Volunteer | **Merged into Responder for MVP** | A separate "Volunteer" role with different permissions adds complexity without a clear functional difference at MVP scale; volunteers ARE responders with lighter equipment/skills fields. Revisit if the two populations diverge in practice. |
| Administrator | **Yes, minimal** | Needed to create the first Coordinator account, configure disaster type / resource type lists, and manage users. Kept deliberately thin — not a full admin console in MVP. |

Decision: **5 functional roles for MVP** — `citizen`, `responder`, `coordinator`, `inventory_manager`, `admin`. Shelter manager reuses coordinator-level permissions on shelter records until real usage proves a dedicated role is needed.

## 8. Core Modules

1. Emergency / Rescue Requests
2. Responder Management
3. Resource & Inventory Management (ledger-based)
4. Resource Requests
5. Realtime Updates
6. Shelters / Safe Locations
7. Coordinator Dashboard
8. Audit / Activity Log
9. Notifications
10. Offline / Poor Network Handling

Each is detailed in later sections. All ten are part of the eventual system; not all ten ship in Phase 1 at full depth — see Section 9 and 34-37.

## 9. MVP Scope

**MUST HAVE (Phase 1 — cannot ship without these):**
- Phone-based authentication (Supabase Auth) with role assignment
- Citizen: create emergency request (location, disaster type, people count, severity, description, one photo)
- Coordinator dashboard: live list of emergencies, filter by status/severity, verify/reject, assign responder
- Realtime propagation of new/updated emergencies to coordinator dashboard
- Responder: view assigned tasks, update own status (assigned → on way → on task → completed)
- Basic inventory: resource types, current/reserved/dispatched quantities visible
- Inventory transactions (ledger, not raw quantity edits) for RECEIVED / RESERVED / DISPATCHED / DISTRIBUTED
- Resource requests: create, approve, reserve, dispatch, mark received (simplified state machine)
- Low-stock detection (threshold-based, computed from ledger)
- Activity/audit log for the key actions above
- Basic map (MapLibre + OSM tiles) showing emergency pins and responder pins, no routing

**SHOULD HAVE (Phase 2 — strengthens the MVP, not blocking launch):**
- Shelters as first-class entities linked to resource requests
- Photo/video upload beyond a single photo (Supabase Storage, size-limited)
- Push notifications (not just in-app/realtime)
- Duplicate-report detection (proximity + time window heuristic)
- Damaged/returned/adjusted inventory transaction types
- Offline request queueing with sync-on-reconnect
- Responder skills/equipment matching suggestions (manual override always available)
- Basic reporting/export (CSV of activity log, inventory ledger)

**NICE TO HAVE (later, only if real usage justifies it):**
- Routing/ETA for responders
- SMS-based reporting fallback (for citizens with no smartphone/data) — high value but needs an SMS gateway budget and provider, so it's gated on funding, not just engineering time
- Multi-organization / multi-district partitioning
- Public read-only status page for a disaster (transparency)
- In-app chat between coordinator and responder
- Multi-language UI (Nepali/English toggle) — start Nepali+English bilingual labels only, full i18n later

**DO NOT BUILD YET:**
- Any government/telecom/hospital integration (no API exists to integrate with)
- Predictive/early-warning modeling
- Drone or satellite imagery handling
- AI-based damage assessment from photos
- Full RBAC admin console with granular permission editing
- Multi-tenant SaaS billing/subscription system
- Native push infrastructure beyond Supabase Realtime + a simple FCM hookup
- Automatic resource-to-emergency matching algorithms (keep this human-decided in MVP)

## 10. Features Explicitly Deferred

Restating clearly, with reasons, so scope creep is easy to reject later:

- **Chat/messaging** — deferred. Status updates + notes fields cover MVP needs; real-time chat adds infra complexity (typing indicators, message history, moderation) disproportionate to value at this stage.
- **SMS gateway fallback** — deferred. High real-world value in Nepal (many citizens have no data plan during a disaster) but requires a paid SMS provider and a phone number, which is a business/cost decision, not just a technical one. Architecture should not preclude adding it later (see Section 20 — keep emergency_requests source-agnostic).
- **Routing/ETA** — deferred. MapLibre + OSM can show positions; real routing needs a routing engine (OSRM/Valhalla) which is extra infrastructure to run and maintain. Straight-line distance + manual judgment is enough for MVP.
- **AI-based photo triage** — deferred. Unverified value, real cost, and risk of false confidence in a life-safety context.
- **Public transparency dashboard** — deferred but easy to add later since it's just a read-only filtered view.

## 11. Emergency Request Workflow

**States:**
```
NEW → VERIFIED → ASSIGNED → RESPONDER_ON_WAY → RESCUING → RESCUED
NEW → REJECTED
(any active state) → CANCELLED
```

**Flow:**
1. Citizen submits request: GPS (auto-captured, editable pin), disaster type, emergency type, people count, injured count, severity (citizen-selected, coordinator can override), description, optional single photo, contact phone, special needs notes.
2. Request enters `NEW`. Appears instantly on coordinator dashboard via Realtime.
3. Coordinator reviews. Either:
   - Marks `VERIFIED` (may edit severity/details based on a follow-up call)
   - Marks `REJECTED` (with a required reason — spam, duplicate, unable to verify, false report)
4. Coordinator assigns one or more responders → state `ASSIGNED`. This creates a row in `assignments` linking `emergency_request` ↔ `responder`.
5. Responder accepts (or coordinator can force-assign without waiting for acceptance in urgent cases) → responder updates own status; when responder marks "on my way," emergency moves to `RESPONDER_ON_WAY`.
6. Responder marks arrival/active work → `RESCUING`.
7. Responder marks completion → `RESCUED`. Coordinator can also close it.
8. Any request can be moved to `CANCELLED` by the citizen (if it self-resolves) or coordinator (with reason), from any pre-`RESCUED` state.

**Severity levels (configurable list, not hardcoded enum in UI):** `critical`, `high`, `medium`, `low` — stored as a lookup table so new levels or renaming don't require a schema change.

## 12. Responder Workflow

**States:** `AVAILABLE → ASSIGNED → ON_WAY → ON_TASK → AVAILABLE` (loop), plus `OFFLINE` at any point.

**Flow:**
1. Responder registers (or is registered by an admin/coordinator) with skills, phone, vehicle, equipment, base location.
2. Default state `AVAILABLE` when the app is open and they toggle themselves in, `OFFLINE` otherwise. Availability is self-declared, not GPS-enforced (no constant background tracking in MVP — battery and privacy concerns).
3. Coordinator assigns responder to an emergency → responder state `ASSIGNED`. Realtime notification.
4. Responder can **accept** or **reject** the assignment (rejection requires a short reason: wrong skill match, unavailable, too far, other). Rejecting returns the emergency to `VERIFIED`/unassigned and frees the responder back to `AVAILABLE`.
5. On acceptance, responder marks `ON_WAY` when departing, `ON_TASK` when actively working.
6. On completing the task, responder marks themselves back to `AVAILABLE` and the linked emergency updates accordingly (coordinator confirms closure).
7. A responder can go `OFFLINE` at any time (end of shift, phone dying) — coordinators see this immediately and should not assign further tasks to them.

**Design note:** A responder is not automatically un-assignable from multiple simultaneous emergencies — the UI should warn a coordinator if assigning an already-`ASSIGNED`/`ON_TASK` responder, but not hard-block it, because real disasters sometimes require exactly that judgment call.

## 13. Resource Request Workflow

**States:**
```
REQUESTED → APPROVED → RESERVED → DISPATCHED → RECEIVED → COMPLETED
REQUESTED → REJECTED
(any pre-DISPATCHED state) → CANCELLED
```

**Flow and inventory linkage (see Section 14 for the ledger mechanics):**
1. A coordinator, shelter manager, or responder creates a resource request: resource type(s), quantity, destination (shelter, emergency, or free-text location), urgency, linked emergency (optional — resource requests can exist independently of a specific rescue).
2. Inventory manager or coordinator reviews → `APPROVED` or `REJECTED` (with reason: insufficient stock, duplicate, not prioritized).
3. On approval, inventory manager reserves stock → creates a `RESERVED` ledger transaction, request state → `RESERVED`. This decrements *available* stock (current − reserved) without physically moving anything yet, preventing double-promising the same units.
4. When goods physically leave the warehouse, inventory manager records a `DISPATCHED` transaction (with vehicle/carrier notes if relevant) → request state `DISPATCHED`.
5. Recipient (shelter manager, responder, or coordinator on their behalf) confirms receipt → `DISTRIBUTED`/`RECEIVED` transaction recorded, request state `RECEIVED`.
6. Coordinator or inventory manager marks `COMPLETED` once fully reconciled (handles partial fulfillment — see below).
7. **Partial fulfillment:** if only part of a requested quantity can be reserved/dispatched, the request stays `RESERVED`/`DISPATCHED` with a `fulfilled_quantity` field distinct from `requested_quantity`; remaining quantity can be re-approved later or the request closed as partially fulfilled with a reason.

## 14. Inventory & Ledger Model

Core principle: **inventory quantity is never edited directly.** All stock levels are *derived* from a transaction ledger. This is the only realistic way to keep the numbers trustworthy and auditable with multiple people touching stock during chaos.

**Resource type** (configurable, not hardcoded): name, category (food/water/medical/shelter/equipment/other), unit (bottle, kg, box, piece, liter), expiry-tracked flag, minimum stock threshold.

**Stock location:** a resource exists *per location* (warehouse, hub, shelter storeroom) — not as one global number. This matters because "do we have blankets" only makes sense relative to where.

**Transaction types:**
- `RECEIVED` — stock enters the system (donation, purchase, transfer in)
- `RESERVED` — stock earmarked for an approved resource request, not yet moved
- `DISPATCHED` — stock physically leaves a location toward a destination
- `DISTRIBUTED` — stock reaches and is given to end recipients (citizens/shelter)
- `RETURNED` — stock comes back (unused, wrong item, excess)
- `DAMAGED` — stock removed from usable count (spoiled, broken, expired)
- `ADJUSTED` — manual correction (physical count mismatch), always requires a note and is the one transaction type flagged for extra scrutiny in the audit log

**Derived quantities (computed, not stored as mutable columns):**
- `current_stock` = sum(RECEIVED) − sum(DISPATCHED) − sum(DAMAGED) − sum(ADJUSTED negative) + sum(RETURNED) + sum(ADJUSTED positive), per resource per location
- `reserved_stock` = sum(RESERVED) − sum(released reservations) for open requests
- `available_stock` = `current_stock` − `reserved_stock`
- `dispatched_stock` (in transit) = sum(DISPATCHED) − sum(DISTRIBUTED or RETURNED for that batch)

Every transaction row records: who performed it (user id), resource, quantity, unit, source location (nullable for RECEIVED), destination location (nullable for DAMAGED), related resource request id (nullable), related emergency id (nullable), timestamp, notes (required for DAMAGED and ADJUSTED). Nothing is ever deleted — corrections are new offsetting transactions, never edits to history.

**Low-stock detection:** a simple scheduled check (or a Postgres view queried on dashboard load) comparing `current_stock` against `minimum_stock_level` per resource per location, surfaced as a dashboard warning and a notification to inventory managers. No need for a background job framework in MVP — a view + client-side polling/realtime on the transactions table is enough.

## 15. Shelter Model

Kept deliberately simple per the brief.

**Shelter fields:** name, location (GPS + address text), capacity, current occupancy (manually updated by shelter manager — no automated headcount in MVP), food_available (boolean/simple status, not a full ledger link initially), water_available, medical_available, contact phone, status (`open`, `full`, `closed`).

Shelters are a destination option in resource requests (Section 13) and can optionally be linked to a cluster of emergency requests (e.g., "displaced people from this landslide are being routed to Shelter A") via a simple nullable `shelter_id` on `emergency_requests`. No independent shelter-inventory ledger in MVP — if a shelter needs granular stock tracking later, treat it as a `stock_location` in the inventory ledger (see Section 14), which the schema already supports without redesign.

## 16. Realtime Architecture

**Tables that need Realtime (Supabase Postgres changes / broadcast):**
- `emergency_requests` — new rows and status changes must reach the coordinator dashboard within seconds
- `assignments` — status changes must reach the specific responder's device
- `inventory_transactions` — new rows should update dashboard stock views and trigger low-stock checks
- `resource_requests` — status changes matter to coordinators and inventory managers

**Who receives what:**
- Coordinators subscribe to all `emergency_requests` and all `resource_requests` (filtered by their organization/district if multi-org is ever introduced — not in MVP)
- A responder subscribes only to `assignments` rows where `responder_id = their id` (RLS-scoped, small payload)
- Inventory managers subscribe to `inventory_transactions` and `resource_requests` for locations they manage
- Citizens subscribe only to their own submitted `emergency_requests` (status updates on their own report) — not a broad feed

**What should NOT be realtime:**
- Audit/activity log display — useful as a periodically refreshed or on-demand list, not worth a live subscription; reduces unnecessary channel load
- Responder profile edits (skills, vehicle info) — low frequency, no urgency
- Shelter occupancy numbers — near-realtime is fine (refresh on dashboard focus / manual pull-to-refresh), not worth a dedicated channel
- Historical/completed emergencies — only active-state records need live subscriptions; completed ones are fetched once

**Avoiding subscription bloat:** subscribe per-table with server-side RLS filters rather than fetching everything and filtering client-side; unsubscribe when a screen unmounts (Flutter) or component unmounts (Next.js); coordinators' dashboard is the only screen with a "wide" subscription — every other role's subscription is narrow and row-scoped.

## 17. Offline & Poor Connectivity Strategy

Being explicit about what is and is not possible, as required.

**What works offline:**
- Viewing the last-synced snapshot of emergencies/assignments/inventory already loaded onto the device (Flutter local cache, e.g. via a simple local DB such as sqlite/Drift or even structured local storage — kept simple in MVP as a cached last-fetched JSON payload with a visible "last updated at" timestamp)
- Composing a new emergency request or a status update while offline — saved to a **local outbox queue**
- Viewing your own previously queued/unsynced actions and their pending state

**What does NOT work offline (and must be communicated clearly, not hidden):**
- Realtime updates — no live data without a connection, full stop
- Seeing anyone else's new submissions made after you went offline
- Confirming that a queued action has actually reached the server
- Any server-side validation (e.g., "is this resource still available to reserve") — validated only on sync

**Mechanics:**
- Every locally created/edited record gets a client-generated UUID and a `pending_sync` flag, displayed in the UI with a distinct visual state ("Not yet sent — will send when online")
- A background sync process (triggered on connectivity regain, or manual "retry now" button) pushes the outbox in order
- **Conflict handling:** for emergency requests, conflicts are rare (each is a new row, not an edit — low collision risk). For status transitions (e.g., two people trying to mark the same emergency `VERIFIED`) and inventory transactions (two people reserving the same stock), the server is the source of truth: the client submits its intended transaction, and the server-side check (a Postgres function or RLS + constraint) either accepts it or rejects it with a clear reason (e.g., "insufficient available stock — only 40 units left, you requested 50"), which the app must surface, not silently retry-and-overwrite
- Network status indicator shown persistently in the app (online / offline / syncing / N pending actions)
- No claim of realtime sync without connectivity is ever made in the UI copy

**Explicitly not solved in MVP:** true offline-first bidirectional sync with automatic merge (e.g., CRDT-style). This is intentionally simple — outbox + server-authoritative validation — because building real conflict-free sync is a large undertaking not justified at MVP scale. If usage proves this insufficient, revisit in Phase 3.

## 18. Notification Strategy

Kept intentionally narrow — every notification must earn its place, since notification fatigue kills adoption fast.

**In-app / Realtime-driven (MVP):**
- Responder: new assignment received
- Coordinator: assignment accepted/rejected by responder
- Coordinator: new `NEW` emergency request submitted
- Coordinator/Inventory manager: resource request status changed to something needing their action (`REQUESTED` → needs approval; `APPROVED` → needs reservation/dispatch)
- Inventory manager: low-stock threshold crossed
- Coordinator: emergency marked `critical` severity

**Deferred to Phase 2:**
- Push notifications via FCM (so the app doesn't need to be open) — MVP relies on in-app/realtime only, acceptable since coordinators/responders are expected to have the app open during an active response
- Citizen-facing status update notifications ("your request was verified") — nice but not blocking for MVP since citizens can just check the app

**Explicitly avoided:** notification digests, marketing-style notifications, "someone in your area reported X" broad alerts (privacy and panic risk — see Section 21).

## 19. Maps & Location Strategy

**Stack:** MapLibre GL + OpenStreetMap raster/vector tiles (free tile providers such as OSM's own tile server for low volume, or a self-hosted/cached tile approach if usage grows — flagged as a cost item to monitor, not solved now).

**What's stored:** latitude/longitude (PostGIS point type via Supabase's Postgres extensions, or plain numeric lat/lng columns if PostGIS is judged unnecessary complexity for MVP — recommendation: plain lat/lng columns with a Postgres index, PostGIS deferred until proximity queries actually need it), plus a free-text location description (since GPS can be wrong or unavailable, and Nepali addresses are often landmark-based, not street-based).

**What's displayed:**
- Coordinator map view: pins for active emergencies (color-coded by severity), pins for responders (color-coded by availability status), pins for shelters
- Citizen-facing: a single map picker to confirm/adjust their reported location
- Responder view: their assigned emergency's pin plus their own approximate position

**Routing:** explicitly postponed (Section 10). MVP shows straight-line distance (simple haversine calculation, done client-side or in a Postgres function) between responder and emergency as a rough proxy — not turn-by-turn navigation. If a responder wants navigation, MVP hands off to the device's default maps app via a deep link (e.g., opening Google Maps or OSM-based nav app with the destination coordinates) rather than building routing in-house.

**If map tiles are unavailable (offline or tile server down):** the app falls back to showing raw lat/lng and the free-text address, with a clear "map unavailable" state rather than a blank/broken map. Recently viewed tile regions can be cached by MapLibre's built-in caching where feasible, but this is not guaranteed and is not advertised as full offline maps in MVP.

## 20. Database Design

Schema is described conceptually — no SQL yet, per instructions. Supabase/Postgres throughout.

### `profiles`
- **Purpose:** Extends Supabase Auth users with app-specific fields (role, name, phone).
- **Key fields:** id (= auth.users id), full_name, phone, role (enum/lookup: citizen, responder, coordinator, inventory_manager, admin), created_at, is_active.
- **Relationships:** 1:1 with `auth.users`. Referenced by nearly every other table as `created_by`/`assigned_to`.
- **Constraints:** phone should be unique per active profile (practical identity anchor in Nepal); role required.
- **Indexes:** on `role`, on `phone`.
- **Realtime:** not needed.
- **RLS:** users can read their own profile fully; coordinators/admins can read all profiles (for assignment purposes); users can only update their own non-role fields (role changes restricted to admin).

### `disaster_types` (lookup)
- **Purpose:** Configurable list — flood, landslide, earthquake, fire, storm, avalanche, accident, other.
- **Key fields:** id, name, is_active.
- **Relationships:** referenced by `emergency_requests.disaster_type_id`.
- **Constraints:** unique name.
- **Indexes:** none beyond PK needed at this scale.
- **Realtime:** not needed (rarely changes).
- **RLS:** readable by all authenticated users; writable only by admin.

### `severity_levels` (lookup)
- **Purpose:** Configurable severity scale (critical/high/medium/low) instead of a hardcoded enum.
- **Key fields:** id, name, rank (integer, for sort order), color_hint.
- **Relationships:** referenced by `emergency_requests.severity_id`.
- **Realtime:** not needed. **RLS:** read-all, admin-write.

### `emergency_requests`
- **Purpose:** Core citizen-reported incident.
- **Key fields:** id, created_by (nullable if anonymous reporting is ever allowed — MVP requires auth so not nullable initially), disaster_type_id, emergency_type (free text or small lookup — kept as text for MVP flexibility), status (enum: NEW/VERIFIED/REJECTED/ASSIGNED/RESPONDER_ON_WAY/RESCUING/RESCUED/CANCELLED), severity_id, people_count, injured_count, description, latitude, longitude, location_text, contact_phone, special_needs, photo_url (Supabase Storage path), rejected_reason, verified_by, verified_at, shelter_id (nullable), source (enum: app/future-sms — future-proofing per Section 10), created_at, updated_at.
- **Relationships:** belongs to `profiles` (creator), `disaster_types`, `severity_levels`; has many `assignments`; optionally linked to `resource_requests` and `shelters`.
- **Constraints:** status must follow the defined state machine (enforced at application layer initially; a Postgres check/trigger can be added later if invalid transitions become a real problem); people_count ≥ 0.
- **Indexes:** on `status`, on `severity_id`, on `created_at`, composite on `(status, severity_id)` for dashboard filtering; spatial index deferred until PostGIS is adopted.
- **Realtime:** yes — this is the highest-value realtime table.
- **RLS:** citizen can insert their own, read only their own; coordinators/admins can read and update all; responders can read only requests linked to their own assignments.

### `responders`
- **Purpose:** Responder-specific profile data (skills, equipment, vehicle) separate from the generic `profiles` table to keep `profiles` clean.
- **Key fields:** id (= profile id), skills (text array or a small `responder_skills` join table if tagging needs to be queryable — start with a text array for simplicity), vehicle_type, equipment_notes, base_latitude, base_longitude, status (AVAILABLE/ASSIGNED/ON_WAY/ON_TASK/OFFLINE), last_status_update.
- **Relationships:** 1:1 with `profiles` where role = responder; has many `assignments`.
- **Constraints:** status must be one of the defined enum values.
- **Indexes:** on `status` (for "find available responders" queries).
- **Realtime:** yes, scoped — coordinators need to see status changes; a responder's own row matters to themselves.
- **RLS:** responder can read/update their own row; coordinators can read all, and update `status` only in exceptional cases (normally only the responder updates their own status).

### `assignments`
- **Purpose:** Join entity linking an `emergency_request` to a `responder`, with its own lifecycle (accepted/rejected/status).
- **Key fields:** id, emergency_request_id, responder_id, assigned_by, status (ASSIGNED/ACCEPTED/REJECTED/ON_WAY/ON_TASK/COMPLETED), rejection_reason, assigned_at, responded_at, completed_at.
- **Relationships:** belongs to `emergency_requests` and `responders`.
- **Constraints:** a responder can have multiple active assignments (allowed per Section 12, with a UI warning, not a hard block).
- **Indexes:** on `responder_id`, on `emergency_request_id`, on `status`.
- **Realtime:** yes — this is how a responder's device learns about a new task.
- **RLS:** responder reads/updates only rows where `responder_id` = self; coordinators read/write all.

### `resource_types` (lookup)
- **Purpose:** Configurable catalog — food, water, medicine, tents, blankets, clothes, first aid, flashlights, batteries, rescue equipment, fuel, other.
- **Key fields:** id, name, category, unit, is_expiry_tracked, default_minimum_stock, is_active.
- **Relationships:** referenced by `inventory_transactions`, `resource_requests`.
- **Realtime:** not needed. **RLS:** read-all, admin/inventory_manager-write.

### `stock_locations`
- **Purpose:** Physical/logical places stock is tracked at (warehouse, hub, shelter storeroom).
- **Key fields:** id, name, latitude, longitude, address_text, type (warehouse/hub/shelter/other), is_active.
- **Relationships:** referenced by `inventory_transactions` (source/destination), optionally by `shelters`.
- **Realtime:** not needed. **RLS:** read-all authenticated; write restricted to inventory_manager/admin.

### `inventory_transactions`
- **Purpose:** The ledger — the single source of truth for all stock movement (Section 14).
- **Key fields:** id, resource_type_id, transaction_type (RECEIVED/RESERVED/DISPATCHED/DISTRIBUTED/RETURNED/DAMAGED/ADJUSTED), quantity, source_location_id (nullable), destination_location_id (nullable), related_resource_request_id (nullable), related_emergency_request_id (nullable), performed_by, notes (required for DAMAGED/ADJUSTED — enforced at application layer), expiry_date (nullable, when resource is expiry-tracked), created_at.
- **Relationships:** belongs to `resource_types`, `stock_locations` (x2), optionally `resource_requests`, `emergency_requests`, `profiles`.
- **Constraints:** quantity > 0 always (direction is implied by transaction_type, not sign — keeps the ledger easy to reason about); notes required for DAMAGED/ADJUSTED (application-level check, can be promoted to a DB constraint later).
- **Indexes:** on `resource_type_id`, on `(resource_type_id, destination_location_id)` for stock-by-location queries, on `created_at` for audit ordering, on `related_resource_request_id`.
- **Realtime:** yes — drives dashboard stock numbers and low-stock alerts.
- **RLS:** insert restricted to inventory_manager/admin (and coordinators for RESERVED, if that responsibility is shared — decide at implementation time based on real team structure); read-all for coordinators/inventory managers, read-none for citizens, read-limited for responders (only transactions tied to their assignments, if shown at all).

### `resource_requests`
- **Purpose:** A request for resources tied to a destination and (optionally) an emergency.
- **Key fields:** id, requested_by, resource_type_id, requested_quantity, fulfilled_quantity (default 0), destination_location_id (nullable), destination_shelter_id (nullable), related_emergency_request_id (nullable), urgency, status (REQUESTED/APPROVED/REJECTED/RESERVED/DISPATCHED/RECEIVED/COMPLETED/CANCELLED), approved_by, rejected_reason, created_at, updated_at.
- **Relationships:** belongs to `resource_types`, optionally `stock_locations`, `shelters`, `emergency_requests`, `profiles`.
- **Constraints:** requested_quantity > 0; fulfilled_quantity ≤ requested_quantity.
- **Indexes:** on `status`, on `related_emergency_request_id`, on `destination_shelter_id`.
- **Realtime:** yes.
- **RLS:** creator can read/insert their own; coordinators and inventory managers can read/update all.

### `shelters`
- **Purpose:** Safe locations, per Section 15.
- **Key fields:** id, name, latitude, longitude, address_text, capacity, current_occupancy, food_available, water_available, medical_available, contact_phone, status (open/full/closed), managed_by (nullable profile id), created_at.
- **Relationships:** referenced by `emergency_requests.shelter_id`, `resource_requests.destination_shelter_id`.
- **Realtime:** low priority — refresh-on-load acceptable for MVP, can add later cheaply.
- **RLS:** read-all authenticated; write restricted to coordinators/admin (and the assigned shelter manager for occupancy/status fields, once that permission model is needed).

### `activity_log`
- **Purpose:** Human-readable audit trail across all major actions (Section 22).
- **Key fields:** id, actor_id, action (short code, e.g. `EMERGENCY_VERIFIED`, `RESPONDER_ASSIGNED`, `RESOURCE_DISPATCHED`), entity_type, entity_id, previous_state (nullable JSON/text), new_state (nullable JSON/text), notes, created_at.
- **Relationships:** loosely references `profiles` (actor) and polymorphically references whatever entity_type/entity_id points to (no hard FK, by design — audit logs should survive even if referential integrity gets complicated).
- **Constraints:** none beyond required actor_id, action, created_at.
- **Indexes:** on `entity_type, entity_id`, on `created_at`, on `actor_id`.
- **Realtime:** not needed (Section 16) — periodic refresh or on-demand load only.
- **RLS:** read access for coordinators/admins/inventory managers (scoped to relevant entity types for inventory managers if desired); no write access from client (writes happen via a server-side function/trigger, not direct client inserts, to prevent tampering — see Section 21).

**Population strategy for lookup tables** (`disaster_types`, `severity_levels`, `resource_types`): seeded once at setup time by the admin/developer, editable later by admin role — not hardcoded in application code, so a new disaster type or resource category never requires a redeploy.

## 21. Security & RLS Strategy

- **Authentication:** Supabase Auth, phone-number-based (OTP) as the primary method given Nepal's context — email is a poor fit for many potential users. Fallback to email/password for admin/office-based roles (coordinators, inventory managers) is acceptable since they're more likely to have reliable email/desktop access.
- **Role-based authorization:** role stored on `profiles`, enforced via RLS policies that check `auth.uid()` against role and ownership, not via client-side checks alone (client-side role checks are for UX only, never trusted for security).
- **RLS is the primary security boundary** — every table above has RLS enabled by default (deny-all, then explicit allow policies), consistent with Supabase best practice, rather than relying on a custom backend to gatekeep.
- **Sensitive information:** citizen phone numbers and exact GPS location are the most sensitive fields. Citizens should NOT be broadly readable to other citizens — only to coordinators/responders actually assigned to their case. A citizen's own past requests are visible only to themselves and coordinators/admins.
- **Location privacy:** exact coordinates are only exposed to roles that need them operationally (coordinators, assigned responders). Any future public-facing dashboard (Section 10, deferred) must show only an approximate area, never exact pins, for citizen-submitted emergencies.
- **Audit logging integrity:** `activity_log` inserts should happen via a Postgres function/trigger tied to the state-changing action (e.g., a trigger on `emergency_requests` status updates) rather than trusting the client to also remember to log — this guarantees the log can't be bypassed or forgotten, and can't be forged by a client sending a fake log entry directly.
- **Abuse/spam prevention (MVP-appropriate, not over-built):** rate-limit emergency request creation per user (e.g., basic application-level check: flag if the same user creates more than N requests in a short window, surfaced to coordinators rather than auto-blocked, since auto-blocking a real emergency reporter is far worse than tolerating some spam); require phone verification before a citizen can submit; coordinators can `REJECT` with a reason, and repeated rejected/false reports from the same phone number should be visible to admins as a pattern (a simple count/flag, not a machine-learning fraud system).
- **Request verification:** MVP verification is human (a coordinator calls the number or checks known context) — no automated verification is invented. The `VERIFIED` state exists specifically to make this human judgment step visible and required before resources/responders are committed, though a `critical` severity report can be assigned before full verification if a coordinator judges the risk of waiting is worse (documented as a deliberate escape hatch, not a workflow violation).

## 22. Audit & Accountability

Every state-changing action on the core entities must produce an `activity_log` row (Section 20), specifically:

- Emergency created / verified / rejected / assigned / status changed / cancelled
- Assignment created / accepted / rejected / status changed
- Resource request created / approved / rejected / reserved / dispatched / received / completed
- Inventory transaction of any type (the transaction row itself largely IS the audit trail for inventory, but a mirrored `activity_log` entry gives a unified human-readable timeline alongside emergency/assignment events)
- Responder status changes are logged but may be excluded from the *default* activity feed view (too noisy) while still queryable

Each entry captures actor, action, entity, before/after state where meaningful, and timestamp — enabling exactly the kind of statements required: "Team 04 assigned to Emergency #102," "500L water dispatched to Shelter A," "Coordinator approved request #45." The dashboard's activity feed is a filtered, human-readable rendering of this table.

## 23. Flutter Architecture

High-level structure only — no files generated.

- **Purpose:** primary app for Citizens and Responders (field use, needs to work on cheap Android phones with poor connectivity). Coordinator/Inventory roles may also use it, but their primary workspace is the Next.js web dashboard.
- **State management:** a single, simple approach (e.g., Riverpod or Provider — pick one and stay consistent; avoid mixing patterns as a solo dev).
- **Layered structure (conceptual, not literal folders yet):**
  - Data layer: Supabase client wrapper, repositories per entity (emergency requests, assignments, inventory reads, resource requests), local outbox/queue store for offline actions
  - Domain layer: simple models mirroring the DB tables, plus the state-machine logic for valid status transitions (kept in one place so both app and any admin tooling agree on what's a valid transition)
  - Presentation layer: screens per role (citizen report flow, responder task list/detail, minimal coordinator view if included in-app at all — likely deferred to web)
- **Connectivity handling:** a single connectivity-status provider consumed app-wide; outbox sync triggered on reconnect and via manual retry action.
- **Maps:** MapLibre Flutter plugin, single reusable map widget parameterized by pins/markers passed in.

## 24. Next.js Architecture

- **Purpose:** primary workspace for Coordinators, Inventory Managers, and Admins — dashboard-heavy, desktop-first, realtime-heavy.
- **Structure (conceptual):**
  - App router with route groups per role area (dashboard/emergencies, dashboard/responders, dashboard/inventory, dashboard/resource-requests, dashboard/shelters, dashboard/activity)
  - A shared Supabase client (server + browser variants per Next.js/Supabase SSR conventions)
  - Realtime subscriptions initialized per relevant page, torn down on navigation away
  - Shared UI primitives (Tailwind-based) for status badges, tables, forms — kept minimal and consistent rather than a heavy design system
- **Rendering approach:** mostly client-rendered for realtime-dependent views (dashboard lists), server-rendered/static for anything that doesn't need to be live (settings, lookup-table admin screens).

## 25. Supabase Architecture

- **Auth:** phone OTP (primary) + email/password (secondary, admin/office roles), `profiles` table extending `auth.users`.
- **Database:** Postgres with the schema in Section 20; RLS enabled on every table; a small number of Postgres functions/triggers for: activity log auto-insertion, derived stock views (current/reserved/available), and state-transition validation where it's worth enforcing server-side rather than only in app code.
- **Realtime:** Postgres changes (or Broadcast, depending on scale needs) on the four tables identified in Section 16.
- **Storage:** a single bucket (or a couple, e.g., `emergency-photos`, later `resource-docs`) with RLS-equivalent storage policies restricting who can upload/read which paths; images size-limited and compressed client-side before upload to protect low-bandwidth uploads.
- **Edge Functions:** none required for MVP given how much Postgres functions + RLS can cover; revisit only if a genuinely server-only concern arises (e.g., a future SMS gateway webhook receiver).

## 26. Important UI Screens

**Flutter (Citizen/Responder):**
- Citizen: report emergency form (with map picker), my requests list/detail, request status timeline
- Responder: available/offline toggle, assigned tasks list, task detail with status update actions, map to task location

**Next.js (Coordinator/Inventory/Admin):**
- Coordinator: live emergencies dashboard (list + map, filterable by status/severity), emergency detail (verify/reject/assign), responders list (availability), resource requests list, activity feed
- Inventory Manager: stock overview per resource per location, transaction entry form, resource requests queue (approve/reserve/dispatch), low-stock alerts panel
- Admin: user/role management, lookup-table management (disaster types, severity levels, resource types)

## 27. Failure & Edge Cases

- **Duplicate emergency:** two citizens report the same incident. MVP handling: coordinator sees both on the map in close proximity and manually marks one as a duplicate (`REJECTED`, reason "duplicate of #X", with a reference field). Automated proximity/time-window flagging is a Phase 2 enhancement, not MVP-blocking.
- **False report:** coordinator rejects with reason "unable to verify" or "false report"; repeated false reports from one phone number become visible to admins as a pattern (Section 21) for manual follow-up (e.g., temporary account restriction) — no automated banning in MVP.
- **Responder rejects assignment:** assignment returns to a rejectable/unassigned state, emergency stays `VERIFIED` (or reverts from `ASSIGNED`), coordinator reassigns; reason captured for pattern visibility (e.g., if one responder always rejects, their profile data might be wrong).
- **Resource unavailable:** reservation attempt against insufficient `available_stock` is rejected server-side with the actual available number returned, so the requester/inventory manager can adjust the request rather than silently over-committing.
- **Partial fulfillment:** handled via `fulfilled_quantity` vs `requested_quantity` on `resource_requests` (Section 20); the remainder can be re-requested or explicitly closed as unfulfilled with a reason.
- **Internet disconnects mid-action:** the action is queued locally (Section 17); UI clearly shows "pending sync," never shows a false success state.
- **Two people modify the same inventory concurrently:** the ledger model itself mostly prevents this class of bug (each action is an insert, not a shared-row update), but reservation-vs-availability races are handled by a server-side check at the moment of insert (reject with reason if insufficient stock at commit time, not just at form-load time).
- **Emergency is cancelled:** allowed from any pre-`RESCUED` state by the citizen (self-resolved) or coordinator (with reason); linked open assignments are auto-marked for coordinator review (not silently orphaned) and linked in-flight resource requests are flagged for the inventory manager to confirm whether to proceed or cancel.
- **Responder loses connection mid-task:** their last-known status persists (stale but visible, with a "last updated X minutes ago" timestamp so coordinators know the data may be outdated) rather than the UI implying it's live when it isn't.

## 28. Abuse & False Information

- Every emergency report is tied to an authenticated, phone-verified account — not anonymous, which is the single biggest deterrent to casual abuse.
- Coordinators are the verification gate before resources/responders commit meaningfully (Section 21) — the system relies on human judgment here, deliberately, rather than pretending an algorithm can verify a real emergency.
- Rejected/false-report history per user is visible to admins/coordinators as a pattern signal, not hidden.
- No public unauthenticated write access anywhere in the system.
- Photo uploads are size/type restricted and stored with access control (not publicly listable), reducing misuse as a general file-sharing vector.
- This is a known-hard problem with no perfect technical solution; the plan does not overclaim a spam/fraud detection capability the system doesn't actually have.

## 29. Safety Boundaries

This system is explicitly and permanently a **coordination and information tool**, not an emergency service:

- It does NOT replace calling police, fire, ambulance, or official government emergency numbers, and the app should say so clearly in relevant places (e.g., a persistent note on the citizen report screen: "For immediate life-threatening emergencies, also call [official emergency number] if possible").
- It does NOT guarantee response time, responder dispatch, or resource delivery — there is no SLA, and the UI must not imply one.
- It does NOT verify medical/professional qualifications of responders — "responder" in this system means someone registered by an admin/coordinator as available to help, which may include trained professionals and capable volunteers alike; the system is honest that it cannot itself certify anyone's competence.
- Any future integration with actual government/emergency-service systems would need to be built and agreed with those institutions directly — this plan does not assume or fake such integration.

## 30. Technical Risks

| Risk | Mitigation |
|---|---|
| Solo developer, limited backend experience, risk of RLS misconfiguration exposing data | Start with deny-all RLS and add narrow allow policies one at a time, test each with a non-privileged test account before considering a table "done" |
| Realtime subscription overload as usage grows | Keep subscriptions role-scoped and table-scoped per Section 16 from day one, not retrofitted later |
| Offline sync bugs causing lost or duplicated submissions | Client-generated UUIDs for offline-created records (idempotent upsert on sync), explicit pending/synced/failed states surfaced in UI |
| Map tile costs/availability at scale | Start with a low-volume free OSM tile source; monitor usage; be ready to switch to a paid or self-hosted tile provider if traffic grows — flagged now so it's not a surprise later |
| Schema changes becoming painful once real data exists | Favor additive migrations (new nullable columns, new lookup rows) over destructive changes; lookup tables (Section 20) absorb most "new category" needs without schema changes at all |
| Single developer = bus factor of one | Keep this plan.md and the eventual codebase well-documented; avoid cleverness; prefer boring, readable patterns throughout |

## 31. Product Risks

| Risk | Mitigation |
|---|---|
| No one adopts it during an actual disaster because they don't know it exists | Out of scope for the platform itself, but plan should note: partner with an existing org (e.g., CAPEC, a ward office, a local Red Cross-style unit) before a real disaster, not during one, so there's a trained coordinator ready |
| Coordinators are overwhelmed and can't triage fast enough | Keep the coordinator UI fast and low-friction (default sort by severity+recency, one-click verify/reject/assign) rather than a data-entry-heavy form |
| Inventory data goes stale because manual entry is skipped under pressure | Make the transaction entry form as fast as possible (few fields, smart defaults); accept that under extreme chaos some entries will lag, and design the ledger to tolerate late/back-dated entries rather than assuming real-time accuracy always |
| Feature creep from well-meaning stakeholders during planning | This document's explicit MUST/SHOULD/NICE/DO-NOT-BUILD lists (Section 9) are the standing answer to scope requests |

## 32. Deployment Plan

- **Flutter app:** deployed via direct APK distribution initially (fastest path for a targeted pilot with a specific responder team/org), with Play Store submission once stable — Play Store review time is a real constraint before a disaster, so APK sideloading to a known trained group is the realistic first channel.
- **Next.js dashboard:** deployed to Vercel (free/hobby tier is sufficient for MVP traffic), connected to the same Supabase project.
- **Supabase:** a single project for MVP (no separate staging environment initially, given solo-dev constraints — accepted risk, mitigated by testing schema changes locally with the Supabase CLI before applying to the live project).
- **Environments:** local development against a local Supabase instance (via Supabase CLI) before pushing schema changes live; this is the one process discipline worth insisting on despite being a solo project, since a bad migration against live disaster data would be a serious failure.

## 33. Testing Strategy

Kept realistic for a solo developer — not an enterprise QA plan.

- **Manual role-based testing:** before any release, walk through the full emergency workflow (Section 11) and resource workflow (Section 13) end-to-end as each role, using real (test) accounts per role — this catches RLS and state-machine bugs better than unit tests alone at this stage.
- **RLS policy testing:** for each table, verify explicitly that a user in the "wrong" role cannot read/write rows they shouldn't — this is the highest-value testing given RLS is the actual security boundary.
- **Offline/reconnect testing:** manually test airplane-mode submission and reconnect-sync on a real device, not just an emulator, since real network flakiness behaves differently.
- **Automated tests (as time allows, not blocking MVP):** unit tests for the state-transition logic (valid/invalid status changes) and for inventory quantity derivation calculations, since these are the two places a silent bug would cause real-world harm (wrong stock numbers, invalid status jumps).
- No claim of full automated test coverage in MVP — explicitly deferred, documented here so it's a conscious tradeoff, not an oversight.

## 34. Phase 0 — Foundation

- Set up Supabase project, local dev environment via Supabase CLI
- Create lookup tables and seed initial data: disaster_types, severity_levels, resource_types
- Implement `profiles` table + phone OTP auth flow, minimal role assignment (manually set via admin for the first few accounts)
- Set up Next.js project skeleton with Supabase client, basic auth-gated routing
- Set up Flutter project skeleton with Supabase client, basic auth-gated routing
- Decide and document: PostGIS vs plain lat/lng (recommendation: plain lat/lng for Phase 0/1)
- Enable RLS on every table from the very first migration, even before all policies are written (deny-all default)

## 35. Phase 1 — Shippable MVP

- Citizen: emergency request creation (form + map picker + single photo upload)
- Coordinator dashboard: live emergency list + map, verify/reject/assign actions, realtime updates
- Responder: assignment list, accept/reject, status updates (ON_WAY/ON_TASK/AVAILABLE), self availability toggle
- Inventory: resource_types + stock_locations management (admin), transaction entry form (RECEIVED/RESERVED/DISPATCHED/DISTRIBUTED), derived stock view
- Resource requests: create/approve/reserve/dispatch/receive flow, linked optionally to an emergency
- Low-stock detection view/alert on the inventory dashboard
- Activity log: auto-populated via triggers for all state changes above, viewable by coordinators/admins
- Basic map: MapLibre + OSM showing emergency and responder pins, no routing
- Basic offline handling: outbox queue for emergency request creation and status updates, pending/synced UI states, network status indicator

**This phase is the actual product launch.** Everything in it maps directly to the MUST HAVE list in Section 9.

## 36. Phase 2 — Improvements

- Shelters as first-class entities, linked into resource requests and emergency requests
- Push notifications (FCM) layered on top of existing realtime events
- Duplicate-report detection heuristic (proximity + time window) surfaced as a coordinator suggestion, not an auto-action
- Additional inventory transaction types in the UI: RETURNED, DAMAGED, ADJUSTED, with required notes
- Deeper offline support: broader action queueing (assignment status changes, inventory entries) beyond just emergency requests
- Responder skill/equipment-based assignment suggestions (still human-confirmed, never automatic)
- CSV export of activity log and inventory ledger for after-action reports
- Bilingual (Nepali/English) UI labels throughout

## 37. Phase 3 — Scale

- Multi-organization/multi-district support if the system is adopted beyond a single pilot org
- SMS-based reporting fallback (requires securing an SMS gateway budget/provider — a business decision, not just engineering)
- Routing/ETA via a self-hosted routing engine (OSRM/Valhalla) if usage genuinely demands it
- Public read-only transparency dashboard (approximate, privacy-safe emergency status view)
- Formal automated test suite expansion, staging environment separate from production Supabase project
- Revisit whether a dedicated Shelter Manager role (distinct permissions from Coordinator) is actually needed, based on real usage patterns

## 38. Final Definition of Done

**Phase 1 (MVP) is "done" when:**
1. A citizen can, on a real Android phone, submit an emergency request with location, type, severity, description, and a photo, and it appears on the coordinator dashboard within a few seconds via Realtime.
2. A coordinator can verify or reject that request, and assign a responder, all reflected live.
3. A responder can see the assignment, accept or reject it, and update their status through to completion, and the emergency's status reflects this correctly.
4. An inventory manager can record stock received, see accurate derived current/available quantities, and the numbers are never manually overwritten — only ever the result of ledger transactions.
5. A resource request can be created, approved, reserved, dispatched, and marked received, correctly affecting the inventory ledger at each step, including a partial-fulfillment case.
6. A low-stock resource correctly triggers a visible warning on the inventory dashboard.
7. Every one of the above actions produces a correct, human-readable entry in the activity log with correct actor/entity/timestamp.
8. A basic map correctly shows emergency and responder pins with severity/status color-coding.
9. Submitting an emergency request or a status update while offline queues locally, clearly shows a pending state, and successfully syncs when connectivity returns — without duplicating the record.
10. RLS has been manually verified for every table: a user in the wrong role cannot read or write data they shouldn't be able to.
11. The app clearly and honestly communicates, in its own UI copy, that it is a coordination tool and not a replacement for official emergency services.

If all eleven conditions hold on a real device against the live Supabase project, Phase 1 is shippable.