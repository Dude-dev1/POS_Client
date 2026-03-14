'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/utils/formatCurrency'
import { toast } from 'react-hot-toast'
import { Loader2, RotateCcw, AlertCircle } from 'lucide-react'
import type { Sale, SaleItem } from '@/types'
import { useAuthStore } from '@/store/authStore'

interface ReturnModalProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ReturnModal({ sale, isOpen, onClose, onSuccess }: ReturnModalProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<(SaleItem & { product_name: string, returnQty: number })[]>([])
  const [reason, setReason] = useState('')
  const [fetchingItems, setFetchingItems] = useState(false)
  const { profile } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && sale) {
      fetchSaleItems()
    } else {
      setItems([])
      setReason('')
    }
  }, [isOpen, sale])

  const fetchSaleItems = async () => {
    if (!sale) return
    setFetchingItems(true)
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*, products(name)')
        .eq('sale_id', sale.id)

      if (error) throw error

      const formattedItems = data.map((item: any) => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product',
        returnQty: 0,
      }))
      setItems(formattedItems)
    } catch (error: any) {
      toast.error('Failed to fetch sale items')
      console.error(error)
    } finally {
      setFetchingItems(false)
    }
  }

  const handleQtyChange = (itemId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const maxAvailable = item.quantity - (item.quantity_returned || 0)
          const validQty = Math.max(0, Math.min(qty, maxAvailable))
          return { ...item, returnQty: validQty }
        }
        return item
      })
    )
  }

  const calculateRefundAmount = () => {
    return items.reduce((sum, item) => sum + (item.unit_price * item.returnQty), 0)
  }

  const handleSubmit = async () => {
    const refundAmount = calculateRefundAmount()
    const itemsToReturn = items.filter(i => i.returnQty > 0)

    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the return')
      return
    }

    setLoading(true)
    try {
      // 1. Create Return Record
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert([{
          sale_id: sale?.id,
          user_id: profile?.id,
          reason,
          amount_refunded: refundAmount
        }])
        .select()
        .single()

      if (returnError) throw returnError

      // 2. Update Sale Items (quantity_returned) and Inventory
      for (const item of itemsToReturn) {
        // Update sale_items
        const { error: itemUpdateError } = await supabase
          .from('sale_items')
          .update({ quantity_returned: (item.quantity_returned || 0) + item.returnQty })
          .eq('id', item.id)

        if (itemUpdateError) throw itemUpdateError

        // Restock inventory
        const { data: product } = await supabase
           .from('products')
           .select('quantity')
           .eq('id', item.product_id)
           .single()
        
        if (product) {
           await supabase
            .from('products')
            .update({ quantity: product.quantity + item.returnQty })
            .eq('id', item.product_id)
        }
      }

      // 3. Update Sale Status if all items returned (optional logic)
      // For now, we'll just keep it as is.

      // 4. Log Audit
      await supabase.from('audit_logs').insert([{
        user_id: profile?.id,
        action: 'RETURN_PROCESSED',
        entity_type: 'SALE',
        entity_id: sale?.id,
        new_data: { return_id: returnRecord.id, refund: refundAmount, items: itemsToReturn.map(i => ({ id: i.product_id, qty: i.returnQty })) }
      }])

      toast.success('Return processed successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to process return')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Process Return
          </DialogTitle>
          <DialogDescription>
            Select the items and quantities to be returned for Sale #{sale?.id.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
            {fetchingItems ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : items.length > 0 ? (
              items.map((item) => {
                const maxAvailable = item.quantity - (item.quantity_returned || 0)
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unit_price)} × {item.quantity} 
                        {item.quantity_returned > 0 && (
                          <span className="text-red-500 ml-1">({item.quantity_returned} already returned)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`qty-${item.id}`} className="sr-only">Quantity</Label>
                      <Input
                        id={`qty-${item.id}`}
                        type="number"
                        min="0"
                        max={maxAvailable}
                        value={item.returnQty}
                        onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-right"
                        disabled={maxAvailable === 0}
                      />
                      <span className="text-xs text-muted-foreground w-12">/ {maxAvailable}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-center py-4 text-muted-foreground italic">No items available for return.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Return</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Damaged item, Customer changed mind, Wrong product..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <AlertCircle className="h-4 w-4" />
              Refund Amount
            </div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(calculateRefundAmount())}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || calculateRefundAmount() === 0}
            className="shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Return'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
