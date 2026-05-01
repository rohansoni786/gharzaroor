'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [mode, setMode] = useState<'otp' | 'password'>('otp')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) { setError(error.message); setLoading(false); setCooldown(0) }
    else { setStep('otp'); setLoading(false); setCooldown(30) }
  }

  // OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) setError(error.message)
    else { router.push('/listings'); router.refresh() }
    setLoading(false)
  }

  // Password Sign-In
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) setError(error.message)
    else { router.push('/listings'); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Gharzaroor
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'otp'
            ? (step === 'email' ? 'Enter your email to receive a code.' : `Code sent to ${email}`)
            : 'Sign in with your email and password.'}
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        {/* Mode toggle */}
        <div className="flex mb-6 border rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'otp' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => { setMode('otp'); setStep('email'); setError('') }}
          >
            Email OTP
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${mode === 'password' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => { setMode('password'); setError('') }}
          >
            Password
          </button>
        </div>

        {/* OTP Flow */}
        {mode === 'otp' && step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <button
              type="submit" disabled={loading || cooldown > 0}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                cooldown > 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send login code'}
            </button>
          </form>
        )}

        {mode === 'otp' && step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
              placeholder="123456" maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setError(''); setOtp('') }} className="w-full text-indigo-600 text-sm hover:underline">
              ← Change email
            </button>
          </form>
        )}

        {/* Password Flow */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gharzaroor.pk"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          {mode === 'otp' ? 'No password needed – just an email code.' : 'Use your admin credentials.'}
        </p>
      </div>
    </div>
  )
}