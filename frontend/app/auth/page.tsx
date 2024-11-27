'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'

export default function SignIn() {
  const { user, isLoading, setAuth } = useAuth()
  const router = useRouter()
  const [authenticating, setAuthenticating] = useState(false)

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/')
    }
  }, [user, isLoading])

  const handleGoogleLogin = async (credentialResponse: any) => {
    const token = credentialResponse.credential

    if (token) {
      try {
        setAuthenticating(true)

        // Authenticate with the backend
        await api.googleAuth(token)

        // Fetch the current user
        const userData = await api.getCurrentUser()
        setAuth(userData)

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
      } finally {
        setAuthenticating(false)
      }
    } else {
      toast({
        title: 'Authentication failed',
        description: 'No credential returned. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading || authenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="space-y-4">
            <Skeleton className="w-32 h-8 mx-auto" />
            <Skeleton className="w-full h-10" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to continue to your account
          </p>
        </div>
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            toast({
              title: 'Authentication failed',
              description: 'Google sign-in error. Please try again.',
              variant: 'destructive',
            })
          }}
        />
      </Card>
    </div>
  )
}