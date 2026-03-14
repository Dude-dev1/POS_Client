'use client'

import { useConnectivity } from './ConnectivityProvider'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db } from '@/lib/dexie/db'
import { cn } from '@/lib/utils'

export function ConnectivityStatus() {
  const { isOnline } = useConnectivity()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await db.pendingSales.where('status').anyOf(['pending', 'failed']).count()
      setPendingCount(count)
    }

    updatePendingCount()
    
    // Simple polling for pending count when offline
    const interval = setInterval(updatePendingCount, 5000)
    return () => clearInterval(interval)
  }, [isOnline])

  return (
    <div className="flex items-center gap-2">
      {pendingCount > 0 && (
        <Badge variant="outline" className="gap-1.5 px-2 py-0.5 bg-orange-500/10 text-orange-600 border-orange-500/30 animate-pulse">
          <RefreshCcw className="h-3 w-3" />
          {pendingCount} Pending Sync
        </Badge>
      )}
      
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1.5 px-2 py-0.5 transition-colors duration-500",
          isOnline 
            ? "bg-green-500/10 text-green-600 border-green-500/30" 
            : "bg-red-500/10 text-red-600 border-red-500/30"
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline Mode
          </>
        )}
      </Badge>
    </div>
  )
}
