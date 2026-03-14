'use client'

import React from 'react'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

interface ThermalReceiptProps {
  saleId: string
  sale: any
  items: any[]
  payments: any[]
  settings: any
}

export const ThermalReceipt = React.forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ saleId, sale, items, payments, settings }, ref) => {
    if (!sale || !settings) return null

    return (
      <div 
        ref={ref}
        className="hidden print:block print:w-[80mm] print:m-0 print:p-0 font-mono text-black bg-white"
        style={{ width: '80mm', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <style type="text/css" media="print">
          {`
            @page {
              margin: 0;
              size: 80mm auto; /* Thermal printer typical width */
            }
            body {
              margin: 0;
              padding: 0;
            }
          `}
        </style>
        
        <div className="p-2 text-[12px] leading-tight flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold uppercase mb-1">{settings?.store_name || 'POS SYSTEM'}</h2>
          <p>{settings?.store_address}</p>
          <p>Tel: {settings?.store_phone}</p>
        </div>

        <div className="w-full border-t border-dashed border-black my-2"></div>

        <div className="px-2 text-[12px] leading-tight space-y-1">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-bold">{saleId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(sale.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.profiles?.full_name || 'Staff'}</span>
          </div>
          {sale.customers && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{sale.customers.full_name}</span>
            </div>
          )}
        </div>

        <div className="w-full border-t border-dashed border-black my-2"></div>

        <div className="px-2 text-[12px] leading-tight">
          <table className="w-full text-left table-auto border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="font-normal py-1 w-1/2">Item</th>
                <th className="font-normal py-1 text-center w-1/6">Qty</th>
                <th className="font-normal py-1 text-right w-1/3">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 break-words align-top pr-1">
                    {item.products?.name}
                    <div className="text-[10px] text-gray-500">@{formatCurrency(item.unit_price)}</div>
                  </td>
                  <td className="py-1 text-center align-top">{item.quantity}</td>
                  <td className="py-1 text-right align-top">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-full border-t border-dashed border-black my-2"></div>

        <div className="px-2 text-[12px] leading-tight space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(sale.discount_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (15%)</span>
            <span>{formatCurrency(sale.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-[14px] mt-1 pt-1 border-t border-black">
            <span>TOTAL</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
        </div>

        <div className="w-full border-t border-dashed border-black my-2"></div>

        <div className="px-2 text-[12px] leading-tight space-y-1">
          {payments.map((p, i) => (
            <div key={i} className="flex flex-col">
              <div className="flex justify-between">
                <span>{p.method.replace('_', ' ')}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
              {p.method === 'CASH' && p.details?.change > 0 && (
                <div className="flex justify-between text-[10px] text-gray-600 pl-2">
                  <span>Cash: {formatCurrency(p.details.amount_tendered)}</span>
                  <span>Chg: {formatCurrency(p.details.change)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="w-full border-t border-dashed border-black my-2"></div>

        <div className="p-2 text-center text-[10px] italic">
          <p>{settings?.receipt_footer || 'Thank you for your business!'}</p>
          <div className="mt-4 flex justify-center">
            {/* Can inject barcode or QR code here if desired for receipt lookup */}
            <p className="font-mono text-[8px] tracking-widest">{saleId.slice(0, 16).toUpperCase()}</p>
          </div>
        </div>
        
        {/* Magic empty space to feed paper out of printer cutter */}
        <div className="h-12 w-full"></div>
      </div>
    )
  }
)

ThermalReceipt.displayName = 'ThermalReceipt'
