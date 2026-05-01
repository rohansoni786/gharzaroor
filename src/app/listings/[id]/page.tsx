'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Phone, MapPin, Bed, X } from 'lucide-react'

type Listing = {
  id: string
  title: string
  rent: number
  beds_available: number
  gender_preference: string
  photos: string[]
  description: string
  amenities: string[]
  status: string
  areas: { name: string } | null
  custom_area: string | null
}

export default function ListingDetailPage() {
  const params = useParams()
  const listingId = params.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [revealLoading, setRevealLoading] = useState(false)
  const [contact, setContact] = useState<{ phone: string; whatsapp: string } | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Fetch listing
  useEffect(() => {
    supabase
      .from('listings')
      .select('*, areas(name)')
      .eq('id', listingId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('Listing not found')
        else setListing(data as any)
        setLoading(false)
      })
  }, [listingId])

  const areaName = listing?.areas?.name || listing?.custom_area || 'Custom area'

  // Reveal contact
  const handleReveal = async () => {
    setRevealLoading(true)
    setError('')
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Please sign in to contact the owner.')
      setRevealLoading(false)
      return
    }

    if (contact) {
      setShowModal(true)
      setRevealLoading(false)
      return
    }

    const { data, error: fnError } = await supabase
      .rpc('reveal_owner_contact', { p_listing_id: listingId })

    if (fnError) {
      setError(fnError.message)
    } else if (data && data.length > 0) {
      setContact(data[0])
      setShowModal(true)
    } else {
      setError('No contact available.')
    }

    setRevealLoading(false)
  }

  // Report listing
  const handleReport = async () => {
    setError('')
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Please sign in to report.')
      return
    }

    const { error } = await supabase
      .from('listings')
      .update({ status: 'flagged' })
      .eq('id', listingId)

    if (error) {
      setError('Could not report: ' + error.message)
    } else {
      setMessage('Reported. Thank you for keeping the community safe.')
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  if (error && !listing) {
    return <div className="p-8 text-center text-red-600">{error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      <Link href="/listings" className="text-indigo-600 text-sm mb-4 inline-block hover:underline">
        ← Back to listings
      </Link>

      {/* Photos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {listing?.photos?.length ? (
          listing.photos.map((url, i) => (
            <img key={i} src={url} className="w-full h-64 object-cover rounded-xl" />
          ))
        ) : (
          <div className="col-span-3 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-4xl">
            🏠
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* MAIN */}
        <div className="md:col-span-2 space-y-6">

          <div>
            <h1 className="text-3xl font-bold">{listing?.title}</h1>
            <p className="text-xl text-indigo-600 font-semibold">
              PKR {listing?.rent?.toLocaleString()}/mo
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" /> {areaName}
            </div>
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5" /> {listing?.beds_available} Beds
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {listing?.description || 'No description.'}
            </p>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="bg-white p-6 rounded-xl shadow-lg border space-y-4">

          <h2 className="font-bold text-lg">Contact Owner</h2>

          <p className="text-sm text-gray-500">
            Verified listing. Contact unlocks direct communication.
          </p>

          {/* Reveal Button */}
          <button
            onClick={handleReveal}
            disabled={revealLoading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition"
          >
            {revealLoading ? 'Loading...' : (
              <>
                <Phone className="inline w-5 h-5 mr-2" />
                Reveal Contact
              </>
            )}
          </button>

          {/* Report Button */}
          <button
            onClick={handleReport}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-100 transition text-sm"
          >
            🚩 Report Listing
          </button>

          {/* Messages */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
        </div>
      </div>

      {/* CONTACT MODAL */}
      {showModal && contact && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-4">Owner Contact</h2>

            <p className="mb-2">📞 {contact.phone}</p>
            <p>💬 {contact.whatsapp}</p>

            <p className="text-xs text-gray-400 mt-4">
              Available for 48 hours
            </p>
          </div>
        </div>
      )}
    </div>
  )
}