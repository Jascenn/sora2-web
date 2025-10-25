"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRegister } from "@/hooks"
import { registerSchema, type RegisterFormData } from "@/lib/schemas"

export default function RegisterPage() {
  const { mutate: register, isPending } = useRegister()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterFormData) => {
    register({
      email: data.email,
      password: data.password,
      nickname: data.nickname,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Sora2
          </Link>
          <p className="mt-2 text-muted-foreground">
            创建你的账户
          </p>
        </div>

        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="nickname" className="mb-2 block text-sm font-medium">
                昵称
              </label>
              <input
                id="nickname"
                type="text"
                {...registerField("nickname")}
                placeholder="输入你的昵称"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                邮箱地址
              </label>
              <input
                id="email"
                type="email"
                {...registerField("email")}
                placeholder="your@email.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                密码
              </label>
              <input
                id="password"
                type="password"
                {...registerField("password")}
                placeholder="至少 6 个字符，包含字母和数字"
                autoComplete="new-password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...registerField("confirmPassword")}
                placeholder="再次输入密码"
                autoComplete="new-password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 rounded" required />
              <span className="text-muted-foreground">
                我已阅读并同意{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  服务条款
                </Link>{" "}
                和{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  隐私政策
                </Link>
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "注册中..." : "注册账户"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">已有账户？</span>{" "}
            <Link href="/login" className="text-primary hover:underline">
              立即登录
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-blue-50 p-4">
          <p className="text-sm">
            <span className="font-semibold">🎁 新用户福利：</span>
            注册即送 <span className="font-bold text-primary">100 积分</span>，
            可生成多个 AI 视频！
          </p>
        </div>
      </div>
    </div>
  )
}
