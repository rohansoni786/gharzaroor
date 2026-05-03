'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { parseVacancyMessage } from '@/lib/parseVacancy'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, X, ImagePlus, MessageCircle, Zap } from 'lucide-react'
import { CONFIG } from '@/lib/constants'
import { motion } from 'framer-motion'

const listingSchema = z.object({
  title: z.string().min(5, 'Title too short').max(100),
  area_type: z.enum(['preset', 'other']),
  area_id: z.string().uuid('Select a landmark').optional(),
  custom_area: z.string().optional(),
  rent: z.coerce.number()
    .min(CONFIG.MIN_RENT, `Min PKR ${CONFIG.MIN_RENT.toLocaleString()}`)
    .max(CONFIG.MAX_RENT, `Max PKR ${CONFIG.MAX_RENT.toLocaleString()}`),
  beds_available: z.coerce.number()
    .min(CONFIG.MIN_BEDS, `At least ${CONFIG.MIN_BEDS} bed`)
    .max(CONFIG.MAX_BEDS, `Max ${CONFIG.MAX_BEDS} beds`),
  gender_preference: z.enum(['male', 'female', 'any']),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  phone: z.string().optional(),  // profile phone
  contact_phone: z.string().optional(),  // listing-specific hidden contact
}).refine(
  (data) => {
    if (data.area_type === 'preset') return !!data.area_id
    if (data.area_type === 'other') return !!data.custom_area && data.custom_area.trim().length > 0
    return false
  },
  { message: 'Please select a landmark or enter a custom one', path: ['custom_area'] }
).refine(
  (data) => {
    if (data.area_type === 'other' && data.custom_area) {
      return data.custom_area.length >= CONFIG.LANDMARK_CHAR_MIN && data.custom_area.length <= CONFIG.LANDMARK_CHAR_MAX
    }
    return true
  },
  { message: `Custom landmark must be ${CONFIG.LANDMARK_CHAR_MIN}-${CONFIG.LANDMARK_CHAR_MAX} characters`, path: ['custom_area'] }
)

type FormData = z.infer<typeof listingSchema>

const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      if (img.width <= CONFIG.PHOTO_MAX_WIDTH) {
        resolve(file)
        return
      }
      const canvas = document.createElement('canvas')
      const ratio = CONFIG.PHOTO_MAX_WIDTH / img.width
      canvas.width = CONFIG.PHOTO_MAX_WIDTH
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          const resized = new File([blob], file.name, { type: 'image/jpeg' })
          resolve(resized)
        } else {
          reject(new Error('Resize failed'))
        }
      }, 'image/jpeg', 0.8)
    }
    img.onerror = reject
  })
}

