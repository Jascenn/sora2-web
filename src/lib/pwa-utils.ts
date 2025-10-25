/**
 * PWA Utility Functions
 *
 * Helper functions for PWA-related operations:
 * - Cache management
 * - Service Worker communication
 * - Installation detection
 * - Network status
 */

/**
 * Check if the app is installed as a PWA
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false

  // Check if running in standalone mode
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Check if Service Worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator
}

/**
 * Get Service Worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return null

  try {
    return await navigator.serviceWorker.ready
  } catch (error) {
    console.error('[PWA Utils] Error getting SW registration:', error)
    return null
  }
}

/**
 * Send message to Service Worker
 */
export async function sendMessageToSW(message: any): Promise<any> {
  const registration = await getServiceWorkerRegistration()

  if (!registration || !registration.active) {
    throw new Error('Service Worker not active')
  }

  const activeWorker = registration.active

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel()

    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error)
      } else {
        resolve(event.data)
      }
    }

    activeWorker.postMessage(message, [messageChannel.port2])
  })
}

/**
 * Clear all application caches
 */
export async function clearAllCaches(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false

  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    )
    console.log('[PWA Utils] All caches cleared')
    return true
  } catch (error) {
    console.error('[PWA Utils] Error clearing caches:', error)
    return false
  }
}

/**
 * Clear Service Worker caches via message
 */
export async function clearSWCache(): Promise<boolean> {
  try {
    await sendMessageToSW({ type: 'CLEAR_CACHE' })
    console.log('[PWA Utils] Service Worker cache cleared')
    return true
  } catch (error) {
    console.error('[PWA Utils] Error clearing SW cache:', error)
    return false
  }
}

/**
 * Get cache size (number of cached items)
 */
export async function getCacheSize(): Promise<number> {
  try {
    const result = await sendMessageToSW({ type: 'GET_CACHE_SIZE' })
    return result.size || 0
  } catch (error) {
    console.error('[PWA Utils] Error getting cache size:', error)
    return 0
  }
}

/**
 * Force Service Worker update
 */
export async function updateServiceWorker(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration()

  if (!registration) return false

  try {
    await registration.update()
    console.log('[PWA Utils] Service Worker update triggered')
    return true
  } catch (error) {
    console.error('[PWA Utils] Error updating Service Worker:', error)
    return false
  }
}

/**
 * Unregister Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration()

  if (!registration) return false

  try {
    const result = await registration.unregister()
    console.log('[PWA Utils] Service Worker unregistered')
    return result
  } catch (error) {
    console.error('[PWA Utils] Error unregistering Service Worker:', error)
    return false
  }
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

/**
 * Add online/offline event listeners
 */
export function addNetworkListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => {
    console.log('[PWA Utils] Network: Online')
    onOnline?.()
  }

  const handleOffline = () => {
    console.log('[PWA Utils] Network: Offline')
    onOffline?.()
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Get network information (if available)
 */
export function getNetworkInfo(): {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
} | null {
  if (typeof window === 'undefined') return null

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection

  if (!connection) return null

  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  }
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const info = getNetworkInfo()
  if (!info) return false

  return (
    info.effectiveType === 'slow-2g' ||
    info.effectiveType === '2g' ||
    info.saveData === true ||
    (info.downlink !== undefined && info.downlink < 1)
  )
}

/**
 * Prefetch a URL
 */
export async function prefetchURL(url: string): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    // Fallback to fetch
    try {
      await fetch(url)
      return true
    } catch (error) {
      return false
    }
  }

  try {
    const cache = await caches.open('prefetch-cache')
    const response = await fetch(url)
    await cache.put(url, response)
    console.log('[PWA Utils] Prefetched:', url)
    return true
  } catch (error) {
    console.error('[PWA Utils] Error prefetching:', error)
    return false
  }
}

/**
 * Prefetch multiple URLs
 */
export async function prefetchURLs(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => prefetchURL(url)))
}

/**
 * Get app version from Service Worker
 */
export async function getAppVersion(): Promise<string | null> {
  const registration = await getServiceWorkerRegistration()

  if (!registration || !registration.active) return null

  // Version is embedded in SW file, would need to be extracted
  // For now, return a default
  return '1.1.0'
}

/**
 * Check if app needs update
 */
export async function checkForUpdates(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration()

  if (!registration) return false

  try {
    await registration.update()

    // Check if there's a waiting worker
    return !!registration.waiting
  } catch (error) {
    console.error('[PWA Utils] Error checking for updates:', error)
    return false
  }
}

/**
 * Skip waiting and activate new Service Worker
 */
export async function skipWaiting(): Promise<void> {
  const registration = await getServiceWorkerRegistration()

  if (!registration || !registration.waiting) {
    throw new Error('No waiting Service Worker')
  }

  registration.waiting.postMessage({ type: 'SKIP_WAITING' })

  // Wait for controller change
  return new Promise((resolve) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      resolve()
    })
  })
}

/**
 * Get cached URLs
 */
export async function getCachedURLs(): Promise<string[]> {
  if (typeof window === 'undefined' || !('caches' in window)) return []

  try {
    const cacheNames = await caches.keys()
    const urls: string[] = []

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      urls.push(...requests.map((req) => req.url))
    }

    return [...new Set(urls)] // Remove duplicates
  } catch (error) {
    console.error('[PWA Utils] Error getting cached URLs:', error)
    return []
  }
}

/**
 * Export all utilities
 */
export const PWAUtils = {
  isPWAInstalled,
  isServiceWorkerSupported,
  getServiceWorkerRegistration,
  sendMessageToSW,
  clearAllCaches,
  clearSWCache,
  getCacheSize,
  updateServiceWorker,
  unregisterServiceWorker,
  isOnline,
  addNetworkListeners,
  getNetworkInfo,
  isSlowConnection,
  prefetchURL,
  prefetchURLs,
  getAppVersion,
  checkForUpdates,
  skipWaiting,
  getCachedURLs,
}

export default PWAUtils
