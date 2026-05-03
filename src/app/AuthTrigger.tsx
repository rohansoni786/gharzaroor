'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export function AuthTrigger({ 
  onRedirectSet, 
  onModalOpen, 
  onModalViewSet 
}: {
  onRedirectSet: (redirect: string | null) => void
  onModalOpen: () => void
  onModalViewSet: (view: string) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login') {
      const redirect = searchParams.get('redirect')
      if (redirect) {
        onRedirectSet(decodeURIComponent(redirect))
      }
      onModalOpen()
      onModalViewSet('login')
    }
  }, [searchParams, onRedirectSet, onModalOpen, onModalViewSet])
  
  return null
}

