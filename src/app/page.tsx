'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FREE_PERIOD_END } from '@/lib/constants'
import { motion } from 'framer-motion'
// Navbar moved to layout.tsx
import Hero from './Hero'
import AuthModal from './AuthModal'
import FeaturedListings from './FeaturedListings'
import Footer from './Footer'
import { AuthTrigger } from './AuthTrigger'

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [freeDaysLeft, setFreeDaysLeft] = useState(0)

  // Auth trigger callbacks for AuthTrigger
  const handleRedirectSet = (redirect: string | null) => setRedirectAfterLogin(redirect)
  const handleModalOpen = () => setShowAuthModal(true)

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  // URL auth trigger
  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login') {
      const redirect = searchParams.get('redirect')
      if (redirect) setRedirectAfterLogin(decodeURIComponent(redirect))
      setShowAuthModal(true)
    }
  }, [searchParams])

  // Countdown
  useEffect(() => {
    const endDate = new Date(FREE_PERIOD_END)
    const today = new Date()
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    setFreeDaysLeft(Math.max(0, diffDays))
  }, [])

  // Session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setIsLoggedIn(!!session))
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleModalClose = () => {
    setShowAuthModal(false)
  }

  return (
    <>
      <AuthTrigger 
        onRedirectSet={handleRedirectSet}
        onModalOpen={handleModalOpen}
        onModalViewSet={() => {}} // Not used anymore
      />
      <main className="min-h-screen bg-white flex flex-col">
        {/* COUNTDOWN BANNER */}
        {freeDaysLeft > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-indigo-600 py-3 px-4 text-center text-white font-semibold"
          >
            🔥 FREE for {freeDaysLeft} more day{freeDaysLeft === 1 ? '' : 's'}!
          </motion.div>
        )}

        <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <FeaturedListings />
        <Footer />

        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={handleModalClose}
            redirectAfterLogin={redirectAfterLogin}
          />
        )}
      </main>
    </>
  )
}

