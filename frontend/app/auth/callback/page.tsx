'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'

export default function Callback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const auth = useAuth()

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token')

      if (token) {
        try {
          // Authenticate with the backend
          await api.googleAuth(token)

          // Fetch the current user
          const userData = await api.getCurrentUser()
          auth.setAuth(userData)

          toast({
            title: 'Successfully authenticated',
            description: `Welcome back, ${userData.name}!`,
            variant: 'default',
          })

          router.push('/')
        } catch (error) {
          toast({
            title: 'Authentication failed',
            description: 'Unable to fetch user data. Please try again.',
            variant: 'destructive',
          })
          console.error(error)
          router.push('/auth')
        }
      } else {
        toast({
          title: 'Authentication failed',
          description: 'No token found. Please try signing in again.',
          variant: 'destructive',
        })
        router.push('/auth')
      }
    }

    handleAuth()
  }, [searchParams, auth, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Processing authentication...</p>
    </div>
  )
}