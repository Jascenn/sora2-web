"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast, Toaster } from "sonner"
import { useAuthStore } from "@/store/auth.store"
import { useLogout } from "@/hooks"
import { userApi, type CreditTransaction } from "@/lib/user"
import { videoApi } from "@/lib/video"

interface Video {
  id: string
  prompt: string
  status: string
  createdAt: string
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const { mutate: logout } = useLogout()

  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [recentVideos, setRecentVideos] = useState<Video[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ nickname: '', avatarUrl: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      loadData()
    }
  }, [isAuthenticated, user])

  const loadData = async () => {
    try {
      setIsDataLoading(true)
      // Parallel load all data
      const [balanceRes, transactionsRes, videosRes] = await Promise.all([
        userApi.getCreditBalance(),
        userApi.getCreditTransactions({ limit: 5 }),
        videoApi.list({ limit: 3 }),
      ])

      setBalance(balanceRes.balance)
      setTransactions(transactionsRes.transactions || [])
      setRecentVideos(videosRes.videos || [])
    } catch (error: any) {
      console.error("Failed to load profile data:", error)
      toast.error(error.message || "加载失败，请稍后重试")
    } finally {
      setIsDataLoading(false)
    }
  }

  const handleEditClick = () => {
    if (user) {
      setEditForm({
        nickname: user.nickname,
        avatarUrl: user.avatarUrl || ''
      })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({ nickname: '', avatarUrl: '' })
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const response = await userApi.updateProfile(editForm)
      // Re-fetch user from store after update
      const { setUser } = useAuthStore.getState()
      setUser(response.user)
      setIsEditing(false)
      toast.success(response.message || '更新成功')
    } catch (error: any) {
      console.error("Failed to update profile:", error)
      toast.error(error.response?.data?.message || error.message || '更新失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度至少为6位')
      return
    }

    try {
      setIsChangingPassword(true)
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })

      toast.success('密码修改成功，请重新登录')
      setShowPasswordModal(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })

      // Logout user
      setTimeout(() => {
        logout()
      }, 1000)
    } catch (error: any) {
      console.error("Failed to change password:", error)
      toast.error(error.response?.data?.message || error.message || '密码修改失败')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!user) {
    // This should technically not be reached if AuthProvider is working correctly
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            <Button variant="outline" size="sm" onClick={() => logout()}>
              退出登录
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">基本信息</h3>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="text-sm text-primary hover:underline"
                  >
                    编辑
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      昵称
                    </label>
                    <input
                      type="text"
                      value={editForm.nickname}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nickname: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="请输入昵称"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      头像URL
                    </label>
                    <input
                      type="text"
                      value={editForm.avatarUrl}
                      onChange={(e) =>
                        setEditForm({ ...editForm, avatarUrl: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="请输入头像URL（可选）"
                    />
                  </div>
                  {editForm.avatarUrl && (
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">预览</p>
                      <Image
                        src={editForm.avatarUrl}
                        alt="Avatar preview"
                        width={64}
                        height={64}
                        className="rounded-full"
                        onError={(e: any) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? "保存中..." : "保存"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      disabled={isSaving}
                      className="flex-1"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      src={
                        user.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                      }
                      alt={user.nickname}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                    <div>
                      <h2 className="text-lg font-semibold">{user.nickname}</h2>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-md bg-blue-50 p-4">
                    <p className="text-sm text-muted-foreground">当前积分</p>
                    <p className="text-3xl font-bold text-primary">{balance}</p>
                  </div>

                  <Link href="/pricing" className="w-full">
                    <Button className="w-full">充值积分</Button>
                  </Link>
                </>
              )}
            </div>

            <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">快捷操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full rounded-md border px-4 py-2 text-left text-sm hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  🔒 修改密码
                </button>
                {/* API Settings only for admin users */}
                {user.role === 'admin' && (
                  <Link href="/admin" className="block">
                    <button className="w-full rounded-md border px-4 py-2 text-left text-sm hover:bg-gray-50 hover:text-primary transition-colors">
                      ⚙️ API 设置
                    </button>
                  </Link>
                )}
                <Link href="/pricing" className="block">
                  <button className="w-full rounded-md border px-4 py-2 text-left text-sm hover:bg-gray-50 hover:text-primary transition-colors">
                    💳 充值中心
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* My Videos */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">最近视频</h3>
              {isDataLoading ? <p>Loading...</p> : recentVideos.length > 0 ? (
                <div className="space-y-3">
                  {recentVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{video.prompt}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          video.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : video.status === "processing"
                            ? "bg-yellow-100 text-yellow-700"
                            : video.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {video.status === "completed"
                          ? "已完成"
                          : video.status === "processing"
                          ? "生成中"
                          : video.status === "failed"
                          ? "失败"
                          : "等待中"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-3 flex justify-center">
                    <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    还没有生成任何视频
                  </p>
                </div>
              )}
              <Link href="/gallery">
                <Button variant="outline" className="mt-4 w-full">
                  查看全部
                </Button>
              </Link>
            </div>

            {/* Credit Transactions */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">积分明细</h3>
              {isDataLoading ? <p>Loading...</p> : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`font-semibold ${
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-3 flex justify-center">
                    <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    暂无积分交易记录
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">修改密码</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  当前密码
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="请输入当前密码"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  新密码
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="请输入新密码（至少6位）"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="请再次输入新密码"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex-1"
                >
                  {isChangingPassword ? "修改中..." : "确认修改"}
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  variant="outline"
                  disabled={isChangingPassword}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  )
}
