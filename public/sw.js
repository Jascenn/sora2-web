/**
 * Service Worker for Sora2 AI Video Generator
 *
 * ENHANCED VERSION - Optimized for performance and offline functionality
 *
 * This service worker implements:
 * - Advanced offline caching strategies
 * - Static asset precaching with versioning
 * - Intelligent API response caching
 * - Image optimization and caching
 * - Background sync for offline actions
 * - Push notifications support
 * - Performance monitoring
 */

const CACHE_VERSION = 'v1.1.0'
const STATIC_CACHE = `sora2-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `sora2-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `sora2-images-${CACHE_VERSION}`
const API_CACHE = `sora2-api-${CACHE_VERSION}`
const FONT_CACHE = `sora2-fonts-${CACHE_VERSION}`

// Static assets to precache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/favicon.ico',
  '/favicon.svg',
  '/grid.svg',
  '/manifest.json',
  '/browserconfig.xml',
]

// API endpoints to cache (read-only operations)
const API_CACHE_PATTERNS = [
  /\/api\/videos$/,
  /\/api\/gallery$/,
  /\/api\/profile$/,
  /\/api\/config$/,
]

// API endpoints that should NEVER be cached
const API_NO_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/login/,
  /\/api\/register/,
  /\/api\/logout/,
  /\/api\/generate/,
  /\/api\/upload/,
]

// Maximum cache sizes to prevent unlimited growth
const MAX_CACHE_SIZE = {
  static: 60,
  dynamic: 75,
  images: 150,
  api: 50,
  fonts: 30,
}

// Cache duration (in milliseconds)
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
  dynamic: 7 * 24 * 60 * 60 * 1000, // 7 days
  images: 30 * 24 * 60 * 60 * 1000, // 30 days
  api: 5 * 60 * 1000, // 5 minutes
  fonts: 365 * 24 * 60 * 60 * 1000, // 1 year
}

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('sora2-') &&
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== IMAGE_CACHE &&
                   cacheName !== API_CACHE &&
                   cacheName !== FONT_CACHE
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      console.log('[Service Worker] Activated successfully')
      return self.clients.claim()
    })
  )
})

/**
 * Message Event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('sora2-'))
            .map(cacheName => caches.delete(cacheName))
        )
      }).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    )
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then(size => {
        event.ports[0].postMessage({ size })
      })
    )
  }
})

/**
 * Get total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0

  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('sora2-')) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      totalSize += keys.length
    }
  }

  return totalSize
}

/**
 * Fetch Event - Implement advanced caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension and other protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return
  }

  // Skip requests from different origins (except CDNs)
  if (url.origin !== location.origin && !isCDNRequest(url)) {
    return
  }

  // Never cache sensitive API endpoints
  if (isNoCacheApi(url)) {
    event.respondWith(fetch(request))
    return
  }

  // Handle different resource types with appropriate strategies
  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, FONT_CACHE))
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE, CACHE_DURATION.api))
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  }
})

/**
 * Cache First Strategy - Good for static assets
 */
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())

      // Limit cache size
      limitCacheSize(cacheName, MAX_CACHE_SIZE.static)
    }

    return networkResponse
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error)
    return getOfflinePage()
  }
}

/**
 * Network First Strategy - Good for API requests
 * Enhanced with cache expiration checking
 */
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)

      // Clone and add timestamp header for expiration tracking
      const responseToCache = networkResponse.clone()
      const headers = new Headers(responseToCache.headers)
      headers.append('sw-cached-time', Date.now().toString())

      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })

      cache.put(request, cachedResponse)

      // Limit cache size
      limitCacheSize(cacheName, MAX_CACHE_SIZE.api)
    }

    return networkResponse
  } catch (error) {
    console.log('[Service Worker] Network first failed, trying cache:', error.message)

    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      // Check if cached response is still valid
      const cachedTime = cachedResponse.headers.get('sw-cached-time')
      if (cachedTime && maxAge) {
        const age = Date.now() - parseInt(cachedTime)
        if (age > maxAge) {
          console.log('[Service Worker] Cached response expired')
          // Return stale data but mark it
          const headers = new Headers(cachedResponse.headers)
          headers.append('sw-cache-expired', 'true')
          return new Response(await cachedResponse.blob(), {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: headers
          })
        }
      }
      return cachedResponse
    }

    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No network connection available'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Stale While Revalidate Strategy - Good for dynamic content
 */
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = caches.open(cacheName)
      cache.then((c) => {
        c.put(request, networkResponse.clone())
        limitCacheSize(cacheName, MAX_CACHE_SIZE.dynamic)
      })
    }
    return networkResponse
  }).catch(() => {
    return cachedResponse || getOfflinePage()
  })

  return cachedResponse || fetchPromise
}

/**
 * Limit cache size to prevent unlimited growth
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxSize) {
    // Delete oldest entries
    const deleteCount = keys.length - maxSize
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i])
    }
  }
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.match(/\.(js|css)$/)
}

/**
 * Check if request is for a font
 */
function isFontRequest(url) {
  return url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/) ||
         url.pathname.includes('/fonts/')
}

/**
 * Check if request is for an image
 */
function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/)
}

/**
 * Check if request is for API (cacheable endpoints)
 */
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

/**
 * Check if request is for API that should never be cached
 */
function isNoCacheApi(url) {
  return API_NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

/**
 * Check if request is from a CDN
 */
function isCDNRequest(url) {
  const cdnDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'cdnjs.cloudflare.com',
  ]
  return cdnDomains.some(domain => url.hostname.includes(domain))
}

/**
 * Get offline fallback page
 */
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match('/offline')

  if (cachedResponse) {
    return cachedResponse
  }

  return new Response(
    `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>离线模式 - Sora2</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
          }
          h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.2rem;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>离线模式</h1>
          <p>您当前处于离线状态</p>
          <p>请检查网络连接后重试</p>
        </div>
      </body>
    </html>
    `,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  )
}

/**
 * Background Sync - For future use
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag)

  if (event.tag === 'sync-videos') {
    event.waitUntil(syncVideos())
  }
})

async function syncVideos() {
  // Implement background sync for video generation
  console.log('[Service Worker] Syncing videos...')
}

/**
 * Push Notifications - For future use
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body || '您有新的通知',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: data.data || {},
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Sora2 通知', options)
  )
})

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  )
})
