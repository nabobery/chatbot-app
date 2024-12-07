// frontend/types/auth.ts

export interface User {
  id: number
  email: string
  name: string
  image_url?: string
  auth_provider: string
}

export interface AuthContextType {
  user: User | null
  setAuth: (user: User | null) => void
  logout: () => void
  isLoading: boolean
}