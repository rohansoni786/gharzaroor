'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, MapPin, ShieldCheck, Smartphone, Users } from 'lucide-react'

type Listing = {
  id: string
  title: string
  rent: number
  beds_available: number
  gender_preference: string
  photos: string[]
  description: string
  areas: { name: string } | null
  custom_area: string | null
}

export default function HomePage() {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])

  useEffect(() => {
    supabase
      .from('listings')
      .select('*, areas(name)')
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setFeaturedListings(data as any)
      })
  }, [])

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-black text-indigo-600">Gharzaroor.pk</h1>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="text-indigo-600">Home</Link>
            <Link href="/listings" className="text-gray-600 hover:text-indigo-600">Browse Flats</Link>
            <Link href="/map" className="text-gray-600 hover:text-indigo-600">Map View</Link>
            <Link href="/post-listing" className="text-gray-600 hover:text-indigo-600">Post Room</Link>
          </div>
        </div>
      </nav>

      {/* Hero - using Tailwind v4 safe gradient */}
      <section
        className="py-20 px-4"
        style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Find Your Perfect <br className="hidden sm:block" /> Shared Flat
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Search for rooms by university, area, or landmark
          </p>

          <div className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Near IBA City Campus, Clifton..."
              className="flex-1 px-6 py-4 outline-none text-gray-700"
            />
            <button className="bg-indigo-600 text-white px-8 py-4 font-bold hover:bg-indigo-700 transition flex items-center gap-2">
              <Search className="w-5 h-5" /> Find My Room
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Trusted by 1,200+ students & professionals in Karachi
          </p>
        </div>
      </section>

      {/* Popular Hubs */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Hubs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { name: 'DHA Phase 5', count: 120, color: 'bg-blue-50 text-blue-700' },
            { name: 'Gulistan-e-Jauhar', count: 95, color: 'bg-emerald-50 text-emerald-700' },
            { name: 'Clifton', count: 80, color: 'bg-amber-50 text-amber-700' },
          ].map((hub) => (
            <Link
              key={hub.name}
              href={`/listings?area=${hub.name}`}
              className="block p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition text-center"
            >
              <MapPin className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <p className="font-bold text-lg">{hub.name}</p>
              <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium ${hub.color}`}>
                {hub.count}+ rooms
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Verified Rooms */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-bold text-gray-900">Featured Verified Rooms</h3>
            <Link href="/listings" className="text-indigo-600 font-medium hover:underline">
              View all →
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <p className="text-center text-gray-500">No listings yet. Be the first to post!</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredListings.map((listing) => {
                const areaName = listing.areas?.name || listing.custom_area || 'Karachi'
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition border border-gray-100"
                  >
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🏠</span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-lg text-gray-900">{listing.title}</h4>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                          Verified
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {areaName} &middot; {listing.beds_available} bed{listing.beds_available > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {listing.gender_preference === 'any' ? 'Any Gender' : listing.gender_preference === 'male' ? 'Male Only' : 'Female Only'}
                      </p>
                      <p className="mt-3 font-bold text-indigo-600 text-lg">
                        PKR {listing.rent.toLocaleString()}/mo
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Why Gharzaroor */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-12 text-center">Why Gharzaroor?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h4 className="font-bold text-lg mb-2">100% Verified Owners</h4>
            <p className="text-gray-500 text-sm">
              Every listing owner is phone‑verified. No fake profiles, no spam.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="font-bold text-lg mb-2">Confidential Connections</h4>
            <p className="text-gray-500 text-sm">
              Your phone number stays private until you approve the contact. No spam WhatsApp groups.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            <h4 className="font-bold text-lg mb-2">Karachi Specialists</h4>
            <p className="text-gray-500 text-sm">
              Built by Karachi locals. We know the neighborhoods, the universities, and the culture.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        © 2026 Gharzaroor.pk – Har zaroorat ka ek ghar. Built with 💜 for Karachi.
      </footer>
    </main>
  )
}