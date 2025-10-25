"use client"

/**
 * Admin Layout with Navigation
 *
 * Week 4: Performance Optimization - Lazy loading for admin section
 */

import { useEffect, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { AdminLoadingSkeleton } from "@/components/loading-skeleton"

// Temporary bypass login for development
const BYPASS_LOGIN = process.env.NODE_ENV === 'development'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkAdminAccess = useCallback(async () => {
    // Skip admin check in development mode
    if (BYPASS_LOGIN) {
      setIsAdmin(true)
      setIsLoading(false)
      return
    }

    try {
      const { getUser } = await import("@/lib/auth")
      const { userApi } = await import("@/lib/user")

      const user = getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Verify with backend that user still has admin role
      // (token is in httpOnly cookie, so API will authenticate automatically)
      try {
        const { user: currentUser } = await userApi.getProfile()
        if (currentUser.role !== "admin") {
          toast.error("无权访问管理后台")
          router.push("/")
          return
        }
        setIsAdmin(true)
      } catch (error) {
        // If API call fails, cookie might be expired
        console.error("Admin access check failed:", error)
        const { removeUser } = await import("@/lib/auth")
        removeUser()
        router.push("/login")
      }
    } catch (error) {
      console.error("Admin access check failed:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      router.push("/login")
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">验证管理员权限...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const navItems = [
    { href: "/admin", label: "仪表盘", icon: "📊" },
    { href: "/admin/users", label: "用户管理", icon: "👥" },
    { href: "/admin/videos", label: "视频管理", icon: "🎬" },
    { href: "/admin/finance", label: "财务管理", icon: "💰" },
    { href: "/admin/config", label: "系统配置", icon: "⚙️" },
    { href: "/admin/system", label: "系统监控", icon: "📊" },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="text-xl font-bold text-primary">
            Sora2 Admin
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/">
            <Button variant="outline" className="w-full mb-2">
              返回前台
            </Button>
          </Link>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-lg font-semibold">
              {navItems.find((item) => item.href === pathname)?.label ||
                "管理后台"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">管理员</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Suspense fallback={<AdminLoadingSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
