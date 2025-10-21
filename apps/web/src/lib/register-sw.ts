/**
 * Service Worker Registration
 *
 * This file handles the registration and lifecycle of the service worker
 * for progressive web app (PWA) functionality.
 */

/**
 * Register service worker
 */
export function registerServiceWorker() {
  // Only register in production and if service workers are supported
  if (
    typeof window === 'undefined' ||
    process.env.NODE_ENV !== 'production' ||
    !('serviceWorker' in navigator)
  ) {
    console.log('[SW] Service Worker not supported or not in production')
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('[SW] Service Worker registered successfully:', registration.scope)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing

        if (newWorker) {
          console.log('[SW] New Service Worker installing...')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to refresh
              console.log('[SW] New content available, please refresh.')
              showUpdateNotification()
            }
          })
        }
      })

      // Check for updates every hour
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000)

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading page...')
        window.location.reload()
      })
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error)
    }
  })
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()

    if (registration) {
      const success = await registration.unregister()
      console.log('[SW] Service Worker unregistered:', success)
    }
  } catch (error) {
    console.error('[SW] Service Worker unregistration failed:', error)
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  // Check if notification API is available
  if ('Notification' in window && Notification.permission === 'granted') {
    // Note: actions property is only supported in Service Worker notifications (registration.showNotification)
    // not in the Notification constructor
    const notification = new Notification('更新可用', {
      body: '新版本已准备就绪，请刷新页面以获取最新内容',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'app-update',
      requireInteraction: true,
    })

    // Handle notification click to refresh the page
    notification.onclick = () => {
      window.location.reload()
    }
  } else {
    // Fallback to console log or custom UI notification
    console.log('[SW] New version available! Please refresh the page.')
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  try {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return Notification.permission === 'granted'
  } catch (error) {
    console.error('[SW] Notification permission request failed:', error)
    return false
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check if push is supported
    if (!('pushManager' in registration)) {
      console.warn('[SW] Push notifications not supported')
      return null
    }

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // You'll need to generate VAPID keys for production
      // See: https://web.dev/push-notifications-server-codelab/#vapid-keys
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.warn('[SW] VAPID public key not configured')
        return null
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })

      console.log('[SW] Push notification subscription created')
    }

    return subscription
  } catch (error) {
    console.error('[SW] Push notification subscription failed:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const success = await subscription.unsubscribe()
      console.log('[SW] Push notification unsubscribed:', success)
      return success
    }

    return true
  } catch (error) {
    console.error('[SW] Push notification unsubscription failed:', error)
    return false
  }
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

/**
 * Prompt user to install PWA
 */
export function setupInstallPrompt() {
  if (typeof window === 'undefined') {
    return
  }

  let deferredPrompt: any = null

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()

    // Stash the event so it can be triggered later
    deferredPrompt = e

    // Show custom install UI (you can create a button/banner)
    console.log('[SW] Install prompt available')

    // Emit custom event for UI to listen to
    const event = new CustomEvent('app-install-available', {
      detail: { prompt: deferredPrompt },
    })
    window.dispatchEvent(event)
  })

  window.addEventListener('appinstalled', () => {
    console.log('[SW] App installed successfully')
    deferredPrompt = null

    // Track installation analytics if needed
  })

  return {
    showInstallPrompt: async () => {
      if (!deferredPrompt) {
        console.log('[SW] Install prompt not available')
        return false
      }

      // Show the install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice

      console.log('[SW] User choice:', outcome)

      // Clear the prompt
      deferredPrompt = null

      return outcome === 'accepted'
    },
  }
}

/**
 * Get service worker cache storage info
 */
export async function getCacheStorageInfo() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return null
  }

  try {
    const cacheNames = await caches.keys()
    const cacheInfos = await Promise.all(
      cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()

        return {
          name: cacheName,
          count: keys.length,
        }
      })
    )

    return cacheInfos
  } catch (error) {
    console.error('[SW] Failed to get cache storage info:', error)
    return null
  }
}

/**
 * Clear all service worker caches
 */
export async function clearAllCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))

    console.log('[SW] All caches cleared')
    return true
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error)
    return false
  }
}
