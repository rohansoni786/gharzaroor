'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, MapPin, Bed, Banknote, Phone } from 'lucide-react'


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
  created_at: string
  areas: { name: string } | null
}

function WantedContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  

  const [ads, setAds] = useState<WantedAd[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialQuery)
  const [areaFilter, setAreaFilter] = useState('')
  const [areas, setAreas] = useState<{ name: string }[]>([])

  useEffect(() => {
    supabase.from('areas').select('name').order('name').then(({ data }) => {
      if (data) setAreas(data)
    })
  }, [])

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true)
      let query = supabase
        .from('wanted_ads')
        .select('*, areas(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      if (areaFilter) {
        query = query.eq('areas.name', areaFilter)
      }
      if (search.trim()) {
        const term = `%${search.trim().replace(/[%_]/g, '')}%`
        query = query.or(`description.ilike.${term},custom_area.ilike.${term}`)
      }

      const { data } = await query
      setAds((data || []) as WantedAd[])
      setLoading(false)
    }
    fetchAds()
  }, [search, areaFilter])

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Wanted – Room Requests</h1>
        <Link
          href="/wanted/post"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          + Post Your Request
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 mb-8 bg-white/70 backdrop-blur-md p-4 rounded-xl border border-white/20"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50"
          />
        </div>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50"
        >
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.name} value={a.name}>{a.name}</option>
          ))}
        </select>
      </motion.div>

      {loading && <p className="text-center py-24 text-gray-500">Loading...</p>}
      {!loading && ads.length === 0 && (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-xl text-gray-600 mb-2">No requests yet.</p>
          <p className="text-gray-400">Be the first to post what you need!</p>
        </div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {ads.map((ad) => (
          <motion.div 
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            key={ad.id} 
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition border border-white/20 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg">
                {ad.beds_needed} Bed{ad.beds_needed > 1 ? 's' : ''} needed
              </h3>
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">Wanted</span>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {ad.areas?.name || ad.custom_area || 'Not specified'}
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4" /> PKR {ad.rent_min.toLocaleString()} – {ad.rent_max.toLocaleString()}/mo
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4" /> {ad.beds_needed} bed{ad.beds_needed > 1 ? 's' : ''}
              </div>
              <p className="text-xs text-gray-400">
                {ad.gender_preference === 'any' ? 'Any gender' : ad.gender_preference === 'male' ? 'Male only' : 'Female only'}
              </p>
            </div>
            {ad.description && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{ad.description}</p>
            )}
            <Link
              href={`/wanted/${ad.id}`}
              className="mt-4 flex items-center gap-1 text-indigo-600 text-sm font-semibold hover:underline"
            >
              <Phone className="w-4 h-4" /> Contact Seeker
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

export default function WantedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <WantedContent />
    </Suspense>
  )
}
