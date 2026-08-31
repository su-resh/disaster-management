import { createServerComponentClient } from '@supabase/ssr'
import { createBrowserClient, isBrowser } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createServerClient = () => {
  return createServerComponentClient(supabaseUrl, supabaseAnonKey, {
    cookies: () => cookies(),
  })
}

export const createClient = () => {
  if (isBrowser()) {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  // Fallback to server component client if not in browser
  return createServerComponentClient(supabaseUrl, supabaseAnonKey, {
    cookies: () => cookies(),
  })
}