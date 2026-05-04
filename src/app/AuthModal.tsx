'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { X, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

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

  const handleGoogleSignIn = async () => {
  if (redirectAfterLogin) {
    localStorage.setItem('redirectAfterLogin', redirectAfterLogin)
  }
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
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

    {/* OR divider */}
    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-gray-200"></div>
      <span className="text-xs text-gray-400">OR</span>
      <div className="flex-1 border-t border-gray-200"></div>
    </div>

    {/* Google Sign-In Button */}
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
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