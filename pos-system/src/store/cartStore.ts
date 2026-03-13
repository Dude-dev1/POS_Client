import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartState {
  items: CartItem[]
  customerId: string | null
  discount: number
  discountType: 'FIXED' | 'PERCENTAGE'
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setItems: (items: CartItem[]) => void
  setCustomerId: (customerId: string | null) => void
  setDiscount: (discount: number, type: 'FIXED' | 'PERCENTAGE') => void
  calculateTotals: () => {
    subtotal: number
    discountAmount: number
    taxAmount: number
    total: number
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      discount: 0,
      discountType: 'FIXED',

      addItem: (product: Product) => {
        const items = get().items
        const existingItem = items.find((item) => item.id === product.id)

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, cartQuantity: item.cartQuantity + 1 }
                : item
            ),
          })
        } else {
          set({ items: [...items, { ...product, cartQuantity: 1 }] })
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((item) => item.id !== productId) })
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, cartQuantity: quantity } : item
          ),
        })
      },

      clearCart: () => set({ items: [], customerId: null, discount: 0, discountType: 'FIXED' }),

      setItems: (items) => set({ items }),

      setCustomerId: (customerId) => set({ customerId }),

      setDiscount: (discount, discountType) => set({ discount, discountType }),

      calculateTotals: () => {
        const { items, discount, discountType } = get()
        const subtotal = items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0)
        
        let discountAmount = 0
        if (discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * discount) / 100
        } else {
          discountAmount = discount
        }

        const taxableAmount = subtotal - discountAmount
        const taxRate = 0.15 // 15% VAT from settings (default)
        const taxAmount = taxableAmount * taxRate
        const total = taxableAmount + taxAmount

        return {
          subtotal,
          discountAmount,
          taxAmount,
          total,
        }
      },
    }),
    {
      name: 'pos-cart-storage',
    }
  )
)
