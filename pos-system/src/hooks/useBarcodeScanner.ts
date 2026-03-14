'use client'

import { useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void
  disabled?: boolean
  timeoutMs?: number 
}

export function useBarcodeScanner({ onScan, disabled = false, timeoutMs = 50 }: UseBarcodeScannerProps) {
  const barcodeChars = useRef<string>('')
  const lastKeyTime = useRef<number>(0)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return

      // Ignore input if it's originating from an actual input field or textarea
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') {
         return
      }

      const currentTime = Date.now()

      if (e.key === 'Enter') {
        if (barcodeChars.current.length > 3) {
           // It's likely a barcode scan if it's more than 3 chars and ends with Enter
           e.preventDefault()
           onScan(barcodeChars.current)
           barcodeChars.current = ''
        }
        return
      }

      // If the time between keystrokes is too long, it's probably human typing
      if (currentTime - lastKeyTime.current > timeoutMs) {
        barcodeChars.current = ''
      }

      // Add valid characters (alphanumeric for most barcodes)
      if (e.key.length === 1 && /^[a-zA-Z0-9-]$/.test(e.key)) {
        barcodeChars.current += e.key
        lastKeyTime.current = currentTime
      }
    },
    [onScan, disabled, timeoutMs]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
