'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function AuthTrigger({
  onRedirectSet,
  onModalOpen,
}: {
  onRedirectSet: (redirect: string | null) => void
  onModalOpen: () => void
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login') {
      const redirect = searchParams.get('redirect')
      if (redirect) {
        onRedirectSet(decodeURIComponent(redirect))
      }
      onModalOpen()
    }
  }, [searchParams, onRedirectSet, onModalOpen])

  return null
}