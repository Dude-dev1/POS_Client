'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useShiftStore } from '@/store/shiftStore'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Wallet, 
  Clock, 
  FileText,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ShiftManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShiftManagementModal({ isOpen, onClose }: ShiftManagementModalProps) {
  const { profile } = useAuthStore()
  const { currentShift, setCurrentShift } = useShiftStore()
  const [openingCash, setOpeningCash] = useState('0')
  const [closingCashActual, setClosingCashActual] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shiftStats, setShiftStats] = useState({
    totalSales: 0,
    paymentMethods: { CASH: 0, MOBILE_MONEY: 0, CARD: 0 },
    expectedCash: 0,
  })

  const supabase = createClient()

  // Fetch stats if shift is open
  useEffect(() => {
    if (isOpen && currentShift) {
      fetchShiftStats()
    }
  }, [isOpen, currentShift])

  const fetchShiftStats = async () => {
    if (!currentShift) return
    
    // 1. Get all sales for this shift
    const { data: sales } = await supabase
      .from('sales')
      .select('id, total_amount')
      .eq('shift_id', currentShift.id)
    
    // 2. Get all payments for these sales
    const saleIds = (sales || []).map(s => s.id)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, method')
      .in('sale_id', saleIds)

    const stats = {
      totalSales: sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
      paymentMethods: {
        CASH: payments?.filter(p => p.method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        MOBILE_MONEY: payments?.filter(p => p.method === 'MOBILE_MONEY').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        CARD: payments?.filter(p => p.method === 'CARD').reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      },
      expectedCash: 0
    }
    stats.expectedCash = Number(currentShift.opening_cash) + stats.paymentMethods.CASH
    setShiftStats(stats)
  }

  const handleOpenShift = async () => {
    if (!profile) return
    setIsLoading(true)
    try {
      // First, check if user already has an open shift
      const { data: existingShift } = await supabase
        .from('shifts')
        .select('id, user_id, status')
        .eq('user_id', profile.id)
        .eq('status', 'OPEN')
        .single()

      if (existingShift) {
        setCurrentShift(existingShift)
        toast.info('Shift already open')
        return
      }

      // Create new shift
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          user_id: profile.id,
          opening_cash: parseFloat(openingCash) || 0,
          status: 'OPEN'
        })
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('Failed to create shift - no data returned')
      
      setCurrentShift(data)
      toast.success('Shift opened successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to open shift')
      console.error('Shift open error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseShift = async () => {
    if (!currentShift) return
    const actual = parseFloat(closingCashActual)
    if (isNaN(actual)) {
      toast.error('Please enter actual cash in drawer')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('shifts')
        .update({
          end_time: new Date().toISOString(),
          closing_cash_actual: actual,
          closing_cash_expected: shiftStats.expectedCash,
          status: 'CLOSED'
        })
        .eq('id', currentShift.id)

      if (error) throw error
      
      setCurrentShift(null)
      toast.success('Shift closed successfully. Z-Report generated.')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to close shift')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {currentShift ? 'Active Register Shift' : 'Open New Shift'}
          </DialogTitle>
        </DialogHeader>

        {!currentShift ? (
          <div className="space-y-6 py-4">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-4">
              <Unlock className="h-6 w-6 text-primary mt-1" />
              <div>
                <p className="font-bold text-sm">Prepare your register</p>
                <p className="text-xs text-muted-foreground">Enter the starting cash amount currently in your drawer.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening-cash">Opening Cash (₵)</Label>
              <div className="relative">
                <Input
                  id="opening-cash"
                  type="number"
                  placeholder="0.00"
                  className="text-2xl h-14 pl-10 font-bold"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₵</div>
              </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold" onClick={handleOpenShift} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-5 w-5" />}
              Start Shift
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Shift Stats (X-Report Style) */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50/50 border-green-100">
                <CardContent className="p-4">
                  <p className="text-[10px] text-green-600 uppercase font-black tracking-wider mb-1">Expected Cash</p>
                  <p className="text-xl font-bold">{formatCurrency(shiftStats.expectedCash)}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50/50 border-blue-100">
                <CardContent className="p-4">
                  <p className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-1">Total Sales</p>
                  <p className="text-xl font-bold">{formatCurrency(shiftStats.totalSales)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" /> Opening Cash</span>
                <span className="font-medium">{formatCurrency(currentShift.opening_cash)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Cash Sales</span>
                <span className="font-medium">{formatCurrency(shiftStats.paymentMethods.CASH)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm text-purple-600">
                <span className="font-medium">MoMo Payments</span>
                <span className="font-bold">{formatCurrency(shiftStats.paymentMethods.MOBILE_MONEY)}</span>
              </div>
              <div className="flex justify-between text-sm text-orange-600">
                <span className="font-medium">Card Payments</span>
                <span className="font-bold">{formatCurrency(shiftStats.paymentMethods.CARD)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="closing-cash">Actual Cash in Drawer (₵)</Label>
              <div className="relative">
                <Input
                  id="closing-cash"
                  type="number"
                  placeholder="Count your cash..."
                  className="text-2xl h-14 pl-10 font-bold border-primary/30 focus-visible:ring-primary"
                  value={closingCashActual}
                  onChange={(e) => setClosingCashActual(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₵</div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">Difference: {formatCurrency((parseFloat(closingCashActual) || 0) - shiftStats.expectedCash)}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => fetchShiftStats()}>
                <FileText className="mr-2 h-4 w-4" /> X-Report
              </Button>
              <Button variant="destructive" className="flex-1 font-bold" onClick={handleCloseShift} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                End Shift (Z-Report)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
