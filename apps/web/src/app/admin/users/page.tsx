"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { adminApi, type AdminUser } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export default function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setUsers(data.users)
      setTotal(data.total)
    } catch (error: any) {
      console.error("Failed to load users:", error)
      toast.error("加载用户列表失败")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleUpdateCredits = async (userId: string, currentCredits: number) => {
    const amount = prompt("请输入要增加或扣除的积分数（负数表示扣除）：")
    if (!amount) return

    const credits = parseInt(amount)
    if (isNaN(credits)) {
      toast.error("请输入有效的数字")
      return
    }

    const reason = prompt("请输入操作原因：") || "管理员操作"

    try {
      await adminApi.updateUserCredits(userId, credits, reason)
      toast.success(`积分${credits > 0 ? "增加" : "扣除"}成功`)
      loadUsers()
    } catch (error: any) {
      toast.error(`操作失败: ${error.message}`)
    }
  }

  const handleBanUser = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "banned" : "active"
    const action = newStatus === "banned" ? "封禁" : "解封"

    if (!confirm(`确定要${action}该用户吗？`)) return

    try {
      await adminApi.updateUserStatus(userId, newStatus)
      toast.success(`${action}成功`)
      loadUsers()
    } catch (error: any) {
      toast.error(`${action}失败: ${error.message}`)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadUsers()
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">用户管理</h2>
        <p className="text-muted-foreground">管理系统用户和积分</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="搜索邮箱或昵称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 rounded-md border px-4 py-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-md border px-4 py-2"
        >
          <option value="">全部状态</option>
          <option value="active">活跃</option>
          <option value="banned">已封禁</option>
        </select>
        <Button onClick={handleSearch}>搜索</Button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium">邮箱</th>
                <th className="px-4 py-3 text-left text-sm font-medium">积分</th>
                <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
                <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium">注册时间</th>
                <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                          }
                          alt={user.nickname}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <span className="font-medium">{user.nickname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary">
                        {user.credits}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role === "admin" ? "管理员" : "普通用户"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status === "active" ? "活跃" : "已封禁"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdateCredits(user.id, user.credits)
                          }
                        >
                          调整积分
                        </Button>
                        {user.role !== "admin" && (
                          <Button
                            size="sm"
                            variant={
                              user.status === "active" ? "destructive" : "default"
                            }
                            onClick={() => handleBanUser(user.id, user.status)}
                          >
                            {user.status === "active" ? "封禁" : "解封"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-muted-foreground">
              共 {total} 个用户，第 {page}/{totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
