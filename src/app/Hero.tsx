'use client'

import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState, useCallback } from 'react'

export default function Hero({ searchQuery, onSearchChange }: { searchQuery: string, onSearchChange: (q: string) => void }) {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/listings?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <section className="py-20 px-4 sm:py-28" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6 leading-tight">
          Find Your Perfect Shared Flat
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Rooms verified by phone, near KU • IBA • NED • Fast University. No spam, instant owner contact.
        </p>
        <form onSubmit={handleSubmit} className="flex bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto mb-6">
          <input 
            type="text" 
            placeholder="Near IBA City Campus, Clifton..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="flex-1 px-6 py-4 text-lg outline-none placeholder-gray-500" 
            aria-label="Search flats"
          />
          <button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2">
            <Search className="w-5 h-5" /> Find My Room
          </button>
        </form>
        <p className="text-sm text-gray-500">
          Trusted by 1,200+ students & professionals across Karachi
        </p>
      </div>
    </section>
  )
}

