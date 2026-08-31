'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<{ 
    full_name: string | null; 
    phone: string | null; 
    role: string | null 
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser(profile)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent h-12 w-12"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent h-12 w-12"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Disaster Response Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Logged in as {user.full_name || user.phone}, role: {user.role}
          </p>
        </div>
      </div>
    </div>
  )
}