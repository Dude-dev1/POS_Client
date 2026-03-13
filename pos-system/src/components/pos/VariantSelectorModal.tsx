'use client'

import { Product, ProductVariant } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatCurrency'
import { Package } from 'lucide-react'

interface VariantSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSelect: (variant: ProductVariant) => void
}

export function VariantSelectorModal({
  isOpen,
  onClose,
  product,
  onSelect,
}: VariantSelectorModalProps) {
  if (!product) return null

  const variants = product.variants || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Option</DialogTitle>
          <DialogDescription>
            Choose a variant for <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {variants.map((variant) => (
            <Button
              key={variant.id}
              variant="outline"
              className="h-auto flex flex-col items-start p-4 hover:border-primary hover:bg-primary/5 transition-all text-left"
              onClick={() => onSelect(variant)}
              disabled={variant.quantity <= 0}
            >
              <div className="w-full flex justify-between items-center mb-1">
                <span className="font-bold text-lg">{variant.name}</span>
                <span className="font-black text-primary">{formatCurrency(variant.price)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                <Package className="h-3 w-3" />
                <span>{variant.quantity} available</span>
                {variant.sku && (
                  <>
                    <span className="mx-1">•</span>
                    <span>SKU: {variant.sku}</span>
                  </>
                )}
              </div>
              {variant.quantity <= 0 && (
                <span className="text-[10px] text-destructive font-bold mt-1">OUT OF STOCK</span>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
