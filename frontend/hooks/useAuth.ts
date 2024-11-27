import { create } from 'zustand'
import { AuthContextType } from '@/types/auth'

export const useAuth = create<AuthContextType>()((set) => ({
  user: null,
  isLoading: true,
  setAuth: (user) => set({ user, isLoading: false }),
  logout: () => {
    set({ user: null, isLoading: false })
  },
}))