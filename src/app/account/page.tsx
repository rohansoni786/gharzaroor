'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Phone, Lock, ImageIcon, User, Mail } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { motion } from 'framer-motion'

const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      if (img.width <= 300) {
        resolve(file)
        return
      }
      const canvas = document.createElement('canvas')
      const ratio = 300 / img.width
      canvas.width = 300
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          const resized = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
          resolve(resized)
        } else {
          reject(new Error('Resize failed'))
        }
      }, 'image/jpeg', 0.8)
    }
    img.onerror = reject
  })
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [occupation, setOccupation] = useState<'student' | 'professional' | 'both' | ''>('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUser(user)
      setEmail(user.email || '')
      setFullName(user.user_metadata?.full_name || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setPhone(profile.phone_number || '')
        setWhatsapp(profile.whatsapp_number || '')
        setAge(profile.age || '')
        setEmergencyContact(profile.emergency_contact || '')
        setOccupation(profile.occupation || '')
        if (profile.avatar_url) {
          setAvatarPreview(profile.avatar_url)
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file)
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    if (!user) return

    let avatarUrl = avatarPreview
    if (avatarFile) {
      try {
        const resized = await resizeImage(avatarFile)
        const fileName = `${user.id}/avatar.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, resized, { upsert: true, contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        avatarUrl = publicUrl
      } catch (err) {
        setMessage((err as Error).message)
        setSaving(false)
        return
      }
    }

    const payload = {
      id: user.id,
      full_name: fullName.trim() || null,
      phone_number: phone.trim() || null,
      whatsapp_number: whatsapp.trim() || null,
      age: age === '' ? null : Number(age),
      emergency_contact: emergencyContact.trim() || null,
      occupation: occupation === '' ? null : occupation,
      avatar_url: avatarUrl || null,
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Profile updated successfully!')
      setAvatarFile(null)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <User className="w-8 h-8" />
        Profile Settings
      </h1>
      <p className="text-gray-500 mb-8">Complete your profile for better matches.</p>

      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            message.includes('Error')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {message}
        </motion.div>
      )}

      <form onSubmit={handleSave} className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/20 space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Profile Picture</label>
          <div className="flex gap-4 items-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                  Add photo
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <input id="avatar" type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
              <label htmlFor="avatar" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 cursor-pointer flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Choose Photo
              </label>
              <p className="text-xs text-gray-500 mt-1">300x300 recommended, auto-resized</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" /> Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Phone & WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+923001234567"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">For calls & SMS</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-green-500" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+923001234567"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">For WhatsApp contact</p>
          </div>
        </div>

        {/* Age & Occupation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Age (optional)</label>
            <input
              type="number"
              min={16}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="25"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Occupation</label>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="both">Student &amp; Working</option>
            </select>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact (optional)</label>
          <input
            type="tel"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="03XX-XXXXXXX"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">For safety verification</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Update Profile
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}