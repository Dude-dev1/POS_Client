'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Monitor } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setIsInstallable(false)

    if (outcome === 'accepted') {
      toast.success('Thank you for installing POS Master Pro!')
      setIsInstalled(true)
    }
  }

  if (isInstalled || !isInstallable) return null

  return (
    <div className="p-4 m-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-3">
      <div className="flex items-center gap-2 text-cyan-500">
        <Monitor className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Install App</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Install POS Master Pro for a faster, fullscreen, and more reliable experience.
      </p>
      <Button 
        onClick={handleInstallClick}
        variant="default" 
        size="sm" 
        className="w-full h-8 text-[11px] bg-cyan-600 hover:bg-cyan-700 text-white border-none"
      >
        <Download className="mr-2 h-3 w-3" />
        Get App Now
      </Button>
    </div>
  )
}
