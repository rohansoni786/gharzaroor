'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar({ isLoggedIn, onSignInClick }: { isLoggedIn: boolean, onSignInClick: () => void }) {


  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Gharzaroor.pk
        </h1>
        <div className="hidden md:flex space-x-8">
          <Link href="/" className="font-semibold text-indigo-600">Home</Link>
          <Link href="/listings" className="hover:text-indigo-600 transition-all">Browse Flats</Link>
          <Link href="/map" className="hover:text-indigo-600 transition-all">Map View</Link>
          <Link href="/post-listing" className="hover:text-indigo-600 transition-all">Post Listing</Link>
          <Link href="/wanted" className="hover:text-indigo-600 transition-all">Wanted</Link>
        </div>
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg">
              Dashboard
            </Link>
          ) : (
            <button 
              onClick={onSignInClick}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
          )}
          {isLoggedIn && (
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg ml-2"
              aria-label="Sign out"
            >
              Logout
            </button>
          )}

        </div>
      </div>
    </nav>
  )
}

