import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { ReturnModal } from '../pos/ReturnModal'

interface RecentSalesTableProps {
  sales: any[]
  onUpdate?: () => void
}

export function RecentSalesTable({ sales, onUpdate }: RecentSalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)

  const handleReturnClick = (sale: any) => {
    setSelectedSale(sale)
    setIsReturnModalOpen(true)
  }

  return (
    <>
      <Card className="col-span-4 lg:col-span-3 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium text-xs font-mono uppercase">
                    {sale.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{sale.customers?.full_name || 'Walk-in'}</TableCell>
                  <TableCell>
                    <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'destructive'} className="text-[10px]">
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(sale.created_at, 'dd/MM HH:mm')}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(sale.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10"
                      onClick={() => handleReturnClick(sale)}
                      disabled={sale.status === 'VOIDED'}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No recent sales found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReturnModal 
        sale={selectedSale}
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSuccess={() => onUpdate?.()}
      />
    </>
  )
}
