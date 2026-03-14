'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Package } from 'lucide-react'

interface ProductImageProps {
  src?: string | null
  alt: string
  className?: string
  fill?: boolean
  size?: 'default' | 'sm'
}

export function ProductImage({ src, alt, className, fill = true, size = 'default' }: ProductImageProps) {
  const [error, setError] = useState(false)

  const renderFallback = () => {
    if (size === 'sm') {
      return (
        <div className={cn("w-full h-full flex items-center justify-center bg-muted/30 dark:bg-muted/10", className)}>
          <Package className="w-5 h-5 text-muted-foreground/40" />
        </div>
      )
    }

    return (
      <div
      className={cn(
        'w-full h-full flex flex-col items-center justify-center bg-muted/30 relative dark:bg-muted/10',
        className
      )}
    >
      {/* Subtle Technical Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none overflow-hidden">
        <svg width="100%" height="100%">
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3">
        {/* Soft Glassmorphic Icon Container */}
        <div className="p-4 rounded-3xl bg-background/50 backdrop-blur-xl border border-border/50 shadow-sm transition-transform duration-500 group-hover:scale-110">
          <Package className="w-8 h-8 text-muted-foreground/30" strokeWidth={1} />
        </div>
        
        {/* Minimalist Product Label */}
        <div className="flex flex-col items-center select-none">
          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] leading-none mb-1">
            {alt.split(' ')[0]}
          </span>
          <div className="h-[1px] w-4 bg-muted-foreground/10 rounded-full" />
        </div>
      </div>

      {/* Elegant Noise/Grain Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.2] mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-[0.4]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
    </div>
    )
  }

  if (!src || error) {
    return renderFallback()
  }

  return (
    <div className={cn('relative overflow-hidden w-full h-full group', className)}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={cn(
          'object-cover transition-transform duration-700 group-hover:scale-105',
          className
        )}
        onError={() => setError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {/* Soft gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  )
}
