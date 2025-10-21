"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "./ui/button"

export function Header() {
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const { getUser } = await import("@/lib/auth")
      const user = getUser()

      // Token is in httpOnly cookie, so we check user data in localStorage
      if (user) {
        setIsLoggedIn(true)
        const { userApi } = await import("@/lib/user")

        // Load user balance
        try {
          const balanceRes = await userApi.getCreditBalance()
          setUserBalance(balanceRes.balance)
        } catch (error) {
          console.error("Failed to get balance:", error)
          // If API call fails with 401, user's cookie might be expired
          if ((error as any).response?.status === 401) {
            const { removeUser } = await import("@/lib/auth")
            removeUser()
            setIsLoggedIn(false)
          }
        }

        // Check if user is admin
        if (user.role === "admin") {
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error("Failed to check login status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold text-primary">
          Sora2
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/generate" className="text-sm hover:text-primary">
            开始创作
          </Link>
          <Link href="/gallery" className="text-sm hover:text-primary">
            作品展示
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/profile" className="text-sm hover:text-primary">
                个人中心
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  ⚙️ 管理后台
                </Link>
              )}
              {userBalance !== null && (
                <span className="text-sm font-medium text-primary">
                  💎 {userBalance} 积分
                </span>
              )}
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                登录
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
