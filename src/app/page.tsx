'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FREE_PERIOD_END } from '@/lib/constants'
import Link from 'next/link'
import { Search, MapPin, X, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ListingCard from '@/components/ListingCard'

type ModalView = 'login' | 'forgot' | 'forgot-otp' | 'forgot-reset' | 'register' | 'register-verify'

export default function HomePage() {
  const router = useRouter()

  // ── State (all hooks first) ──
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [featuredListings, setFeaturedListings] = useState<any[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [modalView, setModalView] = useState<ModalView>('login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState('')

  // Countdown timer state
  const [freeDaysLeft, setFreeDaysLeft] = useState(0)

  // Calculate days until FREE_PERIOD_END
  useEffect(() => {
    const endDate = new Date(FREE_PERIOD_END)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setFreeDaysLeft(Math.max(0, diffDays))
  }, [])

  // ── Check if user is logged in ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  // ── Listen for auth state changes ──
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // ── Effect: open modal if ?auth=login ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'login') {
      const redirect = params.get('redirect')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (redirect) setRedirectAfterLogin(redirect)
      setShowAuthModal(true)
      setModalView('login')
      // Clean URL so modal doesn't reopen on refresh
      router.replace('/', { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch featured listings ──
  useEffect(() => {
    supabase
      .from('listings')
      .select('*, areas(name)')
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (data) setFeaturedListings(data as any)
      })
  }, [])

  // ── Helpers ──
  const resetAuthState = () => {
    setEmail('')
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setName('')
    setOtp('')
    setShowPassword(false)
    setAuthError('')
    setAuthMessage('')
  }

  const openAuthModal = (view: ModalView = 'login') => {
    resetAuthState()
    setModalView(view)
    setShowAuthModal(true)
  }

  const closeAuthModal = () => setShowAuthModal(false)

  // ── Auth Handlers ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthError(error.message)
    } else {
      closeAuthModal()
      if (redirectAfterLogin) router.push(redirectAfterLogin)
      else router.push('/dashboard')
    }
    setAuthLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    setAuthMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (error) setAuthError(error.message)
    else {
      setAuthMessage('A 6‑digit code has been sent to your email.')
      setModalView('forgot-otp')
    }
    setAuthLoading(false)
  }

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('')
      setModalView('forgot-reset')
    }
    setAuthLoading(false)
  }

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }
    setAuthLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) setAuthError(error.message)
    else {
      setAuthMessage('Password changed. You can now log in.')
      setModalView('login')
    }
    setAuthLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }
    setAuthLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone: phone || undefined } },
    })

    if (error) {
      setAuthError(error.message)
      setAuthLoading(false)
      return
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({ email })

    if (otpError) {
      setAuthError('Account created, but failed to send verification code: ' + otpError.message)
      setAuthLoading(false)
    } else {
      setAuthMessage('We sent a verification code to your email.')
      setModalView('register-verify')
      setAuthLoading(false)
    }
  }

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })

    if (error) setAuthError(error.message)
    else {
      closeAuthModal()
      if (redirectAfterLogin) router.push(redirectAfterLogin)
      else router.push('/dashboard')
    }
    setAuthLoading(false)
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/listings?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // ─────────────────── RENDER ───────────────────
  return (
    <main className="min-h-screen bg-white">
{/* COUNTDOWN BANNER */}
      {freeDaysLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 py-2 px-4 text-center"
        >
          <motion.span
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white font-semibold text-sm md:text-base"
          >
            🔥 FREE for {freeDaysLeft} more day{freeDaysLeft === 1 ? '' : 's'}! Post your listing now at no cost.
          </motion.span>
        </motion.div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-2xl font-black text-indigo-600">Gharzaroor.pk</h1>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-700">
            <Link href="/" className="text-indigo-600">Home</Link>
            <Link href="/listings" className="hover:text-indigo-600 transition">Browse Flats</Link>
            <Link href="/post-listing" className="hover:text-indigo-600 transition">Post Room</Link>
            <Link href="/wanted" className="hover:text-indigo-600 transition">Wanted</Link>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="hidden md:inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section
        className="py-24 px-4"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Find Your Perfect Shared Flat
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Search for rooms by university, area, or landmark
          </p>

          <form onSubmit={handleSearch} className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Near IBA City Campus, Clifton..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-6 py-4 outline-none text-gray-700"
            />
            <button type="submit" className="bg-indigo-600 text-white px-8 py-4 font-bold hover:bg-indigo-700 transition flex items-center gap-2">
              <Search className="w-5 h-5" /> Find My Room
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500">
            Trusted by 1,200+ students & professionals in Karachi
          </p>
        </div>
      </section>

      {/* POPULAR HUBS */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Popular Hubs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { name: 'DHA Phase 5', color: 'bg-blue-50 text-blue-700' },
            { name: 'Gulistan-e-Jauhar', color: 'bg-emerald-50 text-emerald-700' },
            { name: 'Clifton', color: 'bg-amber-50 text-amber-700' },
          ].map((hub) => (
            <Link
              key={hub.name}
              href={`/listings?area=${hub.name}`}
              className="block p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition text-center"
            >
              <MapPin className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <p className="font-bold text-lg">{hub.name}</p>
              <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-medium ${hub.color}`}>
                Popular
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED VERIFIED ROOMS */}
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
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY GHARZAROOR */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-12 text-center">Why Gharzaroor?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2">100% Verified Owners</h4>
            <p className="text-gray-500 text-sm">Every listing owner is phone‑verified. No fake profiles, no spam.</p>
          </div>
          <div className="text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2">Confidential Connections</h4>
            <p className="text-gray-500 text-sm">Your phone number stays private until you approve the contact. No spam WhatsApp groups.</p>
          </div>
          <div className="text-center">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2">Karachi Specialists</h4>
            <p className="text-gray-500 text-sm">Built by Karachi locals. We know the neighborhoods, the universities, and the culture.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        © 2026 Gharzaroor.pk – Har zaroorat ka ek ghar. Built with 💜 for Karachi.
      </footer>

      {/* ────────── AUTH MODAL ────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-end p-4">
              <button onClick={closeAuthModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-8">
              {/* LOGIN */}
              {modalView === 'login' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
                  <p className="text-sm text-gray-500 mb-6">Welcome back!</p>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <button type="button" onClick={() => setModalView('forgot')} className="text-sm text-indigo-600 hover:underline">
                        Forgot Password?
                      </button>
                    </div>
                    <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-70">
                      {authLoading ? 'Logging in...' : 'Login'}
                    </button>
                  </form>

                  <div className="my-6 flex items-center gap-3">
                    <div className="flex-1 border-t"></div><span className="text-xs text-gray-400">OR</span><div className="flex-1 border-t"></div>
                  </div>

                  <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>

                  <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{' '}
                    <button onClick={() => setModalView('register')} className="text-indigo-600 font-medium hover:underline">
                      Register Now
                    </button>
                  </p>
                </>
              )}

              {/* FORGOT PASSWORD – email */}
              {modalView === 'forgot' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h2>
                  <p className="text-sm text-gray-500 mb-6">Enter your email to receive a verification code.</p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-70">
                      {authLoading ? 'Sending...' : 'Send Code'}
                    </button>
                  </form>
                  <p className="text-center text-sm text-gray-500 mt-6">
                    <button onClick={() => setModalView('login')} className="text-indigo-600 font-medium hover:underline">Back to login</button>
                  </p>
                </>
              )}

              {/* FORGOT – verify OTP */}
              {modalView === 'forgot-otp' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Code</h2>
                  <p className="text-sm text-gray-500 mb-6">We sent a 6‑digit code to {email}</p>
                  <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-70">
                      {authLoading ? 'Verifying...' : 'Verify'}
                    </button>
                  </form>
                </>
              )}

              {/* FORGOT – set new password */}
              {modalView === 'forgot-reset' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                  <form onSubmit={handleForgotResetPassword} className="space-y-4">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-70">
                      {authLoading ? 'Updating...' : 'Set Password'}
                    </button>
                  </form>
                </>
              )}

              {/* REGISTER */}
              {modalView === 'register' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h2>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-70">
                      {authLoading ? 'Creating...' : 'Create Account'}
                    </button>
                  </form>
                  <div className="my-6 flex items-center gap-3"><div className="flex-1 border-t"></div><span className="text-xs text-gray-400">OR</span><div className="flex-1 border-t"></div></div>
                  <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25..." fill="#4285F4"/><path d="M12 23..." fill="#34A853"/><path d="M5.84 14.09..." fill="#FBBC05"/><path d="M12 5.38..." fill="#EA4335"/></svg>
                    Continue with Google
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <button onClick={() => setModalView('login')} className="text-indigo-600 font-medium hover:underline">Sign in</button>
                  </p>
                </>
              )}

              {/* REGISTER – verify OTP */}
              {modalView === 'register-verify' && (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                  <p className="text-sm text-gray-500 mb-6">We sent a code to {email}</p>
                  <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-70">
                      {authLoading ? 'Verifying...' : 'Verify & Finish'}
                    </button>
                  </form>
                </>
              )}

              {authError && <p className="text-red-500 text-sm mt-4">{authError}</p>}
              {authMessage && <p className="text-emerald-600 text-sm mt-4">{authMessage}</p>}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}