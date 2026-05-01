import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// v19.0 RPC: Contact reveal (48hr)
export async function revealContact(listingId: string) {
  const { data, error } = await supabase.rpc('reveal_owner_contact', {
    p_listing_id: listingId
  })
  return { data, error }
}

// Landmark search
export async function searchLandmarks(query: string) {
  const { data } = await supabase
    .from('areas')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('search_volume', { ascending: false })
    .limit(10)
  return data || []
}