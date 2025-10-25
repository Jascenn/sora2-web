"use client"

import { useEffect, useState, useCallback } from "react"
import { adminApi, type CreditTransaction } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"

export default function FinanceManagement() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("")

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await adminApi.getTransactions({
        page,
        limit: 50,
        type: typeFilter || undefined,
      })
      setTransactions(data.transactions)
      setTotal(data.total)
    } catch (error: any) {
      console.error("Failed to load transactions:", error)
      toast.error("加载交易记录失败")
    } finally {
      setIsLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const totalPages = Math.ceil(total / 50)

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "充值",
      consumption: "消费",
      refund: "退款",
      admin_add: "管理员增加",
      admin_deduct: "管理员扣除",
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    if (type === "purchase" || type === "admin_add" || type === "refund")
      return "bg-green-100 text-green-700"
    if (type === "consumption" || type === "admin_deduct")
      return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">财务管理</h2>
        <p className="text-muted-foreground">查看积分交易记录</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-md border px-4 py-2"
        >
          <option value="">全部类型</option>
          <option value="purchase">充值</option>
          <option value="consumption">消费</option>
          <option value="refund">退款</option>
          <option value="admin_add">管理员增加</option>
          <option value="admin_deduct">管理员扣除</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium">金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  余额后
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">描述</th>
                <th className="px-4 py-3 text-left text-sm font-medium">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    暂无交易记录
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(
                          tx.type
                        )}`}
                      >
                        {getTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{tx.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.userEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {tx.balanceAfter}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
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
              共 {total} 条记录，第 {page}/{totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
