import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// v19.0 RPC: Contact reveal (48hr)
export async function revealContact(listingId: string) {
  const { data, error } = await supabase.rpc('reveal_owner_contact', {
    p_listing_id: listingId
  })
  return { data, error }
}

// Landmark search (sanitized)
export async function searchLandmarks(query: string) {
  const sanitized = query.replace(/[%_]/g, '')
  const { data } = await supabase
    .from('areas')
    .select('*')
    .ilike('name', `%${sanitized}%`)
    .order('search_volume', { ascending: false })
    .limit(10)
  return data || []
}

// Analytics event tracking
export async function trackEvent(eventType: string, listingId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('analytics_events').insert({
    event_type: eventType,
    listing_id: listingId,
    user_id: user.id,
  })
}