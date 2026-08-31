'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { formatRelative } from 'date-fns';

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
  profiles: {
    full_name: string | null;
    phone: string | null;
  } | null;
};

export default function EmergencyDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const supabase = useMemo(() => createClient(), []);

  const [emergency, setEmergency] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<'spam' | 'duplicate' | 'unable_to_verify' | 'false_report' | 'other'>('spam');
  const [otherReason, setOtherReason] = useState('');
  const [cancelReason, setCancelReason] = useState<'spam' | 'duplicate' | 'unable_to_verify' | 'false_report' | 'other'>('spam');
  const [otherCancelReason, setOtherCancelReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responders, setResponders] = useState<Array<{
    id: string;
    status: string;
    skills: string[] | null;
    vehicle_type: string | null;
    profiles: { full_name: string | null; phone: string | null };
  }>>([]);
  const [selectedResponderId, setSelectedResponderId] = useState<string | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<{
    id: string;
    responder_id: string;
    status: string;
    profiles: { full_name: string | null; phone: string | null };
  } | null>(null);

  // Fetch the emergency by id
  useEffect(() => {
    const fetchEmergency = async () => {
      if (!id) {
        setError('Invalid emergency ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
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
            longitude,
            profiles!emergency_requests_created_by_fkey(full_name, phone)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setEmergency(data as unknown as EmergencyRequest);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('Error fetching emergency:', errorMessage);
        setError('Failed to load emergency details');
      } finally {
        setLoading(false);
      }
    };

    fetchEmergency();
  }, [id]);

  // Verify the emergency (implementation lives below, after the helper functions)

  // We'll refetch the emergency when the verify/reject/cancel actions are done by using the fetchEmergency function again.
  // We'll create a helper function to refetch.
  const refetchEmergency = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
          longitude,
          profiles!emergency_requests_created_by_fkey(full_name, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEmergency(data as unknown as EmergencyRequest);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error refetching emergency:', errorMessage);
      setError('Failed to refetch emergency details');
    } finally {
      setLoading(false);
    }
  };

  // We'll update the verify, reject, cancel functions to use refetchEmergency instead of the inline fetch.

  // Let's update the handleVerify function to use refetchEmergency
  // We'll do it in the next step, but for now, we'll leave the inline fetch and then update.

  // We'll update the handleVerify function to use refetchEmergency after the update.

  // We'll update the handleVerify function:

  //   const handleVerify = async () => {
  //     if (!emergency) return;
  //     setIsSubmitting(true);
  //     try {
  //       const { error } = await supabase
  //         .from('emergency_requests')
  //         .update({
  //           status: 'VERIFIED',
  //           verified_by: (await supabase.auth.getSession()).data.session?.user.id,
  //           verified_at: new Date().toISOString(),
  //         })
  //         .eq('id', id);
  //
  //       if (error) throw error;
  //       await refetchEmergency();
  //       alert('Emergency verified successfully');
  //     } catch (err) {
  //       console.error('Error verifying emergency:', err);
  //       alert('Failed to verify emergency');
  //     } finally {
  //       setIsSubmitting(false);
  //     }
  //   };

  // We'll do the same for reject and cancel.

  // Let's update the functions accordingly.

  // We'll update the handleVerify function:
  const handleVerify = async () => {
    if (!emergency) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('emergency_requests')
        .update({
          status: 'VERIFIED',
          verified_by: (await supabase.auth.getSession()).data.session?.user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await refetchEmergency();
      alert('Emergency verified successfully');
    } catch (err) {
      console.error('Error verifying emergency:', err);
      alert('Failed to verify emergency');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the handleRejectSubmit function:
  const handleRejectSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reason = rejectReason === 'other' ? otherReason : rejectReason;
      if (!reason) {
        alert('Please provide a reason for rejection');
        return;
      }
      const { error } = await supabase
        .from('emergency_requests')
        .update({
          status: 'REJECTED',
          rejected_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
      await refetchEmergency();
      setShowRejectForm(false);
      alert('Emergency rejected successfully');
    } catch (err) {
      console.error('Error rejecting emergency:', err);
      alert('Failed to reject emergency');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the handleCancelSubmit function:
  const handleCancelSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reason = cancelReason === 'other' ? otherCancelReason : cancelReason;
      if (!reason) {
        alert('Please provide a reason for cancellation');
        return;
      }
      const { error } = await supabase
        .from('emergency_requests')
        .update({
          status: 'CANCELLED',
          rejected_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
      await refetchEmergency();
      setShowCancelForm(false);
      alert('Emergency cancelled successfully');
    } catch (err) {
      console.error('Error cancelling emergency:', err);
      alert('Failed to cancel emergency');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch available responders
  const fetchResponders = async () => {
    try {
      const { data, error } = await supabase
        .from('responders')
        .select(`
          id,
          status,
          skills,
          vehicle_type,
          profiles(full_name, phone)
        `)
        .eq('status', 'AVAILABLE');

      if (error) throw error;
      setResponders((data || []) as unknown as Array<{
        id: string;
        status: string;
        skills: string[] | null;
        vehicle_type: string | null;
        profiles: { full_name: string | null; phone: string | null };
      }>);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error fetching responders:', errorMessage);
    }
  };

  // Fetch current assignment for this emergency
  const fetchCurrentAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          responder_id,
          status,
          profiles!assignments_responder_id_fkey(full_name, phone)
        `)
        .eq('emergency_request_id', id)
        .in('status', ['ASSIGNED', 'ACCEPTED', 'ON_WAY', 'ON_TASK'])
        .maybeSingle();

      if (error) throw error;
      setCurrentAssignment(data as unknown as {
        id: string;
        responder_id: string;
        status: string;
        profiles: { full_name: string | null; phone: string | null };
      } | null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error fetching current assignment:', errorMessage);
    }
  };

  // Handle assign responder
  const handleAssignResponder = async () => {
    if (!selectedResponderId) return;

    const selectedResponder = responders.find(r => r.id === selectedResponderId);
    if (selectedResponder && selectedResponder.status !== 'AVAILABLE') {
      // Not blocking, just warning
      const confirmed = window.confirm(
        `Warning: This responder is currently ${selectedResponder.status}. Assign anyway?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;

      // Create assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          emergency_request_id: id,
          responder_id: selectedResponderId,
          assigned_by: userId,
          status: 'ASSIGNED',
        });

      if (assignmentError) throw assignmentError;

      // Update emergency status to ASSIGNED
      const { error: emergencyError } = await supabase
        .from('emergency_requests')
        .update({ status: 'ASSIGNED' })
        .eq('id', id);

      if (emergencyError) throw emergencyError;

      setShowAssignForm(false);
      setSelectedResponderId(null);
      await refetchEmergency();
      await fetchCurrentAssignment();
      alert('Responder assigned successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error assigning responder:', errorMessage);
      alert('Failed to assign responder');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load responders and current assignment when assign form opens
  useEffect(() => {
    if (showAssignForm) {
      fetchResponders();
    }
  }, [showAssignForm]);

  // Load current assignment on mount
  useEffect(() => {
    fetchCurrentAssignment();
  }, [id]);

  // Subscribe to assignment changes
  useEffect(() => {
    const channel = supabase
      .channel(`emergency-assignments-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `emergency_request_id=eq.${id}`,
        },
        () => {
          fetchCurrentAssignment();
          refetchEmergency();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Get the severity color for a severity name
  const getSeverityColor = (severityName: string | null): string => {
    if (!severityName) return '#6B7280'; // gray
    // We don't have the severityLevels here, so we'll use the map
    // We could fetch them, but for simplicity, we'll use the map for now.
    const severityColorMap: Record<string, string> = {
      critical: '#FF0000', // Red
      high: '#FF8C00',   // Dark Orange
      medium: '#FFFF00', // Yellow
      low: '#00FF00',    // Green
    };
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

  if (!emergency) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          Emergency not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-6 lg:h-[calc(100vh-7rem)] lg:flex-row">
        {/* Sidebar - summary */}
        <aside className="lg:w-72 lg:shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <Link
              href="/dashboard/emergencies"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
            >
              ← Back to list
            </Link>
            <Link
              href={`/dashboard/requests?emergency=${emergency.id}`}
              className="mb-4 block rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Request Resources
            </Link>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Emergency Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shadow-sm ring-2 ring-white"
                  style={{ backgroundColor: getSeverityColor(emergency.severity_levels?.name) }}
                ></span>
                <span className="text-sm font-medium text-gray-800">
                  {emergency.severity_levels?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: getStatusColor(emergency.status) }}
                >
                  {emergency.status}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Emergency Report</h1>
            <p className="text-sm text-gray-500">ID: {emergency.id}</p>
          </div>

          {/* Photo */}
          {emergency.photo_url && (
            <div className="mb-6">
              <img
                src={emergency.photo_url}
                alt="Emergency photo"
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Basic Information</h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Disaster Type:</span>
                  <span className="text-sm">{emergency.disaster_types.name}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Emergency Type:</span>
                  <span className="text-sm">{emergency.emergency_type}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Severity:</span>
                  <span className="text-sm" style={{ color: getSeverityColor(emergency.severity_levels?.name) }}>
                    {emergency.severity_levels?.name}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">People Affected:</span>
                  <span className="text-sm">{emergency.people_count}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Injured:</span>
                  <span className="text-sm">{emergency.injured_count}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Location</h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Location Description:</span>
                  <span className="text-sm break-all">{emergency.location_text}</span>
                </div>
                {emergency.latitude !== null && emergency.longitude !== null && (
                  <>
                    <div className="flex">
                      <span className="w-32 text-sm font-medium text-gray-500">Latitude:</span>
                      <span className="text-sm">{emergency.latitude}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-sm font-medium text-gray-500">Longitude:</span>
                      <span className="text-sm">{emergency.longitude}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Contact Information</h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Reporter Name:</span>
                  <span className="text-sm">{emergency.profiles?.full_name || emergency.profiles?.phone || 'Unknown'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Reporter Phone:</span>
                  <span className="text-sm">{emergency.profiles?.phone || 'N/A'}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Contact Phone:</span>
                  <span className="text-sm">{emergency.contact_phone}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Description</h2>
              <p className="text-sm text-gray-700">{emergency.description}</p>
            </div>

            {emergency.special_needs && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Special Needs</h2>
                <p className="text-sm text-gray-700">{emergency.special_needs}</p>
              </div>
            )}

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Timestamps</h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Reported At:</span>
                  <span className="text-sm">{formatDate(emergency.created_at)}</span>
                </div>
                {emergency.updated_at !== emergency.created_at && (
                  <div className="flex">
                    <span className="w-32 text-sm font-medium text-gray-500">Updated At:</span>
                    <span className="text-sm">{formatDate(emergency.updated_at)}</span>
                  </div>
                )}
                {emergency.verified_at && (
                  <div className="flex">
                    <span className="w-32 text-sm font-medium text-gray-500">Verified At:</span>
                    <span className="text-sm">{formatDate(emergency.verified_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          {currentAssignment && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blue-200">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Assigned Responder</h2>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Responder:</span>
                  <span className="text-sm font-medium text-gray-800">
                    {currentAssignment.profiles?.full_name || currentAssignment.profiles?.phone || 'Unknown'}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium text-gray-500">Status:</span>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: getStatusColor(currentAssignment.status) }}
                  >
                    {currentAssignment.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleVerify}
                disabled={isSubmitting || emergency.status !== 'NEW'}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying…' : 'Verify'}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting || emergency.status === 'REJECTED' || emergency.status === 'RESCUED' || emergency.status === 'CANCELLED'}
                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 focus-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                onClick={() => setShowCancelForm(true)}
                disabled={isSubmitting || emergency.status === 'REJECTED' || emergency.status === 'RESCUED' || emergency.status === 'CANCELLED'}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 focus-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling…' : 'Cancel'}
              </button>
              <button
                onClick={() => setShowAssignForm(true)}
                disabled={isSubmitting || emergency.status === 'RESCUED' || emergency.status === 'CANCELLED' || emergency.status === 'REJECTED'}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                Assign Responder
              </button>
            </div>
          </div>

          {/* Assign Responder Form */}
          {showAssignForm && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-blue-200">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Assign Responder</h2>
              <div className="space-y-4">
                {responders.length === 0 ? (
                  <p className="text-sm text-gray-500">No available responders found.</p>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Select Responder</label>
                    <select
                      value={selectedResponderId || ''}
                      onChange={(e) => setSelectedResponderId(e.target.value || null)}
                      className="focus-brand block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900"
                    >
                      <option value="">Choose a responder...</option>
                      {responders.map((responder) => (
                        <option key={responder.id} value={responder.id}>
                          {responder.profiles?.full_name || responder.profiles?.phone || 'Unknown'}
                          {responder.skills?.length ? ` — ${responder.skills.join(', ')}` : ''}
                          {responder.vehicle_type ? ` (${responder.vehicle_type})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedResponderId && responders.find(r => r.id === selectedResponderId)?.status !== 'AVAILABLE' && (
                      <p className="text-sm text-amber-600">
                        ⚠️ This responder is currently {responders.find(r => r.id === selectedResponderId)?.status}. You can still assign them.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAssignForm(false);
                      setSelectedResponderId(null);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-brand"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignResponder}
                    disabled={isSubmitting || !selectedResponderId}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-brand disabled:opacity-50"
                  >
                    {isSubmitting ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-200">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Reject Emergency</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <select
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value as 'spam' | 'duplicate' | 'unable_to_verify' | 'false_report' | 'other')}
                    className="focus-brand block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900"
                  >
                    <option value="spam">Spam</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="unable_to_verify">Unable to Verify</option>
                    <option value="false_report">False Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {rejectReason === 'other' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Please specify the reason</label>
                    <input
                      type="text"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      className="focus-brand block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900"
                      placeholder="Enter reason"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-brand"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectSubmit}
                    disabled={isSubmitting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-brand disabled:opacity-50"
                  >
                    {isSubmitting ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Form */}
          {showCancelForm && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-200">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Cancel Emergency</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value as 'spam' | 'duplicate' | 'unable_to_verify' | 'false_report' | 'other')}
                    className="focus-brand block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900"
                  >
                    <option value="spam">Spam</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="unable_to_verify">Unable to Verify</option>
                    <option value="false_report">False Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {cancelReason === 'other' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Please specify the reason</label>
                    <input
                      type="text"
                      value={otherCancelReason}
                      onChange={(e) => setOtherCancelReason(e.target.value)}
                      className="focus-brand block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900"
                      placeholder="Enter reason"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCancelForm(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-brand"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancelSubmit}
                    disabled={isSubmitting}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus-brand disabled:opacity-50"
                  >
                    {isSubmitting ? 'Cancelling…' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}