"use client"

/**
 * Offline Fallback Page
 *
 * This page is shown when the user is offline and tries to access
 * a page that is not cached by the service worker.
 */

import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [fixing, setFixing] = useState(false)

  useEffect(() => {
    // 监听网络状态变化
    const handleOnline = () => {
      setIsOnline(true)
      console.log('[Offline] Network is back online')
      // 如果网络恢复，自动重定向到首页
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[Offline] Network is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 检查是否实际上在线（可能是浏览器误判）
    if (navigator.onLine) {
      console.log('[Offline] Browser says online, checking connection...')
      checkConnection()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkConnection = async () => {
    try {
      // 尝试连接到本地服务器
      const response = await fetch('/', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      })
      if (response.ok) {
        console.log('[Offline] Connection test passed, redirecting...')
        window.location.href = '/'
      }
    } catch (error) {
      console.log('[Offline] Connection test failed:', error instanceof Error ? error.message : String(error))
    }
  }

  const handleFix = async () => {
    setFixing(true)
    console.log('[Offline] Attempting to fix...')

    try {
      // 清除 Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }
        console.log('[Offline] Service Workers cleared')
      }

      // 清除缓存
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        console.log('[Offline] Caches cleared')
      }

      // 延迟后重定向
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } catch (error) {
      console.error('[Offline] Fix failed:', error)
      setFixing(false)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
      <div className="text-center text-white px-4">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto mb-4 opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <h1 className="text-4xl font-bold mb-4">
            {isOnline ? '网络已恢复' : '离线模式'}
          </h1>
          <p className="text-xl mb-2 opacity-90">
            {isOnline ? '正在重定向...' : '您当前处于离线状态'}
          </p>
          <p className="text-lg opacity-75">
            {isOnline ? '请稍候' : '请检查网络连接后重试'}
          </p>
          {!isOnline && (
            <div className="mt-6 text-sm opacity-80">
              <p>提示：如果您实际上有网络连接，可能是浏览器缓存导致</p>
            </div>
          )}
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">可用功能</h2>
            <ul className="text-left space-y-2 opacity-90">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                查看已缓存的页面
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                浏览本地缓存的视频
              </li>
              <li className="flex items-center opacity-50">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                生成新视频（需要网络）
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200 shadow-lg"
            >
              重新连接
            </button>

            {!isOnline && (
              <button
                onClick={handleFix}
                disabled={fixing}
                className="w-full bg-yellow-400 text-purple-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fixing ? '正在修复...' : '修复缓存问题'}
              </button>
            )}
          </div>

          <div className="mt-6">
            <a
              href="/"
              className="text-white/80 hover:text-white underline transition-colors duration-200"
            >
              返回首页
            </a>
          </div>
        </div>

        <div className="mt-12 text-sm opacity-60">
          <p>提示：已访问过的页面可能已被缓存，可以离线访问</p>
        </div>
      </div>
    </div>
  )
}
