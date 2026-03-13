'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { stockAdjustmentSchema, type StockAdjustmentFormValues } from '@/lib/validations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Product } from '@/types'

interface StockAdjustmentModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StockAdjustmentModal({
  product,
  open,
  onOpenChange,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema) as any,
    defaultValues: {
      type: 'ADD',
      quantity: 1,
      reason: '',
    },
  })

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  useEffect(() => {
    if (open && product?.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id)
    } else {
      setSelectedVariantId(null)
    }
  }, [open, product])

  useEffect(() => {
    if (open) {
      form.reset({
        type: 'ADD',
        quantity: 1,
        reason: '',
      })
    }
  }, [open, form])

  const onSubmit = async (values: StockAdjustmentFormValues) => {
    if (!product) return
    setLoading(true)

    try {
      // 1. Update stock (Product or Variant)
      let updateData: any = {}
      let oldStock = product.quantity
      let newStock = product.quantity

      if (selectedVariantId && product.variants) {
        const updatedVariants = product.variants.map(v => {
          if (v.id === selectedVariantId) {
            oldStock = v.quantity
            let vNextQty = v.quantity
            if (values.type === 'ADD') vNextQty += values.quantity
            else if (values.type === 'REMOVE') vNextQty -= values.quantity
            else vNextQty = values.quantity

            if (vNextQty < 0) throw new Error('Variant quantity cannot be negative')
            newStock = vNextQty
            return { ...v, quantity: vNextQty }
          }
          return v
        })
        updateData = { variants: updatedVariants }
      } else {
        if (values.type === 'ADD') newStock += values.quantity
        else if (values.type === 'REMOVE') newStock -= values.quantity
        else newStock = values.quantity

        if (newStock < 0) throw new Error('Quantity cannot be negative')
        updateData = { quantity: newStock }
      }

      const { error: productError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)

      if (productError) throw productError

      // 2. Log the adjustment
      const { error: auditError } = await supabase.from('audit_logs').insert([
        {
          entity_type: 'PRODUCT',
          entity_id: product.id,
          action: 'STOCK_ADJUSTMENT',
          old_data: { 
            quantity: oldStock, 
            variant_id: selectedVariantId 
          },
          new_data: { 
            quantity: newStock, 
            adjustment_type: values.type, 
            adjustment_value: values.quantity,
            reason: values.reason,
            variant_id: selectedVariantId
          },
        },
      ])

      if (auditError) console.error('Audit log failed:', auditError.message)

      toast.success('Stock adjusted successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {product?.name} (Current: {product && (selectedVariantId ? product.variants?.find(v => v.id === selectedVariantId)?.quantity : product.quantity)})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {product?.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Select Variant to Adjust</FormLabel>
                <Select
                  value={selectedVariantId || ''}
                  onValueChange={setSelectedVariantId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {product.variants.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} (Current: {v.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADD">Add Stock (+)</SelectItem>
                      <SelectItem value="REMOVE">Remove Stock (-)</SelectItem>
                      <SelectItem value="SET">Set Explicit Value (=)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. Damascus shipments, Spoiled goods, Inventory count" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adjusting...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
