'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flaggedListings, setFlaggedListings] = useState<AnyRow[]>([])
  const [stats, setStats] = useState({ listings: 0, users: 0, inquiries: 0 })
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    // Flagged listings
    const { data: flagged } = await supabase
      .from('listings')
      .select('*, areas(name)')
      .eq('status', 'flagged')
      .order('created_at', { ascending: false })
    setFlaggedListings(flagged || [])

    // Stats
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live')
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    const { count: inquiriesCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })

    setStats({
      listings: listingsCount || 0,
      users: usersCount || 0,
      inquiries: inquiriesCount || 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('trust_score')
        .eq('id', user.id)
        .single()
      if (!profile || profile.trust_score < 90) {
        setMessage('Access denied.')
        setLoading(false)
        return
      }
      setIsAdmin(true)
      fetchData()
    }
    check()
  }, [router, fetchData])

  const handleAction = async (id: string, status: 'live' | 'rejected') => {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id)
    if (error) setMessage(`Error: ${error.message}`)
    else fetchData()
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!isAdmin) return <div className="p-8 text-center text-red-600">{message}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {message && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">{message}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-gray-500 text-sm">Live Listings</p>
          <p className="text-2xl font-bold">{stats.listings}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-gray-500 text-sm">Users</p>
          <p className="text-2xl font-bold">{stats.users}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="text-gray-500 text-sm">Inquiries</p>
          <p className="text-2xl font-bold">{stats.inquiries}</p>
        </div>
      </div>

      {/* Flagged Listings */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Flagged Listings ({flaggedListings.length})</h2>
      {flaggedListings.length === 0 ? (
        <p className="text-gray-500">No listings to review.</p>
      ) : (
        <div className="space-y-4">
          {flaggedListings.map((listing) => (
            <div key={listing.id} className="bg-white p-6 rounded-xl shadow border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{listing.title}</h3>
                <p className="text-sm text-gray-500">
                  {listing.areas?.name || listing.custom_area || 'Custom'} • PKR {listing.rent}
                </p>
                <p className="text-xs text-gray-400">{listing.created_at}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(listing.id, 'live')}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleAction(listing.id, 'rejected')}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}