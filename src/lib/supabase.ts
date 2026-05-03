import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export const trackEvent = (event: string, metadata?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    ;(window as any).gtag?.('event', event, metadata)
    console.log('[Analytics]', event, metadata)
  }
}

