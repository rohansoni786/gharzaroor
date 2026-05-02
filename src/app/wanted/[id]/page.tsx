'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { MapPin, Bed, Banknote, Phone, X } from 'lucide-react'

type WantedAd = {
  id: string
  seeker_id: string
  area_id: string | null
  custom_area: string | null
  rent_min: number
  rent_max: number
  beds_needed: number
  gender_preference: string
  description: string
  status: string
  areas: { name: string } | null
}

export default function WantedDetailPage() {
  const params = useParams()
  const wantedId = params.id as string

  const [ad, setAd] = useState<WantedAd | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revealLoading, setRevealLoading] = useState(false)
  const [contact, setContact] = useState<{ phone: string; whatsapp: string } | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    supabase
      .from('wanted_ads')
      .select('*, areas(name)')
      .eq('id', wantedId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('Request not found')
        else setAd(data as WantedAd)
        setLoading(false)
      })
  }, [wantedId])

  const handleReveal = async () => {
    setRevealLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Please sign in as an owner to contact the seeker.')
      setRevealLoading(false)
      return
    }
    if (contact) {
      setShowModal(true)
      setRevealLoading(false)
      return
    }
    const { data, error: fnError } = await supabase.rpc('reveal_seeker_contact', { p_wanted_ad_id: wantedId })
    if (fnError) setError(fnError.message)
    else if (data && data.length > 0) {
      setContact(data[0])
      setShowModal(true)
    } else setError('No contact information available.')
    setRevealLoading(false)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!ad) return <div className="p-8 text-center text-red-600">{error}</div>

  const areaName = ad.areas?.name || ad.custom_area || 'Not specified'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/wanted" className="text-indigo-600 text-sm mb-4 inline-block hover:underline">← Back to requests</Link>

      <div className="bg-white p-8 rounded-2xl shadow-lg border">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-bold">{ad.beds_needed} Bed{ad.beds_needed > 1 ? 's' : ''} needed</h1>
          <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">Active</span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" /> {areaName}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Banknote className="w-5 h-5" /> PKR {ad.rent_min.toLocaleString()} – {ad.rent_max.toLocaleString()}/mo
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Bed className="w-5 h-5" /> {ad.beds_needed} bed{ad.beds_needed > 1 ? 's' : ''}
          </div>
          <div className="text-gray-600">
            {ad.gender_preference === 'any' ? 'Any gender' : ad.gender_preference === 'male' ? 'Male only' : 'Female only'}
          </div>
        </div>

        <p className="text-gray-700 whitespace-pre-wrap mb-6">{ad.description || 'No extra description.'}</p>

        <button
          onClick={handleReveal}
          disabled={revealLoading}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition"
        >
          {revealLoading ? 'Loading...' : (<><Phone className="inline w-5 h-5 mr-2" /> Contact Seeker</>)}
        </button>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {showModal && contact && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400"><X /></button>
            <h2 className="text-2xl font-bold mb-4">Seeker Contact</h2>
            <p className="mb-2">📞 {contact.phone}</p>
            <p>💬 {contact.whatsapp}</p>
            <p className="text-xs text-gray-400 mt-4">Use responsibly.</p>
          </div>
        </div>
      )}
    </div>
  )
}