'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { createClient } from '@/lib/supabase';

const URGENCIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

type ResourceType = { id: number; name: string; unit: string | null };
type StockLocation = { id: string; name: string; type: string; is_active: boolean };
type EmergencyOption = { id: string; emergency_type: string | null; location_text: string | null };

type ResourceRequest = {
  id: string;
  requested_quantity: number;
  urgency: string;
  status: string;
  rejected_reason: string | null;
  created_at: string;
  resource_types: { name: string; unit: string | null }[] | null;
  stock_locations: { name: string }[] | null;
};

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

export default function RequestsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyOption[]>([]);
  const [myRequests, setMyRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // form state
  const [resourceId, setResourceId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [emergencyId, setEmergencyId] = useState('');
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    const { data, error: err } = await supabase
      .from('resource_requests')
      .select(`id, requested_quantity, urgency, status, rejected_reason, created_at,
        resource_types(name, unit), stock_locations(name)`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (err) throw err;
    setMyRequests(data || []);
  };

  useEffect(() => {
    const init = async () => {
      try {
        // prefill the linked emergency from ?emergency=<id> (emergency detail view deep link)
        const params = new URLSearchParams(window.location.search);
        const prefill = params.get('emergency') || '';

        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);

        const [typesRes, locRes, emRes] = await Promise.all([
          supabase.from('resource_types').select('id, name, unit').eq('is_active', true).order('name'),
          supabase.from('stock_locations').select('id, name, type, is_active').order('name'),
          supabase.from('emergency_requests').select('id, emergency_type, location_text').order('created_at', { ascending: false }).limit(50),
        ]);
        if (typesRes.error) throw typesRes.error;
        if (locRes.error) throw locRes.error;
        if (emRes.error) throw emRes.error;

        setResourceTypes(typesRes.data || []);
        setLocations(locRes.data || []);
        setEmergencies(emRes.data || []);
        if (prefill) setEmergencyId(prefill);

        await fetchRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: statuses update live as inventory staff process the queue
  useEffect(() => {
    const channel = supabase
      .channel('requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_requests' }, () => {
        fetchRequests().catch(console.error);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const qty = Number(quantity);
    if (!resourceId) return setError('Pick a resource type.');
    if (!qty || qty <= 0) return setError('Quantity must be greater than 0.');

    setSubmitting(true);
    try {
      const { error: insErr } = await supabase.from('resource_requests').insert({
        requested_by: userId,
        resource_type_id: Number(resourceId),
        requested_quantity: qty,
        destination_location_id: destinationId || null,
        related_emergency_request_id: emergencyId || null,
        urgency,
      });
      if (insErr) throw insErr;
      setMessage('Resource request submitted.');
      setQuantity('');
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Request Resources</h1>
        <p className="text-sm text-gray-500">Submit a request for supplies — optionally linked to an emergency</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create form */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Request</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Resource type</span>
              <select value={resourceId} onChange={e => setResourceId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                <option value="">Select…</option>
                {resourceTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}{rt.unit ? ` (${rt.unit})` : ''}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Quantity</span>
                <input type="number" min="0" step="any" value={quantity} onChange={e => setQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand" />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Urgency</span>
                <select value={urgency} onChange={e => setUrgency(e.target.value as (typeof URGENCIES)[number])}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                  {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Deliver to (stock location, optional)</span>
              <select value={destinationId} onChange={e => setDestinationId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                <option value="">No specific location</option>
                {locations.filter(l => l.is_active).map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-600">Related emergency (optional)</span>
              <select value={emergencyId} onChange={e => setEmergencyId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-brand">
                <option value="">None</option>
                {emergencies.map(em => (
                  <option key={em.id} value={em.id}>
                    {em.emergency_type || 'Emergency'} — {em.location_text || em.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 focus-brand">
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </form>
        </div>


        {/* My requests */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent Requests</h2>
          <div className="space-y-3">
            {myRequests.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">No requests yet.</p>
            )}
            {myRequests.map(r => (
              <div key={r.id} className="flex items-start justify-between gap-2 rounded-xl border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.resource_types?.[0]?.name ?? 'Unknown resource'} — {r.requested_quantity}
                    {r.resource_types?.[0]?.unit ? ` ${r.resource_types[0].unit}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.urgency} · {formatDistanceToNowStrict(new Date(r.created_at), { addSuffix: true })}
                    {r.stock_locations?.[0] && ` → ${r.stock_locations[0].name}`}
                    {r.rejected_reason && ` · ${r.rejected_reason}`}
                  </p>
                </div>
                <span
                  className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: getStatusColor(r.status) }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

