'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient } from '@/lib/supabase';

const TRANSACTION_TYPES = ['RECEIVED', 'DISPATCHED', 'DISTRIBUTED', 'RETURNED', 'DAMAGED', 'ADJUSTED'] as const;
type TransactionType = (typeof TRANSACTION_TYPES)[number];

type ResourceType = {
  id: number;
  name: string;
  unit: string | null;
  default_minimum_stock: number | null;
};

type StockLocation = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
};

type StockRow = {
  resource_type_id: number;
  location_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  dispatched_stock: number;
};

type ResourceRequest = {
  id: string;
  resource_type_id: number;
  destination_location_id: string | null;
  requested_quantity: number;
  fulfilled_quantity: number;
  urgency: string;
  status: string;
  rejected_reason: string | null;
  created_at: string;
  resource_types: { name: string; unit: string | null }[] | null;
  profiles: { full_name: string | null }[] | null;
  stock_locations: { name: string }[] | null;
};

type LedgerRow = {
  id: string;
  transaction_type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  resource_types: { name: string; unit: string | null }[] | null;
  stock_locations_source: { name: string }[] | null;
  stock_locations_destination: { name: string }[] | null;
};

type EmergencyOption = { id: string; emergency_type: string | null; location_text: string | null };

// Which location fields each transaction type needs (DAMAGED needs source, etc.)
function needsSource(t: TransactionType): boolean {
  return t === 'DISPATCHED' || t === 'DISTRIBUTED' || t === 'DAMAGED' || t === 'ADJUSTED';
}
function needsDestination(t: TransactionType): boolean {
  return t === 'RECEIVED' || t === 'DISPATCHED' || t === 'DISTRIBUTED' || t === 'RETURNED' || t === 'ADJUSTED';
}
function needsNotes(t: TransactionType): boolean {
  return t === 'DAMAGED' || t === 'ADJUSTED';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'REQUESTED': return '#F59E0B';
    case 'APPROVED': return '#3B82F6';
    case 'RESERVED': return '#8B5CF6';
    case 'DISPATCHED': return '#F97316';
    case 'RECEIVED': return '#10B981';
    case 'COMPLETED': return '#059669';
    case 'REJECTED': return '#EF4444';
    case 'CANCELLED': return '#6B7280';
    default: return '#6B7280';
  }
}
export default function InventoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyOption[]>([]);

  // transaction entry form state
  const [txnType, setTxnType] = useState<TransactionType>('RECEIVED');
  const [txnResource, setTxnResource] = useState('');
  const [txnQuantity, setTxnQuantity] = useState('');
  const [txnSource, setTxnSource] = useState('');
  const [txnDest, setTxnDest] = useState('');
  const [txnEmergency, setTxnEmergency] = useState('');
  const [txnNotes, setTxnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // request queue state
  const [reserveSource, setReserveSource] = useState('');
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, string>>({});
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const canWrite = role === 'inventory_manager' || role === 'admin';

  const fetchAll = async () => {
    const [typesRes, locRes, stockRes, reqRes, ledgerRes, emRes] = await Promise.all([
      supabase.from('resource_types').select('id, name, unit, default_minimum_stock').eq('is_active', true).order('name'),
      supabase.from('stock_locations').select('id, name, type, is_active').order('name'),
      supabase.from('stock_summary').select('*').order('resource_type_id'),
      supabase
        .from('resource_requests')
        .select(`id, resource_type_id, destination_location_id, requested_quantity, fulfilled_quantity,
          urgency, status, rejected_reason, created_at,
          resource_types(name, unit), profiles(full_name), stock_locations(name)`)
        .in('status', ['REQUESTED', 'APPROVED', 'RESERVED', 'DISPATCHED', 'RECEIVED'])
        .order('created_at', { ascending: false }),
      supabase
        .from('inventory_transactions')
        .select(`id, transaction_type, quantity, notes, created_at,
          resource_types(name, unit),
          stock_locations_source:stock_locations!inventory_transactions_source_location_id_fkey(name),
          stock_locations_destination:stock_locations!inventory_transactions_destination_location_id_fkey(name)`)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('emergency_requests')
        .select('id, emergency_type, location_text')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (typesRes.error) throw typesRes.error;
    if (locRes.error) throw locRes.error;
    if (stockRes.error) throw stockRes.error;
    if (reqRes.error) throw reqRes.error;
    if (ledgerRes.error) throw ledgerRes.error;
    if (emRes.error) throw emRes.error;

    setResourceTypes(typesRes.data || []);
    setLocations(locRes.data || []);
    setStock(stockRes.data || []);
    setRequests(reqRes.data || []);
    setLedger(ledgerRes.data || []);
    setEmergencies(emRes.data || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
        const { data: profile } = await supabase.from('profiles').select('role').single();
        setRole(profile?.role ?? null);
        await fetchAll();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime (plan.md §16): ledger changes + request status changes refresh live
  useEffect(() => {
    const channel = supabase
      .channel('inventory-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, () => {
        fetchAll().catch(console.error);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_requests' }, () => {
        fetchAll().catch(console.error);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // default the reserve/dispatch source location to the first active warehouse
  useEffect(() => {
    if (!reserveSource && locations.length > 0) {
      const warehouse = locations.find(l => l.is_active && l.type === 'warehouse') || locations[0];
      setReserveSource(warehouse.id);
    }
  }, [locations, reserveSource]);

  const typeName = (id: number) => resourceTypes.find(r => r.id === id)?.name ?? `Type ${id}`;
  const locationName = (id: string) => locations.find(l => l.id === id)?.name ?? 'Unknown';


  const handleInsertTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const qty = Number(txnQuantity);
    if (!txnResource) return setError('Pick a resource type.');
    if (!qty || qty <= 0) return setError('Quantity must be greater than 0.');
    if (needsSource(txnType) && !txnSource) return setError(`${txnType} requires a source location.`);
    if (needsDestination(txnType) && !txnDest) return setError(`${txnType} requires a destination location.`);
    if (needsNotes(txnType) && !txnNotes.trim()) return setError(`${txnType} requires notes.`);

    setSubmitting(true);
    try {
      const { error: insErr } = await supabase.from('inventory_transactions').insert({
        resource_type_id: Number(txnResource),
        transaction_type: txnType,
        quantity: qty,
        source_location_id: needsSource(txnType) ? txnSource : null,
        destination_location_id: needsDestination(txnType) ? txnDest : null,
        related_emergency_request_id: txnEmergency || null,
        performed_by: userId,
        notes: txnNotes.trim() || null,
      });
      if (insErr) throw insErr;
      setMessage(`${txnType} transaction recorded.`);
      setTxnQuantity('');
      setTxnNotes('');
      setTxnEmergency('');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRequest = async (id: string, patch: Record<string, unknown>) => {
    const { error: upErr } = await supabase.from('resource_requests').update(patch).eq('id', id);
    if (upErr) throw upErr;
    await fetchAll();
  };

  const insertLedgerRow = async (row: Record<string, unknown>) => {
    const { error: insErr } = await supabase.from('inventory_transactions').insert(row);
    if (insErr) throw insErr;
  };

  const runAction = async (id: string, fn: () => Promise<void>) => {
    setBusyRequestId(id);
    setError(null);
    setMessage(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyRequestId(null);
    }
  };

  // REQUESTED -> APPROVED
  const approve = (r: ResourceRequest) =>
    runAction(r.id, () => updateRequest(r.id, { status: 'APPROVED', approved_by: userId }));

  // REQUESTED -> REJECTED
  const reject = (r: ResourceRequest) => {
    const reason = window.prompt('Rejection reason (insufficient stock, duplicate, not prioritized):');
    if (!reason) return;
    return runAction(r.id, () => updateRequest(r.id, { status: 'REJECTED', rejected_reason: reason }));
  };

  // APPROVED -> RESERVED (race-safe Postgres function: re-checks available stock, atomic)
  const reserve = (r: ResourceRequest) =>
    runAction(r.id, async () => {
      const qty =
        qtyOverrides[r.id] !== undefined && qtyOverrides[r.id] !== ''
          ? Number(qtyOverrides[r.id])
          : r.requested_quantity;
      const { error: rpcErr } = await supabase.rpc('reserve_stock_for_request', {
        p_request_id: r.id,
        p_source_location_id: reserveSource,
        p_fulfilled_quantity: qty,
      });
      if (rpcErr) throw rpcErr;
      setMessage('Stock reserved.');
    });

  // RESERVED -> DISPATCHED (inserts the DISPATCHED ledger row, then flips status)
  const dispatch = (r: ResourceRequest) =>
    runAction(r.id, async () => {
      if (!r.destination_location_id) {
        throw new Error('This request has no destination location, so goods cannot be dispatched.');
      }
      const qty = r.fulfilled_quantity > 0 ? r.fulfilled_quantity : r.requested_quantity;
      await insertLedgerRow({
        resource_type_id: r.resource_type_id,
        transaction_type: 'DISPATCHED',
        quantity: qty,
        source_location_id: reserveSource,
        destination_location_id: r.destination_location_id,
        related_resource_request_id: r.id,
        performed_by: userId,
        notes: 'Dispatched for resource request',
      });
      await updateRequest(r.id, { status: 'DISPATCHED' });
      setMessage('Dispatched.');
    });

  // DISPATCHED -> RECEIVED (DISTRIBUTED row: source offsets in-transit, destination adds stock)
  const markReceived = (r: ResourceRequest) =>
    runAction(r.id, async () => {
      if (!r.destination_location_id) {
        throw new Error('This request has no destination location to receive goods into.');
      }
      const qty = r.fulfilled_quantity > 0 ? r.fulfilled_quantity : r.requested_quantity;
      await insertLedgerRow({
        resource_type_id: r.resource_type_id,
        transaction_type: 'DISTRIBUTED',
        quantity: qty,
        source_location_id: reserveSource,
        destination_location_id: r.destination_location_id,
        related_resource_request_id: r.id,
        performed_by: userId,
        notes: 'Receipt confirmed for resource request',
      });
      await updateRequest(r.id, { status: 'RECEIVED' });
      setMessage('Receipt recorded.');
    });

  // RECEIVED -> COMPLETED
  const complete = (r: ResourceRequest) =>
    runAction(r.id, () => updateRequest(r.id, { status: 'COMPLETED' }));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }


  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">
          Stock is always derived from the transaction ledger — never edited directly
          {!canWrite && ' (read-only view for coordinators)'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      )}

      {/* Stock overview */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Stock Overview</h2>
          <p className="mt-1 text-xs text-gray-400">
            Low-stock rows compare <strong>available_stock</strong> (what can actually be committed right now —
            unlike current_stock, which includes units already promised to reserved requests) against the
            resource type&apos;s minimum threshold.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Resource', 'Location', 'Current', 'Reserved', 'Available', 'In Transit', 'Min. Stock'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {stock.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">
                    No stock recorded yet — record a RECEIVED transaction below.
                  </td>
                </tr>
              )}
              {stock.map(row => {
                const min = resourceTypes.find(r => r.id === row.resource_type_id)?.default_minimum_stock ?? null;
                const low = min !== null && row.available_stock < min;
                return (
                  <tr key={`${row.resource_type_id}-${row.location_id}`} className={low ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{typeName(row.resource_type_id)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{locationName(row.location_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.current_stock}</td>
                    <td className="px-4 py-3 text-sm text-violet-600">{row.reserved_stock}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${low ? 'text-amber-700' : 'text-emerald-600'}`}>{row.available_stock}</td>
                    <td className="px-4 py-3 text-sm text-orange-500">{row.dispatched_stock}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {min ?? '—'}
                      {low && (
                        <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">LOW</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {canWrite && (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Transaction entry form */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Record Transaction</h2>
            <form onSubmit={handleInsertTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Transaction type</span>
                  <select
                    value={txnType}
                    onChange={e => {
                      setTxnType(e.target.value as TransactionType);
                      setTxnSource('');
                      setTxnDest('');
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand"
                  >
                    {TRANSACTION_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Resource type</span>
                  <select value={txnResource} onChange={e => setTxnResource(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                    <option value="">Select…</option>
                    {resourceTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name}{rt.unit ? ` (${rt.unit})` : ''}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Quantity</span>
                <input type="number" min="0" step="any" value={txnQuantity} onChange={e => setTxnQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand" />
              </label>
              {needsSource(txnType) && (
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">
                    Source location{txnType === 'DAMAGED' ? ' (required)' : ''}
                  </span>
                  <select value={txnSource} onChange={e => setTxnSource(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                    <option value="">Select…</option>
                    {locations.filter(l => l.is_active).map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                    ))}
                  </select>
                </label>
              )}
              {needsDestination(txnType) && (
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Destination location</span>
                  <select value={txnDest} onChange={e => setTxnDest(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                    <option value="">Select…</option>
                    {locations.filter(l => l.is_active).map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Link to emergency (optional)</span>
                <select value={txnEmergency} onChange={e => setTxnEmergency(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                  <option value="">None</option>
                  {emergencies.map(em => (
                    <option key={em.id} value={em.id}>
                      {em.emergency_type || 'Emergency'} — {em.location_text || em.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  Notes{needsNotes(txnType) ? ' (required for DAMAGED/ADJUSTED)' : ' (optional)'}
                </span>
                <textarea value={txnNotes} onChange={e => setTxnNotes(e.target.value)} rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand" />
              </label>
              <button type="submit" disabled={submitting}
                className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 focus-brand">
                {submitting ? 'Recording…' : `Record ${txnType}`}
              </button>
            </form>
          </div>



          {/* Resource requests queue */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Resource Request Queue</h2>
            <label className="mb-3 block">
              <span className="text-xs font-medium text-gray-600">Source warehouse (for Reserve / Dispatch)</span>
              <select value={reserveSource} onChange={e => setReserveSource(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                {locations.filter(l => l.is_active).map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                ))}
              </select>
            </label>
            <div className="space-y-3">
              {requests.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">
                  No open requests. Create one from the Requests page.
                </p>
              )}
              {requests.map(r => (
                <div key={r.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.resource_types?.[0]?.name ?? 'Unknown resource'} — {r.requested_quantity}
                        {r.resource_types?.[0]?.unit ? ` ${r.resource_types[0].unit}` : ''}
                        {r.fulfilled_quantity > 0 && r.fulfilled_quantity !== r.requested_quantity
                          ? ` (fulfilled: ${r.fulfilled_quantity})`
                          : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {r.profiles?.[0]?.full_name || 'Unknown'} ·{' '}
                        {formatDistanceToNowStrict(new Date(r.created_at), { addSuffix: true })}
                        {r.stock_locations?.[0] && ` → ${r.stock_locations[0].name}`}
                      </p>
                    </div>
                    <span
                      className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: getStatusColor(r.status) }}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {['APPROVED', 'RESERVED', 'DISPATCHED'].includes(r.status) && (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={`Qty (default ${r.fulfilled_quantity > 0 ? r.fulfilled_quantity : r.requested_quantity})`}
                        value={qtyOverrides[r.id] ?? ''}
                        onChange={e => setQtyOverrides({ ...qtyOverrides, [r.id]: e.target.value })}
                        className="w-44 rounded-lg border border-gray-300 px-2 py-1 text-xs focus-brand"
                      />
                    )}

                    {r.status === 'REQUESTED' && (
                      <>
                        <button onClick={() => approve(r)} disabled={busyRequestId === r.id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                          Approve
                        </button>
                        <button onClick={() => reject(r)} disabled={busyRequestId === r.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'APPROVED' && (
                      <button onClick={() => reserve(r)} disabled={busyRequestId === r.id}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                        Reserve
                      </button>
                    )}
                    {r.status === 'RESERVED' && (
                      <button onClick={() => dispatch(r)} disabled={busyRequestId === r.id}
                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
                        Dispatch
                      </button>
                    )}
                    {r.status === 'DISPATCHED' && (
                      <button onClick={() => markReceived(r)} disabled={busyRequestId === r.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        Mark Received
                      </button>
                    )}
                    {r.status === 'RECEIVED' && (
                      <button onClick={() => complete(r)} disabled={busyRequestId === r.id}
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                        Complete
                      </button>
                    )}
                    {r.rejected_reason && (
                      <span className="text-xs text-red-500">Reason: {r.rejected_reason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Recent ledger */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Recent Ledger Entries</h2>
          <p className="mt-1 text-xs text-gray-400">Append-only — corrections are new offsetting rows, never edits.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Time', 'Type', 'Resource', 'Qty', 'From', 'To', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {ledger.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {formatDistanceToNowStrict(new Date(row.created_at), { addSuffix: true })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-800">{row.transaction_type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.resource_types?.[0]?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.stock_locations_source?.[0]?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{row.stock_locations_destination?.[0]?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.notes ?? '—'}</td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
