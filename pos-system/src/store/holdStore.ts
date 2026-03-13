import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem } from '@/types'

interface Heldcourt {
  id: string
  items: CartItem[]
  customerId: string | null
  discount: number
  discountType: 'PERCENTAGE' | 'FIXED'
  createdAt: number
  label: string
}

interface HoldState {
  heldCarts: Heldcourt[]
  holdCurrentCart: (items: CartItem[], customerId: string | null, discount: number, discountType: 'PERCENTAGE' | 'FIXED', label: string) => void
  resumeCart: (id: string) => Heldcourt | undefined
  deleteHeldCart: (id: string) => void
}

export const useHoldStore = create<HoldState>()(
  persist(
    (set, get) => ({
      heldCarts: [],
      
      holdCurrentCart: (items, customerId, discount, discountType, label) => {
        const newHeldCart: Heldcourt = {
          id: Math.random().toString(36).substring(7),
          items: JSON.parse(JSON.stringify(items)), // Deep clone
          customerId,
          discount,
          discountType,
          createdAt: Date.now(),
          label: label || `Order #${get().heldCarts.length + 1}`
        }
        set({ heldCarts: [...get().heldCarts, newHeldCart] })
      },

      resumeCart: (id) => {
        const cart = get().heldCarts.find(c => c.id === id)
        if (cart) {
          set({ heldCarts: get().heldCarts.filter(c => c.id !== id) })
        }
        return cart
      },

      deleteHeldCart: (id) => {
        set({ heldCarts: get().heldCarts.filter(c => c.id !== id) })
      },
    }),
    {
      name: 'pos-held-carts',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
