'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    api.getCurrentUser()
      .then(userData => {
        auth.setAuth(userData)
      })
      .catch(() => {
        auth.logout()
        router.push('/auth')
      })
  }, [])

  return <>{children}</>
}