'use client'

import { useEffect, useCallback } from 'react'
import { db } from '@/lib/dexie/db'
import { createClient } from '@/lib/supabase/client'
import { useConnectivity } from './ConnectivityProvider'
import { toast } from 'react-hot-toast'

export function SyncManager() {
  const { isOnline } = useConnectivity()
  const supabase = createClient()

  const syncProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      if (data) {
        // Clear and refill local product cache
        await db.products.clear()
        await db.products.bulkPut(data)
        
        await db.syncLogs.add({
          type: 'DOWNLOAD',
          timestamp: new Date().toISOString(),
          message: `Successfully updated local cache with ${data.length} products`,
          status: 'success'
        })
        console.log('Local product cache updated')
      }
    } catch (error: any) {
      console.error('Failed to sync products:', error)
      await db.syncLogs.add({
        type: 'DOWNLOAD',
        timestamp: new Date().toISOString(),
        message: `Failed to download products: ${error.message}`,
        status: 'failure'
      })
    }
  }, [supabase])

  const syncPendingSales = useCallback(async () => {
    const pending = await db.pendingSales
      .where('status')
      .anyOf(['pending', 'failed'])
      .toArray()
      
    if (pending.length === 0) return

    toast.loading(`Syncing ${pending.length} offline transactions...`, { 
      id: 'sync-progress',
      icon: '🔄'
    })

    let successCount = 0
    let failureCount = 0

    for (const sale of pending) {
      try {
        // 1. Insert Sale record
        const { data: serverSale, error: saleError } = await supabase
          .from('sales')
          .insert([{
             ...sale.saleData,
             created_at: sale.createdAt // Preserve original time
          }])
          .select()
          .single()

        if (saleError) throw saleError

        // 2. Insert Sale Items
        const itemsToInsert = sale.items.map(item => {
          const { product_name, ...cleanItem } = item as any
          return {
            ...cleanItem,
            sale_id: serverSale.id
          }
        })
        
        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError

        // 3. Mark as synced in local DB
        await db.pendingSales.update(sale.id!, { status: 'synced' })
        successCount++
      } catch (error: any) {
        console.error(`Failed to sync sale ${sale.id}:`, error)
        await db.pendingSales.update(sale.id!, { 
          status: 'failed', 
          errorMessage: error.message 
        })
        failureCount++
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} transactions!`, { id: 'sync-progress' })
    } else if (failureCount > 0) {
      toast.error(`Failed to sync ${failureCount} transactions. Will retry later.`, { id: 'sync-progress' })
    } else {
      toast.dismiss('sync-progress')
    }

    await db.syncLogs.add({
      type: 'UPLOAD',
      timestamp: new Date().toISOString(),
      message: `Sync attempt finished: ${successCount} success, ${failureCount} failed`,
      status: failureCount === 0 ? 'success' : 'failure'
    })
  }, [supabase])

  useEffect(() => {
    if (isOnline) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        syncProducts()
        syncPendingSales()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, syncProducts, syncPendingSales])

  return null 
}
