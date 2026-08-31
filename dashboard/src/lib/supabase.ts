import { createServerClient as createSupaServerClient, createBrowserClient, isBrowser } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cookie methods compatible with Next.js
// getAll: returns array of { name, value } cookies
// setAll: sets multiple cookies at once
const cookieMethods = {
  getAll: (): { name: string; value: string }[] => {
    // In a real App Server Component or middleware, this would use
    // next/headers or the request object to get cookies
    // For now, return empty array - the actual implementation
    // depends on the framework context
    return []
  },
  setAll: (cookies: { name: string; value: string }[]): void => {
    // In a real App Server Component or middleware, this would use
    // next/headers or the response object to set cookies
    // For now, this is a no-op
  },
}

export const createServerClient = () => {
  return createSupaServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  })
}

export const createClient = () => {
  if (isBrowser()) {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  // Fallback to server client
  return createServerClient()
}