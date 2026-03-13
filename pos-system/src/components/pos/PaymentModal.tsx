'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, CreditCard, Smartphone, Check, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ReceiptModal } from './ReceiptModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaymentEntry {
  method: 'CASH' | 'MOBILE_MONEY' | 'CARD'
  amount: number
  details: any
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { items, customerId, discount, discountType, clearCart, calculateTotals } = useCartStore()
  const { profile } = useAuthStore()
  const [currentMethod, setCurrentMethod] = useState('CASH')
  const [isLoading, setIsLoading] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [momoNetwork, setMomoNetwork] = useState('MTN')
  const [momoRef, setMomoRef] = useState('')
  const [cardRef, setCardRef] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)
  
  const [payments, setPayments] = useState<PaymentEntry[]>([])

  const supabase = createClient()
  const { subtotal, discountAmount, taxAmount, total } = calculateTotals()
  
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingBalance = Math.max(0, total - paidAmount)
  const change = Math.max(0, (currentMethod === 'CASH' ? (parseFloat(amountInput) || 0) : 0) - remainingBalance)

  // Auto-fill amount input with remaining balance when tab changes
  const handleTabChange = (val: string) => {
    setCurrentMethod(val)
    setAmountInput(remainingBalance.toString())
  }

  const addPayment = () => {
    const amount = parseFloat(amountInput)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > remainingBalance && currentMethod !== 'CASH') {
      toast.error('Amount exceeds remaining balance')
      return
    }

    // For cash, the actual payment amount is what was due, unless they paid less
    const actualAppliedAmount = Math.min(amount, remainingBalance)

    let details = {}
    if (currentMethod === 'MOBILE_MONEY') {
      if (!momoRef) { toast.error('Enter reference'); return }
      details = { network: momoNetwork, reference: momoRef }
    } else if (currentMethod === 'CARD') {
      if (!cardRef) { toast.error('Enter reference'); return }
      details = { reference: cardRef }
    } else {
      details = { amount_tendered: amount, change: amount > remainingBalance ? amount - remainingBalance : 0 }
    }

    const newPayment: PaymentEntry = {
      method: currentMethod as any,
      amount: actualAppliedAmount,
      details
    }

    setPayments([...payments, newPayment])
    setAmountInput('')
    setMomoRef('')
    setCardRef('')
    toast.success('Payment added')
  }

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const handleCheckout = async () => {
    if (!profile) return
    
    if (paidAmount < total) {
      // If they haven't added any payments but the current input is valid, auto-add it
      if (payments.length === 0 && parseFloat(amountInput) >= total) {
        // Handled below by finalPayments logic
      } else {
        toast.error('Balance not fully paid')
        return
      }
    }

    setIsLoading(true)
    try {
      // 1. Create Sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: customerId,
          user_id: profile.id,
          subtotal,
          discount_amount: discountAmount,
          discount_type: discountType,
          tax_amount: taxAmount,
          total_amount: total,
          status: 'COMPLETED',
        })
        .select()
        .single()

      if (saleError) throw saleError

      // 2. Create Sale Items
      const saleItems = items.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.cartQuantity,
        unit_price: item.price,
        subtotal: item.price * item.cartQuantity,
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      // 3. Create Payments
      const finalPayments = payments.length > 0 ? payments : [{
        method: currentMethod as any,
        amount: total,
        details: currentMethod === 'CASH' 
          ? { amount_tendered: parseFloat(amountInput), change } 
          : (currentMethod === 'MOBILE_MONEY' ? { network: momoNetwork, reference: momoRef } : { reference: cardRef })
      }]

      for (const p of finalPayments) {
        const { error: paymentError } = await supabase.from('payments').insert({
          sale_id: sale.id,
          amount: p.amount,
          method: p.method,
          provider_reference: p.details.reference || null,
          details: p.details,
        })
        if (paymentError) throw paymentError
      }

      // 4. Update Product Stock & Notifications
      for (const item of items) {
        const newQuantity = item.quantity - item.cartQuantity
        await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.id)

        if (newQuantity <= item.low_stock_threshold) {
          await supabase.from('notifications').insert({
            title: 'Low Stock Alert',
            message: `${item.name} is low on stock (${newQuantity} remaining)`,
            type: newQuantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          })
        }
      }

      // 5. Update Loyalty
      if (customerId) {
        const pointsEarned = Math.floor(total / 10)
        const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single()
        const newPoints = (cust?.loyalty_points || 0) + pointsEarned
        const tier = newPoints >= 1000 ? 'GOLD' : (newPoints >= 500 ? 'SILVER' : 'BRONZE')
        await supabase.from('customers').update({ loyalty_points: newPoints, tier }).eq('id', customerId)
      }

      // 6. Audit Log
      await supabase.from('audit_logs').insert({
        user_id: profile.id,
        action: 'CREATE_SALE',
        entity_type: 'SALE',
        entity_id: sale.id,
        new_data: { sale, payments: finalPayments },
      })

      setLastSaleId(sale.id)
      setShowReceipt(true)
      toast.success('Sale completed successfully')
    } catch (error: any) {
      console.error(error)
      toast.error('Failed to complete sale: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetAndClose = () => {
    setAmountInput('')
    setMomoRef('')
    setCardRef('')
    setPayments([])
    setShowReceipt(false)
    clearCart()
    onClose()
  }

  if (showReceipt && lastSaleId) {
    return (
      <ReceiptModal
        isOpen={showReceipt}
        onClose={resetAndClose}
        saleId={lastSaleId}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalize Payment</DialogTitle>
          <DialogDescription>
            You can split payments across multiple methods
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 border-b">
          <div className="text-center border-r">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Due</p>
            <h2 className="text-xl font-black">{formatCurrency(total)}</h2>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Remaining</p>
            <h2 className={`text-xl font-black ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(remainingBalance)}
            </h2>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="space-y-2 py-2">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Applied Payments</p>
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 p-2 rounded-md border">
                <div className="flex items-center gap-2">
                  {p.method === 'CASH' && <Banknote className="h-3 w-3" />}
                  {p.method === 'MOBILE_MONEY' && <Smartphone className="h-3 w-3" />}
                  {p.method === 'CARD' && <CreditCard className="h-3 w-3" />}
                  <span className="text-sm font-medium">{p.method.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{formatCurrency(p.amount)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removePayment(i)}>
                    <Check className="h-3 w-3 rotate-45" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {remainingBalance > 0 && (
          <div className="mt-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <Tabs value={currentMethod} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid grid-cols-3 w-full h-10 mb-4">
                <TabsTrigger value="CASH">Cash</TabsTrigger>
                <TabsTrigger value="MOBILE_MONEY">MoMo</TabsTrigger>
                <TabsTrigger value="CARD">Card</TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Amount to Apply</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="text-xl h-12 pl-10 font-bold"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₵</div>
                  </div>
                </div>

                <TabsContent value="MOBILE_MONEY" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Network</Label>
                      <Select value={momoNetwork} onValueChange={setMomoNetwork}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTN">MTN</SelectItem>
                          <SelectItem value="Telecel">Telecel</SelectItem>
                          <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Reference</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="ID"
                        value={momoRef}
                        onChange={(e) => setMomoRef(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="CARD" className="mt-0 space-y-2">
                  <Label className="text-[10px]">POS Approval Ref</Label>
                  <Input
                    className="h-8 text-xs"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                  />
                </TabsContent>

                {currentMethod === 'CASH' && change > 0 && (
                  <div className="flex justify-between items-center px-2 py-1 bg-green-50 rounded text-green-700">
                    <span className="text-[10px] font-bold">Change:</span>
                    <span className="text-xs font-black">{formatCurrency(change)}</span>
                  </div>
                )}

                <Button type="button" className="w-full h-10" variant="secondary" onClick={addPayment}>
                  Apply {currentMethod.replace('_', ' ')} Payment
                </Button>
              </div>
            </Tabs>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            className="flex-[2] h-12 font-bold text-lg" 
            onClick={handleCheckout} 
            disabled={isLoading || (remainingBalance > 0 && payments.length > 0) || (payments.length === 0 && (parseFloat(amountInput) || 0) < total)}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
            {remainingBalance === 0 ? 'Complete Sale' : 'Pay in Full'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
