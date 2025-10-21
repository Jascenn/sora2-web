/**
 * Optimized Image Component
 *
 * Week 4: Performance Optimization - Image lazy loading and optimization
 *
 * Features:
 * - Automatic lazy loading
 * - Blur placeholder
 * - Error handling with fallback
 * - Next.js Image optimization
 */

"use client"

import Image from "next/image"
import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  quality?: number
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  priority = false,
  quality = 75,
  fallbackSrc = "/placeholder-image.png",
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    setHasError(true)
    setImgSrc(fallbackSrc)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      {fill ? (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleLoad}
          onError={handleError}
          quality={quality}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          width={width || 800}
          height={height || 600}
          className={`transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleLoad}
          onError={handleError}
          quality={quality}
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      )}
    </div>
  )
}

/**
 * Video Thumbnail Component with lazy loading
 */
export function VideoThumbnail({
  src,
  alt,
  className = "",
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={`aspect-video ${className}`}
      quality={60}
      fallbackSrc="/video-placeholder.png"
    />
  )
}

/**
 * Avatar Component with lazy loading
 */
export function Avatar({
  src,
  alt,
  size = 40,
  className = "",
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <div className={`rounded-full overflow-hidden ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full"
        quality={90}
        fallbackSrc="/avatar-placeholder.png"
      />
    </div>
  )
}
