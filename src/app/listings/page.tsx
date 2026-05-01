'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, MapPin, Bed, Banknote, Phone } from 'lucide-react'

type Listing = {
  id: string
  title: string
  rent: number
  beds_available: number
  gender_preference: string
  photos: string[]
  created_at: string
  areas: {
    name: string
  } | null
  custom_area: string | null  // 👈 add this line
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [areas, setAreas] = useState<{ name: string }[]>([])

  // Fetch areas for autocomplete/filter
  useEffect(() => {
    supabase
      .from('areas')
      .select('name')
      .order('name')
      .then(({ data }) => {
        if (data) setAreas(data)
      })
  }, [])

  // Fetch approved listings (live status)
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          rent,
          beds_available,
          gender_preference,
          photos,
          created_at,
          areas ( name )
        `)
        .eq('status', 'live')
        .order('created_at', { ascending: false })

      // Frontend filtering by area name (since we don't have full‑text search yet)
      // For simplicity, we fetch all and filter client-side, but note: area name search is a bit heavy.
      // We'll implement server-side later. For now, let's do client-side filter.
      const { data, error } = await query.limit(50)

      if (data && !error) {
        const typed: Listing[] = data as any
        setListings(typed)
      }
      setLoading(false)
    }

    fetchListings()
  }, [])

  // Client‑side filter by area name
  const filtered = listings.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.areas?.name && l.areas.name.toLowerCase().includes(search.toLowerCase()))
    const matchesArea = !areaFilter || l.areas?.name === areaFilter
    return matchesSearch && matchesArea
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Available Shared Flats</h1>
        <Link
          href="/post-listing"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          + Post Free Listing
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.name} value={a.name}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-24 text-gray-500">Loading listings...</div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-xl text-gray-600 mb-2">No listings found.</p>
          <p className="text-gray-400">Try adjusting your search or check back soon.</p>
        </div>
      )}

      {/* Listing Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition border border-gray-100"
            >
              {/* Photo placeholder (we'll add real photos later) */}
              <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                {listing.photos?.[0] ? (
                  <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏠</span>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{listing.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
  <MapPin className="w-4 h-4" />
  {listing.areas?.name || listing.custom_area || 'Custom area'}
</span>
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" /> {listing.beds_available} {listing.beds_available === 1 ? 'Bed' : 'Beds'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Banknote className="w-4 h-4" /> PKR {listing.rent.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                    {listing.gender_preference === 'any' ? 'Any Gender' : listing.gender_preference === 'male' ? 'Male Only' : 'Female Only'}
                  </span>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="flex items-center gap-1 text-indigo-600 text-sm font-semibold hover:underline"
                  >
                    <Phone className="w-4 h-4" /> Contact
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}