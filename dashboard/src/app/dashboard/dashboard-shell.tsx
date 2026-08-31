'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function ShieldMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
      <path d="M9.5 12.5l1.8 1.8 3.4-3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setRole(profile.role);
          // Only allow coordinator, inventory_manager and admin
          if (!['coordinator', 'inventory_manager', 'admin'].includes(profile.role)) {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkRole();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setRole(profile.role);
        if (!['coordinator', 'inventory_manager', 'admin'].includes(profile.role)) {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
              <ShieldMark className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-semibold text-gray-900">Rescue Operations</span>
              <span className="block text-xs text-gray-500">Coordinator Dashboard</span>
            </div>
          </div>

          <nav className="flex items-center gap-1" aria-label="Dashboard navigation">
            <Link
              href="/dashboard/emergencies"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith('/dashboard/emergencies')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Emergencies
            </Link>
            <Link
              href="/dashboard/responders"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith('/dashboard/responders')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Responders
            </Link>
            <Link
              href="/dashboard/requests"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith('/dashboard/requests')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Requests
            </Link>
            <Link
              href="/dashboard/inventory"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith('/dashboard/inventory')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Inventory
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {role && (
              <span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 capitalize sm:inline">
                {role}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-brand"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}