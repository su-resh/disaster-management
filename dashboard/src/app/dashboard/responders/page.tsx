'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

type Responder = {
  id: string;
  status: string;
  skills: string[] | null;
  vehicle_type: string | null;
  base_latitude: number | null;
  base_longitude: number | null;
  last_status_update: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
  };
};

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'available':
      return '#10B981';
    case 'assigned':
      return '#3B82F6';
    case 'on_way':
      return '#F59E0B';
    case 'on_task':
      return '#F97316';
    case 'offline':
      return '#6B7280';
    default:
      return '#6B7280';
  }
}

export default function RespondersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponders = async () => {
    try {
      const { data, error } = await supabase
        .from('responders')
        .select(`
          id,
          status,
          skills,
          vehicle_type,
          base_latitude,
          base_longitude,
          last_status_update,
          profiles(full_name, phone)
        `)
        .order('status', { ascending: true });

      if (error) throw error;
      setResponders((data || []) as unknown as Responder[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error fetching responders:', errorMessage);
      setError('Failed to load responders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponders();

    const channel = supabase
      .channel('responders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responders',
        },
        () => {
          fetchResponders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  const availableCount = responders.filter(r => r.status === 'AVAILABLE').length;
  const busyCount = responders.filter(r => ['ASSIGNED', 'ON_WAY', 'ON_TASK'].includes(r.status)).length;
  const offlineCount = responders.filter(r => r.status === 'OFFLINE').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Responders</h1>
        <p className="text-sm text-gray-500">Live status of all registered responders</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <span className="text-lg">✓</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{availableCount}</p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <span className="text-lg">⚡</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{busyCount}</p>
              <p className="text-xs text-gray-500">On Task</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <span className="text-lg">○</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{offlineCount}</p>
              <p className="text-xs text-gray-500">Offline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Responders Table */}
      {responders.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-gray-500">No responders registered yet.</p>
          <p className="mt-2 text-sm text-gray-400">
            Responders must be added by an admin from the profiles table.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Skills
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {responders.map((responder) => (
                  <tr key={responder.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {responder.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {responder.profiles?.phone}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: getStatusColor(responder.status) }}
                      >
                        {responder.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {responder.skills && responder.skills.length > 0 ? (
                          responder.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">None listed</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {responder.vehicle_type || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {formatTimeAgo(responder.last_status_update)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
