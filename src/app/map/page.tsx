'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, MapPin, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type MapListing = {
  id: string
  title: string
  rent: number
  beds_available: number
  areaName: string
  lat: number
  lng: number
}

export default function MapPage() {
  const [listings, setListings] = useState<MapListing[]>([])
  const [filteredListings, setFilteredListings] = useState<MapListing[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const KARACHI_CENTER: [number, number] = [24.8607, 67.0011]

  // Fetch live listings with area coordinates
  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          rent,
          beds_available,
          custom_area,
          areas!inner (
            name,
            coordinates
          )
        `)
        .eq('status', 'live')

      if (error) {
        console.error('Error fetching listings:', error)
        setLoading(false)
        return
      }

      const mapListings: MapListing[] = (data || []).map((item: any) => {
        let lat = KARACHI_CENTER[0]
        let lng = KARACHI_CENTER[1]
        let areaName = item.custom_area || 'Karachi'

        if (item.areas && item.areas.coordinates) {
          // coordinates is a PostGIS GEOGRAPHY type; Supabase returns it as an object with type and coordinates
          const coords = item.areas.coordinates
          if (coords.type === 'Point' && Array.isArray(coords.coordinates)) {
            lng = coords.coordinates[0]
            lat = coords.coordinates[1]
          }
          areaName = item.areas.name || areaName
        }

        return {
          id: item.id,
          title: item.title,
          rent: item.rent,
          beds_available: item.beds_available,
          areaName,
          lat,
          lng,
        }
      })

      setListings(mapListings)
      setFilteredListings(mapListings)
      setLoading(false)
    }

    fetchListings()
  }, [])

  // Filter listings on search
  useEffect(() => {
    const filtered = listings.filter((l) =>
      l.areaName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredListings(filtered)
  }, [searchTerm, listings])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Search Overlay */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-md md:max-w-lg px-4">
        <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-1 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search landmarks (e.g. KU, DHA, Clifton)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none py-4 px-2 text-gray-800 placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          {filteredListings.length} of {listings.length} listings
        </p>
      </div>

      {/* Map */}
      <MapContainer
        center={KARACHI_CENTER}
        zoom={11}
        style={{ height: '100vh', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {filteredListings.map((listing) => (
          <Marker key={listing.id} position={[listing.lat, listing.lng]}>
            <Popup>
              <div className="min-w-72">
                <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                <p className="text-2xl font-bold text-emerald-600 mb-2">
                  PKR {listing.rent.toLocaleString()}/mo
                </p>
                <p className="text-gray-700 mb-3">
                  {listing.beds_available} bed{listing.beds_available !== 1 ? 's' : ''} available
                </p>
                <p className="text-sm text-gray-600 mb-4 font-medium">
                  📍 {listing.areaName}
                </p>
                <Link
                  href={`/listings/${listing.id}`}
                  className="w-full block bg-indigo-600 text-white py-3 px-6 rounded-xl text-center font-semibold hover:bg-indigo-700 transition"
                >
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Empty state overlay */}
      {filteredListings.length === 0 && listings.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-12 text-center max-w-md mx-4">
            <MapPin className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No listings found</h3>
            <p className="text-gray-600 mb-8">
              Try searching for a different landmark or area. Popular options: KU, DHA, Clifton, Gulistan-e-Jauhar.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-indigo-700 transition"
            >
              Clear Search
            </button>
          </div>
        </motion.div>
      )}

      {listings.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-slate-50/90 to-blue-50/90 backdrop-blur-md"
        >
          <div className="text-center max-w-md mx-4">
            <div className="w-32 h-32 bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <MapPin className="w-20 h-20 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No listings yet</h2>
            <p className="text-xl text-gray-600 mb-8">
              Be the first to add a listing to the map!
            </p>
            <Link
              href="/post-listing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              Post Your Listing
              <span className="text-sm">Free</span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}