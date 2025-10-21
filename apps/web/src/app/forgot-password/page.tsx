"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("请输入您的邮箱地址")
      return
    }
    setIsSubmitting(true)

    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 实际应用中，这里会调用 API 发送密码重置邮件
    // try {
    //   await api.post("/auth/forgot-password", { email })
    // } catch (error) {
    //   // ...
    // }

    setIsSubmitting(false)
    setIsSubmitted(true)
    toast.success("如果该邮箱已注册，您将收到一封密码重置邮件。")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Sora2
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            重置您的密码
          </h2>
          <p className="mt-2 text-muted-foreground">
            我们将向您的邮箱发送重置链接
          </p>
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-sm">
          {isSubmitted ? (
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">邮件已发送</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                请检查您的收件箱并按照说明操作。如果没有收到，请检查您的垃圾邮件文件夹。
              </p>
              <div className="mt-6">
                <Link href="/login">
                  <Button className="w-full">返回登录</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  邮箱地址
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "发送中..." : "发送重置链接"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
