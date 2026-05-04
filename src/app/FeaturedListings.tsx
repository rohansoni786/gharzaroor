'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Listing } from '@/types/index'
import ListingCard from '@/components/ListingCard'
// import Skeleton from '@/components/Skeleton'


type ListingWithArea = Listing

export default function FeaturedListings() {
  const [listings, setListings] = useState<ListingWithArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchFeatured() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('listings')
          .select('*, areas(name)')
          .eq('status', 'live')
          .order('created_at', { ascending: false })
          .limit(3)

        if (error) throw error
        if (data) setListings(data as Listing[])
      } catch (err: any) {
        setError('Failed to load featured listings. Please try again later.')
        console.error('Featured listings error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeatured()
  }, [])

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map((i) => (
              <div key={i} className="h-80 w-full bg-white rounded-2xl shadow-lg animate-pulse overflow-hidden">
                <div className="h-48 bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-64" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="flex gap-2">
                    <div className="h-4 bg-gray-200 rounded-full w-16" />
                    <div className="h-4 bg-gray-200 rounded-full w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    )
  }

  if (error || listings.length === 0) {
    return null // Hide section if no listings or error
  }

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-3xl font-black text-gray-900 text-center mb-12">Just Listed</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/listings" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
            View All Listings
          </Link>
        </div>
      </div>
    </section>
  )
}

