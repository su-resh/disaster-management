'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import * as maplibregl from 'maplibre-gl/dist/maplibre-gl.mjs';
import 'maplibre-gl/dist/maplibre-gl.css';

// We'll use our own formatRelativeTime function to avoid adding dependencies.
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hr ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day ago`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month ago`;
  }
  return `${Math.floor(diffInMonths / 12)} year ago`;
}

// Severity color mapping (if we don't have color_hint from the database)
const severityColorMap: Record<string, string> = {
  critical: '#FF0000', // Red
  high: '#FF8C00',   // Dark Orange
  medium: '#FFFF00', // Yellow
  low: '#00FF00',    // Green
};

type EmergencyRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  emergency_type: string;
  severity_id: number;
  severity_levels: {
    name: string;
    color_hint: string | null;
  };
  disaster_types: {
    name: string;
  };
  people_count: number;
  injured_count: number;
  description: string;
  location_text: string;
  contact_phone: string;
  special_needs: string | null;
  photo_url: string | null;
  rejected_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function EmergenciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [severityLevels, setSeverityLevels] = useState<Array<{id: number, name: string, color_hint: string | null}>>([]);
  const [filters, setFilters] = useState<{
    status: string[];
    severity: string[];
  }>({
    status: [],
    severity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  // Refs for map and markers
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const channelRef = useRef<any>(null);

  // Filters ref for use in realtime callback
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Fetch severity levels
  useEffect(() => {
    const fetchSeverityLevels = async () => {
      try {
        const { data, error } = await supabase
          .from('severity_levels')
          .select('id, name, color_hint');

        if (error) throw error;
        setSeverityLevels(data);
      } catch (err) {
        console.error('Error fetching severity levels:', err);
        setError('Failed to load severity levels');
      }
    };

    fetchSeverityLevels();
  }, [supabase]);

  // Fetch emergencies with filters
  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build the query
      let query = supabase
        .from('emergency_requests')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          emergency_type,
          severity_id,
          severity_levels!inner(name, color_hint),
          disaster_types!inner(name),
          people_count,
          injured_count,
          description,
          location_text,
          contact_phone,
          special_needs,
          photo_url,
          rejected_reason,
          verified_by,
          verified_at,
          latitude,
          longitude
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.severity.length > 0) {
        // We'll filter by severity name after fetching for simplicity
        // We'll do it in the client-side filtering below
      }

      let { data, error } = await query;

      if (error) throw error;

      // Apply filters
      let filtered = data;
      if (filters.status.length > 0) {
        filtered = filtered.filter(e => filters.status.includes(e.status));
      }
      if (filters.severity.length > 0) {
        filtered = filtered.filter(e => 
          e.severity_levels && filters.severity.includes(e.severity_levels.name)
        );
      }

      setEmergencies(filtered);
    } catch (err) {
      console.error('Error fetching emergencies:', err);
      setError('Failed to load emergencies');
    } finally {
      setLoading(false);
    }
  }, [filters, supabase]);

  // Fetch emergencies on mount and when filters change
  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('emergency_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergency_requests' },
        (payload) => {
          // Refetch the list with current filters
          fetchEmergencies();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'emergency_requests' },
        (payload) => {
          // Refetch the list with current filters
          fetchEmergencies();
        }
      )
      .subscribe((status) => {
        // RealtimeClient in supabase-js v2 does not expose .on('open'|'close')
        // connection listeners; track connectivity through the channel's
        // subscription status instead.
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('reconnecting');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, fetchEmergencies]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [0, 0],
        zoom: 1,
      });

      mapInstanceRef.current = map;

      return () => {
        map.remove();
      };
    }
  }, []);

  // Update map markers when emergencies change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapContainerRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter for non-terminal statuses
    const nonTerminalStatuses = ['NEW', 'VERIFIED', 'ASSIGNED', 'RESPONDER_ON_WAY', 'RESCUING'];
    const nonTerminalEmergencies = emergencies.filter(e => 
      nonTerminalStatuses.includes(e.status) && 
      e.latitude !== null && 
      e.longitude !== null &&
      e.latitude !== 0 && 
      e.longitude !== 0
    );

    if (nonTerminalEmergencies.length === 0) {
      // If no emergencies to show, reset map to default view
      map.jumpTo({ center: [0, 0], zoom: 1 });
      return;
    }

    // Create markers and add to map
    const bounds = new maplibregl.LngLatBounds();
    nonTerminalEmergencies.forEach(emergency => {
      const el = document.createElement('div');
      el.style.backgroundColor = getSeverityColor(emergency.severity_levels?.name);
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([emergency.longitude!, emergency.latitude!])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }) // add popups
            .setHTML(
              `<h3>${emergency.disaster_types.name}</h3><p>${emergency.location_text}</p>`
            )
        )
        .addTo(map);

      // Click on marker to navigate to detail page
      el.addEventListener('click', () => {
        router.push(`/dashboard/emergencies/${emergency.id}`);
      });

      markersRef.current.push(marker);
      bounds.extend([emergency.longitude!, emergency.latitude!]);
    });

    // Fit map to markers
    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 0,
    });
  }, [emergencies, router]);

  // Fetch emergencies on mount and when filters change
  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  // Get the severity color for a severity name
  const getSeverityColor = (severityName: string | null): string => {
    if (!severityName) return '#6B7280'; // gray
    // First, try to find in severityLevels
    const found = severityLevels.find(s => s.name === severityName);
    if (found && found.color_hint) {
      return found.color_hint;
    }
    // Fallback to the map
    return severityColorMap[severityName.toLowerCase()] || '#6B7280';
  };

  // Get the status badge color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'new':
        return '#3B82F6'; // blue
      case 'verified':
        return '#10B981'; // green
      case 'rejected':
        return '#EF4444'; // red
      case 'assigned':
        return '#F59E0B'; // amber
      case 'responder_on_way':
        return '#F97316'; // orange
      case 'rescuing':
        return '#F97316'; // orange
      case 'rescued':
        return '#10B981'; // green
      case 'cancelled':
        return '#6B7280'; // gray
      default:
        return '#6B7280'; // gray
    }
  };

  // Format the date to relative time
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return formatRelativeTime(date);
  };

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
      // We are using multiple select, so we need to update the array
      // We'll assume that the select is multiple and we are getting an array of values.
      // We'll check if it's an array.
      if (Array.isArray(value)) {
        return { ...prev, [name]: value };
      } else {
        // If it's a single value, we'll treat it as an array with one element.
        return { ...prev, [name]: [value] };
      }
    });
  };

  // We'll create a function to handle the row click to navigate to the detail page
  const handleRowClick = (id: string) => {
    router.push(`/dashboard/emergencies/${id}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-6 lg:h-[calc(100vh-7rem)] lg:flex-row">
        {/* Sidebar - we can put filters here */}
        <aside className="lg:w-64 lg:shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Filters</h2>
            {/* Status filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                multiple
                size={4}
                className="focus-brand block w-full rounded-lg border border-gray-300 bg-white py-1 text-sm text-gray-900"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="NEW">NEW</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="RESPONDER_ON_WAY">RESPONDER_ON_WAY</option>
                <option value="RESCUING">RESCUING</option>
                <option value="RESCUED">RESCUED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            {/* Severity filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Severity</label>
              <select
                multiple
                size={4}
                className="focus-brand block w-full rounded-lg border border-gray-300 bg-white py-1 text-sm text-gray-900"
                name="severity"
                value={filters.severity}
                onChange={handleFilterChange}
              >
                {severityLevels.map(level => (
                  <option key={level.id} value={level.name}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Apply button - we are applying on change, so we don't need a button */}
            {/* We can add a button to apply if we want to debounce */}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex h-full flex-col lg:flex-row">
            {/* List of emergencies */}
            <div className="lg:w-1/2 lg:pr-4">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                  Active Emergencies
                </h1>
                {/* Live indicator */}
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm ring-1 ring-gray-200">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        connectionStatus === 'connected' ? '#10B981' :
                        connectionStatus === 'reconnecting' ? '#F59E0B' :
                        '#EF4444',
                    }}
                  ></span>
                  <span className="text-gray-600">
                    {connectionStatus === 'connected' ? 'Live' :
                     connectionStatus === 'reconnecting' ? 'Reconnecting…' :
                     'Disconnected'}
                  </span>
                </div>
              </div>

              {emergencies.length === 0 ? (
                <p className="py-12 text-center text-gray-500">
                  No emergencies match the current filters.
                </p>
              ) : (
                <div className="space-y-3">
                  {emergencies.map(emergency => (
                    <div
                      key={emergency.id}
                      className="cursor-pointer rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200"
                      onClick={() => handleRowClick(emergency.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ring-white"
                              style={{ backgroundColor: getSeverityColor(emergency.severity_levels?.name) }}
                            ></span>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {emergency.disaster_types.name}
                              </h3>
                              <p className="text-sm text-gray-500">{emergency.emergency_type}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: getStatusColor(emergency.status) }}
                          >
                            {emergency.status}
                          </span>
                          <span className="tabular-nums text-xs text-gray-400">
                            {formatDate(emergency.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">{emergency.location_text}</div>
                      <div className="tabular-nums mt-1 text-sm text-gray-500">
                        {emergency.people_count} people affected
                        {emergency.injured_count > 0 ? `, ${emergency.injured_count} injured` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            <div className="mt-5 lg:mt-0 lg:w-1/2 lg:pl-4">
              <div
                ref={mapContainerRef}
                className="h-80 w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 lg:h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}