export default function PostListingPage() {
  const router = useRouter()
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  // Quick Post states
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [parseLoading, setParseLoading] = useState(false)
  const [parseSuccess, setParseSuccess] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth')
      }
    })
  }, [router])

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(listingSchema) as any,
    defaultValues: {
      area_type: 'preset',
      amenities: [],
      rent: 0,
      beds_available: 0,
      title: '',
      gender_preference: 'any',
      custom_area: '',
      description: '',
      area_id: undefined,
      phone: '',
    },
  })

  const areaType = watch('area_type')

  useEffect(() => {
    supabase.from('areas').select('id, name').order('name').then(({ data }) => {
      if (data) setAreas(data)
    })
  }, [])

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos = Array.from(files)
    const combined = [...photos, ...newPhotos].slice(0, CONFIG.MAX_PHOTOS)
    setPhotos(combined)
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormData) => {
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      return
    }

    setUploading(true)

    // Upload photos
    const photoUrls: string[] = []
    for (const file of photos) {
      try {
        const resized = await resizeImage(file)
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, resized, { contentType: 'image/jpeg', upsert: false })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(fileName)
        photoUrls.push(publicUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(`Photo upload failed: ${message}`)
        setUploading(false)
        return
      }
    }

    // Update user's profile phone if provided
    if (data.phone && data.phone.trim()) {
      await supabase
        .from('profiles')
        .update({ phone_number: data.phone.trim() })
        .eq('id', user.id)
    }

    // Prepare listing payload
    const payload = {
      owner_id: user.id,
      title: data.title,
      rent: data.rent,
      beds_available: data.beds_available,
      gender_preference: data.gender_preference,
      photos: photoUrls,
      amenities: data.amenities || [],
      description: data.description || '',
      contact_phone: data.contact_phone?.trim() || null,
      status: 'pending',
      area_id: data.area_type === 'preset' ? data.area_id : null,
      custom_area: data.area_type === 'other' ? data.custom_area : null,
    }

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setUploading(false)
      return
    }

    reset()
    setPhotos([])
    setWhatsappMessage('')
    setParseSuccess(false)
    setUploading(false)
    router.push(`/listings/${listing.id}`)
  }

  const handleQuickPost = useCallback(async () => {
    if (!whatsappMessage.trim()) return

    setParseLoading(true)
    setParseError(null)
    setParseSuccess(false)

    try {
      const parsed = await parseVacancyMessage(whatsappMessage)
      // Map to form
      setValue('title', parsed.title)
      setValue('rent', parsed.rent || 0)
      setValue('beds_available', parsed.beds)
      setValue('gender_preference', parsed.gender_preference)
      setValue('phone', parsed.contact || '')
      setValue('description', parsed.description)
      setValue('area_id', parsed.area_id || '')
      setValue('custom_area', parsed.custom_area || '')
      setValue('area_type', parsed.area_id ? 'preset' : 'other')
      setValue('amenities', parsed.amenities)
      setParseSuccess(true)
      setTimeout(() => setParseSuccess(false), 3000)
      // Scroll to form
      document.querySelector('input[name="title"]')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setParseError('Could not parse message. Please fill manually.')
    } finally {
      setParseLoading(false)
    }
  }, [whatsappMessage, setValue])

  const sampleMessage = "1 permanent vacancy available near tipu burger in dha phase 2 ext All facilities available Contact: 03323831999"

  const loadSample = () => {
    setWhatsappMessage(sampleMessage)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Free Listing</h1>
      <p className="text-lg font-medium text-indigo-600 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5" />
        Have a WhatsApp vacancy message? Use <span className="underline cursor-pointer hover:text-indigo-700" onClick={loadSample}>Quick Post</span>
      </p>

      {/* Quick Post UI */}
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-dashed border-indigo-200 mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">🚀 Quick Post – Paste WhatsApp Message</h2>
        </div>
        <textarea
          value={whatsappMessage}
          onChange={(e) => setWhatsappMessage(e.target.value)}
          placeholder="Paste raw WhatsApp vacancy message here..."
          rows={6}
          className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 resize-vertical bg-white/50 backdrop-blur-sm text-sm"
        />
        <motion.button
          onClick={handleQuickPost}
          disabled={parseLoading || !whatsappMessage.trim()}
          whileHover={{ scale: 1.02 }}
          className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {parseLoading ? (
            <span className="animate-spin w-5 h-5 border-2 border-white/30 rounded-full border-r-white" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          {parseLoading ? 'Parsing...' : 'Parse & Pre-fill Form'}
        </motion.button>
        {parseSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 p-4 bg-green-100 border border-green-300 rounded-xl text-green-800 text-sm font-medium flex items-center gap-2"
          >
            ✅ Details extracted! Review and submit.
          </motion.div>
        )}
        {parseError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 p-4 bg-red-100 border border-red-300 rounded-xl text-red-800 text-sm"
          >
            {parseError}
          </motion.div>
        )}
        <button
          type="button"
          onClick={loadSample}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium underline"
        >
          📱 Load Sample WhatsApp Message
        </button>
      </motion.div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 space-y-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              {...register('title')}
              placeholder='e.g. "1 Bed in shared flat near KU, WiFi included"'
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Area Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Nearest Landmark</label>
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-2">
                <input type="radio" value="preset" {...register('area_type')} className="text-indigo-600" />
                <span className="text-sm">Select from list</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="other" {...register('area_type')} className="text-indigo-600" />
                <span className="text-sm">Enter custom</span>
              </label>
            </div>

            {areaType === 'preset' ? (
              <select
                {...register('area_id')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
              >
                <option value="">Select a landmark...</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            ) : (
              <input
                {...register('custom_area')}
                maxLength={CONFIG.LANDMARK_CHAR_MAX}
                placeholder="Enter your landmark (e.g., 'Near ABC Hospital')"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
              />
            )}

            {errors.area_id && <p className="text-red-500 text-xs mt-1">{errors.area_id.message}</p>}
            {errors.custom_area && <p className="text-red-500 text-xs mt-1">{errors.custom_area.message}</p>}
            {errors.area_type && <p className="text-red-500 text-xs mt-1">Please select an option</p>}
          </div>

          {/* Rent & Beds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent (PKR/month)</label>
              <input
                type="number"
                {...register('rent')}
                placeholder="12000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
              />
              {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beds Available</label>
              <input
                type="number"
                {...register('beds_available')}
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
              />
              {errors.beds_available && <p className="text-red-500 text-xs mt-1">{errors.beds_available.message}</p>}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender Preference</label>
            <select
              {...register('gender_preference')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
            >
              <option value="">Choose...</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
              <option value="any">Any Gender</option>
            </select>
            {errors.gender_preference && <p className="text-red-500 text-xs mt-1">{errors.gender_preference.message}</p>}
          </div>

          {/* Profile Phone Number (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Phone Number (optional)</label>
            <input
              {...register('phone')}
              placeholder="03XX-XXXXXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Your main contact number (saved to profile).</p>
          </div>

          {/* Listing Contact Phone (optional - hidden from public) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Contact Phone (optional)</label>
            <input
              {...register('contact_phone')}
              placeholder="03XX-XXXXXXX or +92..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Extra number for this listing (visible only to you & admin).</p>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
            <div className="flex flex-wrap gap-3">
              {['wifi', 'ac', 'food', 'parking', 'laundry', 'furnished'].map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={item}
                    {...register('amenities')}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="capitalize">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Extra details about the flat, house rules, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/60 backdrop-blur-sm"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Photos (max {CONFIG.MAX_PHOTOS})</label>
            <div className="flex gap-4 flex-wrap">
              {photos.map((file, idx) => (
                <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < CONFIG.MAX_PHOTOS && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition text-gray-500">
                  <ImagePlus className="w-6 h-6 mb-1" />
                  <span className="text-xs">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Each photo resized to max {CONFIG.PHOTO_MAX_WIDTH}px. JPG only.</p>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isSubmitting || uploading}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⚪</span> Uploading & Publishing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" /> Post Live Listing
            </>
          )}
        </motion.button>

        <p className="text-center text-xs text-gray-400">
          ✅ Your listing goes live instantly. Only verified seekers can contact you.
        </p>
      </form>
    </motion.div>
  )
}