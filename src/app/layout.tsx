import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "sonner"
import Script from "next/script"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
})

export const metadata: Metadata = {
  title: "Sora2 AI Video Generator",
  description: "Create stunning AI-generated videos with Sora2",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sora2",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Sora2 AI Video Generator",
    title: "Sora2 AI Video Generator",
    description: "Create stunning AI-generated videos with Sora2",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sora2 AI Video Generator",
    description: "Create stunning AI-generated videos with Sora2",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#667eea" },
    { media: "(prefers-color-scheme: dark)", color: "#667eea" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Sora2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sora2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Performance optimization - removed hardcoded localhost */}
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />

        {/* Enhanced Service Worker Registration */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Service Worker Registration with advanced features
              // DISABLED IN DEVELOPMENT TO PREVENT OFFLINE ISSUES
              if ('serviceWorker' in navigator && false) { // Always false in development
                window.addEventListener('load', function() {
                  // Register service worker
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[PWA] Service Worker registered:', registration.scope);

                      // Check for updates periodically
                      setInterval(function() {
                        registration.update();
                      }, 60 * 60 * 1000); // Check every hour

                      // Listen for updates
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        console.log('[PWA] New Service Worker installing...');

                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New Service Worker available');
                            // Optionally show update notification to user
                            if (window.confirm('New version available! Reload to update?')) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                              window.location.reload();
                            }
                          }
                        });
                      });
                    })
                    .catch(function(err) {
                      console.error('[PWA] Service Worker registration failed:', err);
                    });

                  // Listen for controller change (new SW activated)
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    console.log('[PWA] Service Worker controller changed');
                  });
                });

                // Handle offline/online events
                window.addEventListener('online', function() {
                  console.log('[PWA] Back online');
                  // Optionally show notification
                });

                window.addEventListener('offline', function() {
                  console.log('[PWA] Gone offline');
                  // Optionally show notification
                });
              }

              // Install prompt for PWA
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                deferredPrompt = e;
                console.log('[PWA] Install prompt available');

                // Show custom install button if you have one
                // Example: document.getElementById('install-button').style.display = 'block';
              });

              window.addEventListener('appinstalled', function() {
                console.log('[PWA] App installed successfully');
                deferredPrompt = null;
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
