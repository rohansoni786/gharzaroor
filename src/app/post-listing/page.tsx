'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, X, ImagePlus } from 'lucide-react'
import { CONFIG } from '@/config'

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth')
      }
    })
  }, [router])

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    },
  })

    // eslint-disable-next-line react-hooks/incompatible-library
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

    const payload = {
      owner_id: user.id,
      title: data.title,
      rent: data.rent,
      beds_available: data.beds_available,
      gender_preference: data.gender_preference,
      photos: photoUrls,
      amenities: data.amenities || [],
      description: data.description || '',
      status: 'live',
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
    setUploading(false)
    router.push(`/listings/${listing.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Free Listing</h1>
      <p className="text-gray-500 mb-8">
        Your listing goes live instantly. Phone‑verified owners can see your contact.
      </p>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            {...register('title')}
            placeholder='e.g. "1 Bed in shared flat near KU, WiFi included"'
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          )}

          {errors.area_id && <p className="text-red-500 text-xs mt-1">{errors.area_id.message}</p>}
          {errors.custom_area && <p className="text-red-500 text-xs mt-1">{errors.custom_area.message}</p>}
          {errors.area_type && <p className="text-red-500 text-xs mt-1">Please select an option</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rent (PKR/month)</label>
            <input
              type="number"
              {...register('rent')}
              placeholder="12000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beds Available</label>
            <input
              type="number"
              {...register('beds_available')}
              placeholder="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.beds_available && <p className="text-red-500 text-xs mt-1">{errors.beds_available.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender Preference</label>
          <select
            {...register('gender_preference')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Choose...</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
            <option value="any">Any Gender</option>
          </select>
          {errors.gender_preference && <p className="text-red-500 text-xs mt-1">{errors.gender_preference.message}</p>}
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Extra details about the flat, house rules, etc."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Photos (max {CONFIG.MAX_PHOTOS})</label>
          <div className="flex gap-4 flex-wrap">
            {photos.map((file, idx) => (
              <div key={idx} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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

        <button
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
        </button>

        <p className="text-center text-xs text-gray-400">
          ✅ Your listing goes live instantly. Only verified seekers can contact you.
        </p>
      </form>
    </div>
  )
}