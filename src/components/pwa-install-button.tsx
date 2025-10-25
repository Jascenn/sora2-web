"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

/**
 * PWA Install Button Component
 *
 * Shows an install button when the PWA install prompt is available.
 * Handles the beforeinstallprompt event and triggers installation.
 *
 * Usage:
 * - Add this component anywhere in your app (Header, Footer, etc.)
 * - The button will only show when installation is possible
 * - Automatically hides after successful installation
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setIsInstallable(true)
      console.log('[PWA Install] Install prompt available')
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('[PWA Install] App installed successfully')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA Install] No install prompt available')
      return
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice

      console.log('[PWA Install] User response:', outcome)

      if (outcome === 'accepted') {
        console.log('[PWA Install] User accepted the install prompt')
      } else {
        console.log('[PWA Install] User dismissed the install prompt')
      }

      // Clear the prompt
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('[PWA Install] Error showing install prompt:', error)
    }
  }

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label="Install Sora2 App"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">安装应用</span>
      <span className="sm:hidden">安装</span>
    </Button>
  )
}

/**
 * Alternative: Badge/Banner Version
 * Shows a more prominent banner at the top of the page
 */
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if user already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      setIsVisible(true)
    }

    const handleAppInstalled = () => {
      setIsVisible(false)
      localStorage.removeItem('pwa-install-dismissed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsVisible(false)
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error('[PWA Install] Error:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!isVisible || isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">安装 Sora2 应用</p>
            <p className="text-xs text-muted-foreground">
              更快访问，离线使用，体验更佳
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
          >
            稍后
          </Button>
          <Button
            onClick={handleInstallClick}
            size="sm"
          >
            安装
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Usage Examples:
 *
 * 1. In Header component:
 * ```tsx
 * import { PWAInstallButton } from "@/components/pwa-install-button"
 *
 * export function Header() {
 *   return (
 *     <header>
 *       ...
 *       <PWAInstallButton />
 *       ...
 *     </header>
 *   )
 * }
 * ```
 *
 * 2. In Layout (for banner):
 * ```tsx
 * import { PWAInstallBanner } from "@/components/pwa-install-button"
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <PWAInstallBanner />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
