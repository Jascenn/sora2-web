/**
 * Lazy Components
 *
 * Week 4: Performance Optimization - Dynamic imports for heavy components
 *
 * This file exports lazy-loaded versions of heavy components to reduce initial bundle size
 *
 * OPTIMIZATION STRATEGY:
 * - Admin components: ssr: false (only needed for authenticated users)
 * - Form pages: ssr: true (needed for SEO and initial load)
 * - Gallery/Media: ssr: true (SEO important for content)
 * - Heavy UI libraries: ssr: false (client-side only)
 */

"use client"

import dynamic from "next/dynamic"
import {
  PageLoadingSkeleton,
  DashboardLoadingSkeleton,
  GalleryLoadingSkeleton,
  FormLoadingSkeleton,
} from "./loading-skeleton"

/**
 * Lazy-load admin dashboard components
 * These are heavy and only needed for admin users
 */
export const LazyAdminDashboard = dynamic(
  () => import("@/app/admin/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingSkeleton />,
    ssr: false,
  }
)

export const LazyAdminUsers = dynamic(
  () => import("@/app/admin/users/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingSkeleton />,
    ssr: false,
  }
)

export const LazyAdminVideos = dynamic(
  () => import("@/app/admin/videos/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingSkeleton />,
    ssr: false,
  }
)

export const LazyAdminFinance = dynamic(
  () => import("@/app/admin/finance/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingSkeleton />,
    ssr: false,
  }
)

export const LazyAdminConfig = dynamic(
  () => import("@/app/admin/config/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingSkeleton />,
    ssr: false,
  }
)

export const LazyAdminSystem = dynamic(
  () => import("@/app/admin/system/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <DashboardLoadingSkeleton />,
    ssr: false,
  }
)

/**
 * Lazy-load heavy form pages
 */
export const LazyGeneratePage = dynamic(
  () => import("@/app/generate/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: true, // Keep SSR for SEO
  }
)

export const LazyLoginPage = dynamic(
  () => import("@/app/login/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: true,
  }
)

export const LazyRegisterPage = dynamic(
  () => import("@/app/register/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: true,
  }
)

/**
 * Lazy-load gallery page with videos
 */
export const LazyGalleryPage = dynamic(
  () => import("@/app/gallery/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <GalleryLoadingSkeleton />,
    ssr: true,
  }
)

/**
 * Lazy-load profile and account pages
 */
export const LazyProfilePage = dynamic(
  () => import("@/app/profile/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <PageLoadingSkeleton />,
    ssr: false, // User-specific, no SEO needed
  }
)

export const LazyForgotPasswordPage = dynamic(
  () => import("@/app/forgot-password/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: true,
  }
)

/**
 * Lazy-load simple generate page (lighter version)
 */
export const LazySimpleGeneratePage = dynamic(
  () => import("@/app/simple-generate/page").then((mod) => ({ default: mod.default })),
  {
    loading: () => <FormLoadingSkeleton />,
    ssr: true,
  }
)

/**
 * Lazy-load heavy UI libraries and animations
 * These should only load on client-side when needed
 */
export const LazyFramerMotion = dynamic(
  () => import("framer-motion").then((mod) => ({ default: mod.motion.div })),
  {
    loading: () => <div />,
    ssr: false,
  }
)

// Lazy-load Framer Motion variants for complex animations
export const LazyAnimatedDiv = dynamic(
  () => import("framer-motion").then((mod) => ({ default: mod.motion.div })),
  {
    ssr: false,
  }
)

export const LazyAnimatedButton = dynamic(
  () => import("framer-motion").then((mod) => ({ default: mod.motion.button })),
  {
    ssr: false,
  }
)

/**
 * Lazy-load React Query DevTools (only in development)
 */
export const LazyReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  {
    ssr: false,
  }
)

/**
 * Lazy-load toast/notification system if heavy
 */
export const LazyToaster = dynamic(
  () => import("sonner").then((mod) => ({ default: mod.Toaster })),
  {
    ssr: false,
  }
)

/**
 * Example: Lazy-load chart components (if you add them later)
 */
// export const LazyChart = dynamic(() => import("recharts").then(mod => mod.LineChart), {
//   loading: () => <div className="h-64 animate-pulse bg-gray-200 rounded" />,
//   ssr: false,
// })

/**
 * Helper function to create lazy components with custom config
 */
export function createLazyComponent<T extends React.ComponentType<any> = React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    ssr?: boolean
    loading?: () => React.ReactElement | null
  }
) {
  return dynamic(importFn, {
    ssr: options?.ssr ?? false,
    loading: options?.loading,
  })
}
