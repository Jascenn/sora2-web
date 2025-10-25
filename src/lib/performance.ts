/**
 * Performance Utilities
 *
 * Helper functions for performance monitoring and optimization
 */

/**
 * Web Vitals tracking
 */
export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Performance]', metric)
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // You can send to Google Analytics, Vercel Analytics, etc.
    // Example: sendToGoogleAnalytics(metric)
  }
}

/**
 * Performance observer for monitoring long tasks
 */
export function observeLongTasks() {
  if (typeof window === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Long tasks are tasks that take more than 50ms
        console.warn('[Performance] Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime,
        })
      }
    })

    observer.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    console.error('[Performance] Long task observer not supported')
  }
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string, callback: () => void) {
  if (typeof window === 'undefined') return callback()

  const startTime = performance.now()
  const result = callback()
  const endTime = performance.now()

  console.log(`[Performance] ${componentName} render time:`, endTime - startTime, 'ms')

  return result
}

/**
 * Prefetch resource
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = type
  link.href = url

  document.head.appendChild(link)
}

/**
 * Preload critical resource
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font' = 'script') {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = type
  link.href = url

  if (type === 'font') {
    link.setAttribute('crossorigin', 'anonymous')
  }

  document.head.appendChild(link)
}

/**
 * Get bundle size information
 */
export async function getBundleInfo() {
  if (typeof window === 'undefined') return null

  try {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    const scripts = resources.filter((r) => r.name.endsWith('.js'))
    const styles = resources.filter((r) => r.name.endsWith('.css'))
    const images = resources.filter((r) => /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(r.name))

    const totalScriptSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    const totalStyleSize = styles.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    const totalImageSize = images.reduce((sum, r) => sum + (r.transferSize || 0), 0)

    return {
      scripts: {
        count: scripts.length,
        size: totalScriptSize,
        sizeFormatted: formatBytes(totalScriptSize),
      },
      styles: {
        count: styles.length,
        size: totalStyleSize,
        sizeFormatted: formatBytes(totalStyleSize),
      },
      images: {
        count: images.length,
        size: totalImageSize,
        sizeFormatted: formatBytes(totalImageSize),
      },
      total: {
        size: totalScriptSize + totalStyleSize + totalImageSize,
        sizeFormatted: formatBytes(totalScriptSize + totalStyleSize + totalImageSize),
      },
    }
  } catch (error) {
    console.error('[Performance] Failed to get bundle info:', error)
    return null
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Get Core Web Vitals
 */
export async function getCoreWebVitals() {
  if (typeof window === 'undefined') return null

  try {
    const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals')

    const vitals: any = {}

    onCLS((metric) => {
      vitals.cls = metric.value
    })

    onINP((metric) => {
      vitals.inp = metric.value
    })

    onFCP((metric) => {
      vitals.fcp = metric.value
    })

    onLCP((metric) => {
      vitals.lcp = metric.value
    })

    onTTFB((metric) => {
      vitals.ttfb = metric.value
    })

    return vitals
  } catch (error) {
    console.error('[Performance] Failed to get Core Web Vitals:', error)
    return null
  }
}

/**
 * Check if user has slow connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false
  }

  const connection = (navigator as any).connection

  // Check if connection is 2G or slow-2g
  if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
    return true
  }

  // Check if save-data is enabled
  if (connection.saveData) {
    return true
  }

  return false
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(selector: string = 'img[data-src]') {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }

  const images = document.querySelectorAll<HTMLImageElement>(selector)

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.getAttribute('data-src')

        if (src) {
          img.src = src
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      }
    })
  })

  images.forEach((img) => imageObserver.observe(img))
}

/**
 * Get first input delay
 */
export function measureFirstInputDelay() {
  if (typeof window === 'undefined') return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Type assertion for PerformanceEventTiming which has processingStart
        const eventEntry = entry as any
        if (eventEntry.processingStart) {
          const fid = eventEntry.processingStart - entry.startTime
          console.log('[Performance] First Input Delay:', fid, 'ms')
        }
      }
    })

    observer.observe({ type: 'first-input', buffered: true })
  } catch (error) {
    console.error('[Performance] FID observer not supported')
  }
}

/**
 * Monitor memory usage (Chrome only)
 */
export function monitorMemoryUsage() {
  if (typeof window === 'undefined') return null

  const performance = (window as any).performance

  if (performance && performance.memory) {
    return {
      used: formatBytes(performance.memory.usedJSHeapSize),
      total: formatBytes(performance.memory.totalJSHeapSize),
      limit: formatBytes(performance.memory.jsHeapSizeLimit),
    }
  }

  return null
}
