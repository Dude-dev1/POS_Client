import { create } from 'zustand'
import { Profile, UserRole } from '@/types'

interface AuthState {
  profile: Profile | null
  role: UserRole | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  setLoading: (isLoading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  role: null,
  isLoading: true,
  setProfile: (profile) => set({ profile, role: profile?.role || null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () => set({ profile: null, role: null, isLoading: false }),
}))
