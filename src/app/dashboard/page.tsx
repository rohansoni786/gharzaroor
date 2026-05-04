'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Home,
  MessageSquare,
  Heart,
  Phone,
  Clock,
  MapPin,
  Bed,
  Banknote,
} from 'lucide-react'
import type { Listing } from '@/types'

// Local types for the dashboard data
interface InquiryReceived {
  id: string
  created_at: string
  reveal_expires: string | null
  listings: {
    title: string
    owner_id: string
  } | null
  seeker: {
    full_name: string
  } | null
}

interface WantedAd {
  id: string
  beds_needed: number
  rent_min: number
  rent_max: number
  status: string
  areas: { name: string } | null
  custom_area: string | null
}

interface ContactReveal {
  id: string
  listing_id: string
  reveal_expires: string | null
  listings: {
    title: string
    rent: number
    beds_available: number
    photos: string[]
    areas: { name: string } | null
    custom_area: string | null
  } | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Properly typed data states
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [inquiriesReceived, setInquiriesReceived] = useState<InquiryReceived[]>([])
  const [myWantedAds, setMyWantedAds] = useState<WantedAd[]>([])
  const [contactReveals, setContactReveals] = useState<ContactReveal[]>([])

  const handleOwnerStatusChange = async (newStatus: string, listingId: string) => {
    const { error } = await supabase.rpc('moderate_listing', {
      p_listing_id: listingId,
      p_new_status: newStatus,
    })
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      // Refresh listings after status change
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: listings } = await supabase
          .from('listings')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
        setMyListings((listings || []) as Listing[])
      }
    }
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/?auth=login')
        return
      }

      // 1. My Listings
      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      setMyListings((listings || []) as Listing[])

      // 2. Inquiries received (on my listings)
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('*, listings!inner(title), seeker:profiles!inquiries_seeker_id_fkey(full_name)')
        .eq('listings.owner_id', user.id)
        .order('created_at', { ascending: false })
      setInquiriesReceived((inquiries || []) as InquiryReceived[])

      // 3. My Wanted Ads
      const { data: wanted } = await supabase
        .from('wanted_ads')
        .select('*, areas(name)')
        .eq('seeker_id', user.id)
        .order('created_at', { ascending: false })
      setMyWantedAds((wanted || []) as WantedAd[])

      // 4. Contact reveals made (inquiries where I'm the seeker)
      const { data: reveals } = await supabase
        .from('inquiries')
        .select('*, listings(title, rent, beds_available, photos, areas(name), custom_area)')
        .eq('seeker_id', user.id)
        .order('created_at', { ascending: false })
      setContactReveals((reveals || []) as ContactReveal[])

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <Link
          href="/account"
          className="text-indigo-600 hover:underline text-sm font-medium"
        >
          Account Settings →
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-4 rounded-xl shadow border text-center">
          <Home className="w-6 h-6 mx-auto text-indigo-600 mb-1" />
          <p className="text-2xl font-bold">{myListings.length}</p>
          <p className="text-xs text-gray-500">My Listings</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border text-center">
          <MessageSquare className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
          <p className="text-2xl font-bold">{inquiriesReceived.length}</p>
          <p className="text-xs text-gray-500">Inquiries Received</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border text-center">
          <Heart className="w-6 h-6 mx-auto text-amber-600 mb-1" />
          <p className="text-2xl font-bold">{myWantedAds.length}</p>
          <p className="text-xs text-gray-500">Wanted Ads</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border text-center">
          <Phone className="w-6 h-6 mx-auto text-rose-600 mb-1" />
          <p className="text-2xl font-bold">{contactReveals.length}</p>
          <p className="text-xs text-gray-500">Contacts Revealed</p>
        </div>
      </div>

      {/* MY LISTINGS */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Listings</h2>
        {myListings.length === 0 ? (
          <p className="text-gray-500">
            You haven&apos;t posted any listings yet.{' '}
            <Link href="/post-listing" className="text-indigo-600 underline">
              Post one now
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myListings.map((listing) => (
              <div key={listing.id} className="bg-white p-4 rounded-xl shadow border">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        listing.status === 'live'
                          ? 'bg-emerald-100 text-emerald-700'
                          : listing.status === 'filled'
                          ? 'bg-blue-100 text-blue-700'
                          : listing.status === 'deleted'
                          ? 'bg-gray-100 text-gray-700'
                          : listing.status === 'flagged'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {listing.status}
                    </span>
                    <select
                      value={listing.status}
                      onChange={(e) =>
                        handleOwnerStatusChange(e.target.value, listing.id)
                      }
                      className="text-xs px-2 py-1 rounded bg-white border border-gray-300 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="live">Live</option>
                      <option value="filled">Filled</option>
                      <option value="deleted">Delete</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  PKR {listing.rent?.toLocaleString()}/mo • {listing.beds_available}{' '}
                  bed{listing.beds_available > 1 ? 's' : ''}
                </p>
                <Link
                  href={`/listings/${listing.id}`}
                  className="text-indigo-600 text-sm font-medium mt-3 inline-block hover:underline"
                >
                  View details
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* INQUIRIES RECEIVED */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Inquiries Received
        </h2>
        {inquiriesReceived.length === 0 ? (
          <p className="text-gray-500">No one has requested your contact yet.</p>
        ) : (
          <div className="space-y-3">
            {inquiriesReceived.map((inq) => (
              <div
                key={inq.id}
                className="bg-white p-4 rounded-xl shadow border flex flex-col sm:flex-row sm:items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {inq.listings?.title || 'Your listing'}
                  </p>
                  <p className="text-sm text-gray-500">
                    From: {inq.seeker?.full_name || 'Anonymous'} •{' '}
                    {new Date(inq.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  {inq.reveal_expires &&
                  new Date(inq.reveal_expires) > new Date() ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      Active until{' '}
                      {new Date(inq.reveal_expires).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MY WANTED ADS */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Wanted Ads</h2>
        {myWantedAds.length === 0 ? (
          <p className="text-gray-500">
            You haven&apos;t posted any room requests.{' '}
            <Link href="/wanted/post" className="text-indigo-600 underline">
              Post one now
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {myWantedAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-white p-4 rounded-xl shadow border flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {ad.beds_needed} bed{ad.beds_needed > 1 ? 's' : ''} needed
                  </p>
                  <p className="text-sm text-gray-500">
                    {ad.areas?.name || ad.custom_area || 'Area not specified'} •
                    PKR {ad.rent_min}-{ad.rent_max}/mo
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    ad.status === 'active'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {ad.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CONTACT REVEALS MADE */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Contacts You&apos;ve Revealed
        </h2>
        {contactReveals.length === 0 ? (
          <p className="text-gray-500">
            You haven&apos;t revealed any owner contacts yet.
          </p>
        ) : (
          <div className="space-y-3">
            {contactReveals.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-4 rounded-xl shadow border flex flex-col sm:flex-row sm:items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {rev.listings?.title || 'Untitled listing'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {rev.listings?.areas?.name ||
                      rev.listings?.custom_area ||
                      'Unknown area'}{' '}
                    • PKR {rev.listings?.rent?.toLocaleString()}/mo
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center gap-2">
                  {rev.reveal_expires &&
                  new Date(rev.reveal_expires) > new Date() ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Expires{' '}
                      {new Date(rev.reveal_expires).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      Expired
                    </span>
                  )}
                  <Link
                    href={`/listings/${rev.listing_id}`}
                    className="text-indigo-600 text-sm hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}