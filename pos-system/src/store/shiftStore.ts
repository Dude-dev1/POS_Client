import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Shift } from '@/types'

interface ShiftState {
  currentShift: Shift | null
  setCurrentShift: (shift: Shift | null) => void
  isShiftOpen: () => boolean
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      currentShift: null,
      setCurrentShift: (shift) => set({ currentShift: shift }),
      isShiftOpen: () => !!get().currentShift && get().currentShift?.status === 'OPEN',
    }),
    {
      name: 'pos-shift-storage',
    }
  )
)
