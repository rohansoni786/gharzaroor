'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { X, Eye, EyeOff, ArrowLeft } from 'lucide-react'

type ModalView = 'login' | 'register' | 'register-verify' | 'forgot-password' | 'forgot-verify'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  redirectAfterLogin?: string | null
}

export default function AuthModal({ isOpen, onClose, redirectAfterLogin }: AuthModalProps) {
  const router = useRouter()
  const [modalView, setModalView] = useState<ModalView>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  // Store the phone temporarily during registration for later use after OTP
  const [pendingPhone, setPendingPhone] = useState('')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setPhone('')
    setOtp('')
    setError('')
    setLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })
    if (error) setError(error.message)
    else {
      handleClose()
      router.push(redirectAfterLogin || '/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  // ── Register (step 1: create account & send OTP) ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const phoneClean = phone.trim()
    if (!phoneClean.match(/^03[0-4][0-9]{8}$/)) {
      setError('Invalid phone format (03XX-XXXXXXX)')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { data: { full_name: name, phone: phoneClean } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // The trigger created the profile; we'll update phone after OTP
    // Send OTP to verify email
    const { error: otpError } = await supabase.auth.signInWithOtp({ email })

    if (otpError) {
      setError('Account created, but failed to send verification code: ' + otpError.message)
      setLoading(false)
      return
    }

    setPendingPhone(phoneClean)
    setError('We sent a verification code to your email. Please enter it below.')
    setModalView('register-verify')
    setLoading(false)
  }

  // ── Verify OTP after registration ──
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Now update the profile with full name and phone
    const { data: { user } } = await supabase.auth.getUser()
    if (user && pendingPhone) {
      await supabase
        .from('profiles')
        .update({ full_name: name.trim(), phone_number: pendingPhone })
        .eq('id', user.id)
    }

    handleClose()
    router.push(redirectAfterLogin || '/dashboard')
    router.refresh()
  }

  // ── Forgot Password (send OTP) ──
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: { shouldCreateUser: false },
    })

    if (error) setError(error.message)
    else {
      setError('A verification code was sent to your email.')
      setModalView('forgot-verify')
    }
    setLoading(false)
  }

  // ── Forgot Password – Verify OTP & reset password ──
  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })

    if (error) setError(error.message)
    else {
      // Now set new password using updateUser
      const { error: pwError } = await supabase.auth.updateUser({ password })
      if (pwError) {
        setError(pwError.message)
      } else {
        setError('Password reset successful! You may now login.')
        setModalView('login')
      }
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-gray-900">
              {modalView === 'login' && 'Welcome Back'}
              {modalView === 'register' && 'Create Account'}
              {modalView === 'register-verify' && 'Verify Your Email'}
              {modalView === 'forgot-password' && 'Reset Password'}
              {modalView === 'forgot-verify' && 'Enter Code & New Password'}
            </h3>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all" aria-label="Close modal">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${error.includes('OTP') || error.includes('reset') || error.includes('code') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* LOGIN */}
          {modalView === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-indigo-700 disabled:opacity-50 shadow-lg">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="text-center py-2">
                <button type="button" onClick={() => setModalView('forgot-password')} className="text-sm text-indigo-600 hover:text-indigo-700 underline">Forgot password?</button>
              </div>
              <div className="text-center pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setModalView('register')} className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">Don't have an account? Create one</button>
              </div>
            </form>
          )}

          {/* REGISTER */}
          {modalView === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))} placeholder="03XX-XXXXXXX" pattern="03[0-4][0-9]{8}" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
                <p className="text-xs text-gray-500 mt-1">Required for security and contact purposes</p>
              </div>
              <button type="submit" disabled={loading || !phone.match(/^03[0-4][0-9]{8}$/)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-indigo-700 disabled:opacity-50 shadow-lg">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setModalView('login')} className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">Already have an account? Sign in</button>
              </div>
            </form>
          )}

          {/* REGISTER – verify OTP */}
          {modalView === 'register-verify' && (
            <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
              <p className="text-sm text-gray-600">We sent a 6‑digit code to {email}</p>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center tracking-widest focus:ring-2 focus:ring-indigo-500" required />
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-indigo-700 disabled:opacity-50 shadow-lg">
                {loading ? 'Verifying...' : 'Verify & Finish'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {modalView === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600">Enter your email to receive a verification code.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" required />
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-indigo-700 disabled:opacity-50 shadow-lg">
                {loading ? 'Sending...' : 'Send Code'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setModalView('login')} className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">Back to Sign In</button>
              </div>
            </form>
          )}

          {/* FORGOT – verify OTP & set new password */}
          {modalView === 'forgot-verify' && (
            <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
              <p className="text-sm text-gray-600">Enter the code sent to {email} and your new password.</p>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6‑digit code" maxLength={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center tracking-widest focus:ring-2 focus:ring-indigo-500" required />
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-indigo-700 disabled:opacity-50 shadow-lg">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}