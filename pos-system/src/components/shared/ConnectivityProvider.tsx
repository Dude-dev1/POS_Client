'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { SyncManager } from './SyncManager'

interface ConnectivityContextType {
  isOnline: boolean
}

const ConnectivityContext = createContext<ConnectivityContextType>({ isOnline: true })

export const useConnectivity = () => useContext(ConnectivityContext)

export const ConnectivityProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)

      const handleOnline = () => {
        setIsOnline(true)
        toast.success('POS is back online. Syncing data...', { 
          icon: '📶',
          id: 'connectivity-status'
        })
      }

      const handleOffline = () => {
        setIsOnline(false)
        toast.error('POS is offline. Transactions will be saved locally.', { 
          icon: '🔌', 
          duration: 10000,
          id: 'connectivity-status'
        })
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return (
    <ConnectivityContext.Provider value={{ isOnline }}>
      {children}
      <SyncManager />
    </ConnectivityContext.Provider>
  )
}
