'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CONFIG } from '@/lib/constants'

const wantedSchema = z.object({
  area_type: z.enum(['preset', 'other']),
  area_id: z.string().uuid('Select a landmark').optional(),
  custom_area: z.string().optional(),
  rent_min: z.coerce.number().min(CONFIG.MIN_RENT, `Min PKR ${CONFIG.MIN_RENT}`).max(CONFIG.MAX_RENT, `Max PKR ${CONFIG.MAX_RENT}`),
  rent_max: z.coerce.number().min(CONFIG.MIN_RENT, `Min PKR ${CONFIG.MIN_RENT}`).max(CONFIG.MAX_RENT, `Max PKR ${CONFIG.MAX_RENT}`),
  beds_needed: z.coerce.number().min(CONFIG.MIN_BEDS).max(CONFIG.MAX_BEDS),
  gender_preference: z.enum(['male', 'female', 'any']),
  description: z.string().optional(),
  contact_phone: z.string().optional(),
}).refine(data => data.rent_max >= data.rent_min, {
  message: 'Max rent must be >= min rent',
  path: ['rent_max'],
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

type WantedFormData = z.infer<typeof wantedSchema>

export default function PostWantedPage() {
  const router = useRouter()
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/auth')
    })
  }, [router])

  const { register, handleSubmit, formState: { errors }, watch } = useForm<WantedFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(wantedSchema) as any,
    defaultValues: {
      area_type: 'preset',
      rent_min: 0,
      rent_max: 0,
      beds_needed: 1,
      gender_preference: 'any',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
const areaType = watch('area_type')

  useEffect(() => {
    supabase.from('areas').select('id, name').order('name').then(({ data }) => {
      if (data) setAreas(data)
    })
  }, [])

  const onSubmit = async (data: WantedFormData) => {
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      return
    }

    setSubmitting(true)

    const payload = {
      seeker_id: user.id,
      contact_phone: data.contact_phone?.trim() || null,
      area_id: data.area_type === 'preset' ? data.area_id : null,
      custom_area: data.area_type === 'other' ? data.custom_area : null,
      rent_min: data.rent_min,
      rent_max: data.rent_max,
      beds_needed: data.beds_needed,
      gender_preference: data.gender_preference,
      description: data.description || '',
      status: 'active',
    }

    const { error: insertError } = await supabase
      .from('wanted_ads')
      .insert(payload)

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    router.push('/wanted')
  }

return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Room Request</h1>
      <p className="text-gray-500 mb-8">Let owners know what you need.</p>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <motion.form 
        onSubmit={handleSubmit(onSubmit)} 
        whileHover={{ scale: 1.01 }}
        className="space-y-8 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/20"
      >
        {/* Area Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Area</label>
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
            <select {...register('area_id')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50">
              <option value="">Select a landmark...</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          ) : (
            <input
              {...register('custom_area')}
              maxLength={CONFIG.LANDMARK_CHAR_MAX}
              placeholder="Enter your landmark"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50"
            />
          )}
          {errors.custom_area && <p className="text-red-500 text-xs mt-1">{errors.custom_area.message}</p>}
        </div>

        {/* Rent Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rent (PKR)</label>
            <input type="number" {...register('rent_min')} placeholder="8000" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50" />
            {errors.rent_min && <p className="text-red-500 text-xs mt-1">{errors.rent_min.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Rent (PKR)</label>
            <input type="number" {...register('rent_max')} placeholder="15000" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50" />
            {errors.rent_max && <p className="text-red-500 text-xs mt-1">{errors.rent_max.message}</p>}
          </div>
        </div>

        {/* Beds Needed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beds Needed</label>
          <input type="number" {...register('beds_needed')} placeholder="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50" />
          {errors.beds_needed && <p className="text-red-500 text-xs mt-1">{errors.beds_needed.message}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender Preference</label>
          <select {...register('gender_preference')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50">
            <option value="any">Any Gender</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
          </select>
          {errors.gender_preference && <p className="text-red-500 text-xs mt-1">{errors.gender_preference.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Any extra requirements..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50"
          />
        </div>

        {/* Contact Phone (optional - hidden) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone (optional)</label>
          <input
            {...register('contact_phone')}
            placeholder="03XX-XXXXXXX"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50"
          />
          <p className="text-xs text-gray-400 mt-1">Extra number for this request (admin only).</p>
        </div>

        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:opacity-70"
        >
          {submitting ? 'Posting...' : 'Post Request'}
        </motion.button>
      </motion.form>
    </motion.div>
  )
}