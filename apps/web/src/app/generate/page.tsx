"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { generateVideoWithSSE } from "@/lib/sse"
import { getUser, removeUser } from "@/lib/auth"
import { userApi } from "@/lib/user"

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("")
  const [duration, setDuration] = useState(5)
  const [model, setModel] = useState("sora-2")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [isGenerating, setIsGenerating] = useState(false)
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [progressMessage, setProgressMessage] = useState("")
  const [progressPercent, setProgressPercent] = useState(0)

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const user = getUser()

      if (user) {
        setIsLoggedIn(true)
        // Load user balance
        try {
          const balanceRes = await userApi.getCreditBalance()
          setUserBalance(balanceRes.balance)
        } catch (error) {
          console.error("Failed to get balance:", error)
          // If cookie expired, clear user data
          if ((error as any).response?.status === 401) {
            removeUser()
            setIsLoggedIn(false)
          }
        }

        // Check if user is admin from cached user data
        if (user.role === "admin") {
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error("Failed to check login status:", error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("请输入视频描述")
      return
    }

    // 检查积分余额
    if (userBalance !== null && userBalance < estimatedCredits) {
      toast.error(`积分不足！需要 ${estimatedCredits} 积分，当前余额 ${userBalance} 积分。请前往个人中心充值`)
      return
    }

    const user = getUser()
    if (!user) {
      toast.error("请先登录")
      window.location.href = "/login"
      return
    }

    setIsGenerating(true)
    setProgressMessage("准备生成...")
    setProgressPercent(0)

    try {
      await generateVideoWithSSE(
        prompt,
        {
          duration,
          resolution: model === "sora-2" ? "720p" : model === "sora-2-hd" ? "1080p" : "1080p",
          aspectRatio,
          fps: 30,
          model,
        },
        undefined, // negativePrompt
        {
          onStart: (data) => {
            setProgressMessage(data.message || "开始生成...")
            setProgressPercent(5)
          },
          onProgress: (data) => {
            setProgressMessage(data.message)
            setProgressPercent(data.percent)
          },
          onComplete: (data) => {
            setProgressMessage("生成完成！")
            setProgressPercent(100)

            toast.success(
              `视频生成已开始！消耗积分：${data.video.costCredits}，剩余积分：${data.video.remainingCredits}`
            )

            // 更新用户余额
            setUserBalance(data.video.remainingCredits)

            // 跳转到视频列表
            setTimeout(() => {
              window.location.href = "/gallery"
            }, 1500)
          },
          onError: (error) => {
            toast.error(error.message || "视频生成失败")
            setProgressMessage("")
            setProgressPercent(0)
            setIsGenerating(false)
          },
          onClose: () => {
            // Connection closed
          },
        }
      )
    } catch (error: any) {
      const errorMsg = error.message || "视频生成失败"
      toast.error(errorMsg)
      setProgressMessage("")
      setProgressPercent(0)
      setIsGenerating(false)
    }
  }

  // 积分计算: sora-2: 3积分/10秒, sora-2-hd: 4积分/10秒, sora-2-pro: 5积分/10秒
  const getBaseCredits = () => {
    if (model === "sora-2") return 3
    if (model === "sora-2-hd") return 4
    if (model === "sora-2-pro") return 5
    return 3
  }
  const estimatedCredits = Math.ceil((duration / 10) * getBaseCredits())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Sora2
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/gallery" className="text-sm hover:text-primary">
              作品展示
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="text-sm hover:text-primary">
                  个人中心
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-700">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-4xl font-bold">AI 视频生成</h1>
          <p className="mb-8 text-muted-foreground">
            输入文字描述，让 AI 为你创造精美视频
          </p>

          <div className="rounded-lg border bg-white p-8 shadow-sm">
            {/* Prompt Input */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                视频描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.length <= 500) {
                    setPrompt(value)
                  }
                }}
                placeholder="描述你想要生成的视频内容，例如：一只可爱的猫咪在花园里玩耍，阳光明媚，镜头缓慢推进..."
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {prompt.length}/500 字符
              </p>
            </div>

            {/* Parameters */}
            <div className="mb-6 space-y-6">
              {/* Model Selection - Full Width */}
              <div>
                <label className="mb-3 block text-sm font-medium">
                  模型版本
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <ModelCard
                    value="sora-2"
                    selected={model === "sora-2"}
                    onClick={() => setModel("sora-2")}
                    title="Sora 2"
                    subtitle="720p 标准版"
                    price="3 积分/10秒"
                    features={["快速生成", "标清画质", "适合测试"]}
                  />
                  <ModelCard
                    value="sora-2-hd"
                    selected={model === "sora-2-hd"}
                    onClick={() => setModel("sora-2-hd")}
                    title="Sora 2 HD"
                    subtitle="1080p 高清版"
                    price="4 积分/10秒"
                    features={["高清画质", "细节丰富", "推荐使用"]}
                    recommended
                  />
                  <ModelCard
                    value="sora-2-pro"
                    selected={model === "sora-2-pro"}
                    onClick={() => setModel("sora-2-pro")}
                    title="Sora 2 Pro"
                    subtitle="1080p 专业版"
                    price="5 积分/10秒"
                    features={["专业品质", "最佳效果", "商业用途"]}
                  />
                </div>
              </div>

              {/* Duration and Aspect Ratio */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Duration */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    视频时长 <span className="text-xs text-muted-foreground">(最长 20 秒)</span>
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value={5}>5 秒 - 快速预览</option>
                    <option value={10}>10 秒 - 短视频</option>
                    <option value={15}>15 秒 - 标准时长</option>
                    <option value={20}>20 秒 - 完整叙事</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    💡 建议：5-10秒适合快速场景，15-20秒适合复杂叙事
                  </p>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    宽高比
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="16:9">16:9 横屏 - YouTube / 电脑观看</option>
                    <option value="9:16">9:16 竖屏 - TikTok / Reels / Shorts</option>
                    <option value="1:1">1:1 方形 - Instagram Feed</option>
                    <option value="4:3">4:3 标准 - 传统视频</option>
                    <option value="21:9">21:9 超宽 - 电影效果</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    📱 根据发布平台选择合适的宽高比
                  </p>
                </div>
              </div>
            </div>

            {/* Credits Info */}
            <div className="mb-6 rounded-md bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">预估消耗积分</p>
                  <p className="text-xs text-muted-foreground">
                    {duration}秒 · {model === "sora-2" ? "标准" : model === "sora-2-hd" ? "HD" : "Pro"} · {aspectRatio}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {estimatedCredits}
                  </p>
                  <p className="text-xs text-muted-foreground">积分</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  💰 定价: {model === "sora-2" ? "标准 3积分/10秒" : model === "sora-2-hd" ? "HD 4积分/10秒" : "Pro 5积分/10秒"}
                </span>
                {userBalance !== null && (
                  <span className={userBalance >= estimatedCredits ? "text-green-600" : "text-red-600"}>
                    当前余额: {userBalance} 积分 {userBalance < estimatedCredits && "⚠️ 余额不足"}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            {isGenerating && progressMessage && (
              <div className="mb-4 rounded-md bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">{progressMessage}</span>
                  <span className="text-sm font-bold text-blue-600">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? "生成中..." : "开始生成"}
            </Button>
          </div>

          {/* Tips */}
          <div className="mt-8 space-y-6">
            {/* Best Practices */}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
                💡 <span>Sora 2 提示词最佳实践</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">📝 主体描述</h4>
                    <p className="text-xs text-muted-foreground">详细描述主要对象的外观、动作和情感表现</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">🎬 镜头运动</h4>
                    <p className="text-xs text-muted-foreground">指定推进、拉远、环绕、跟随、静止等摄像机动作</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">🌅 光线设置</h4>
                    <p className="text-xs text-muted-foreground">柔和光线、金色时光、戏剧性照明、霓虹灯等</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">🏞️ 场景环境</h4>
                    <p className="text-xs text-muted-foreground">说明环境、时间、天气和整体氛围</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">🎨 视觉风格</h4>
                    <p className="text-xs text-muted-foreground">电影感、纪实风格、动画风、复古感、科幻等</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">⏱️ 时长建议</h4>
                    <p className="text-xs text-muted-foreground">5-10秒适合快速场景，15-20秒适合复杂叙事</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Prompts */}
            <div className="rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <h3 className="mb-4 font-semibold">📌 优质提示词示例</h3>
              <div className="space-y-4">
                <div className="rounded-md bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 mb-1">🐱 宠物场景</p>
                  <p className="text-sm">
                    一只橙色的小猫咪在铺满落叶的秋日公园长椅上打盹,阳光透过树叶洒下斑驳光影,镜头缓慢环绕,电影般的构图,暖色调,黄金时段照明
                  </p>
                </div>
                <div className="rounded-md bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 mb-1">🌆 城市风光</p>
                  <p className="text-sm">
                    现代化都市夜景,霓虹灯在雨后街道上反射出绚烂色彩,繁忙的十字路口车流如织,镜头从高处俯瞰缓缓推进,赛博朋克风格,强烈的对比和饱和度
                  </p>
                </div>
                <div className="rounded-md bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 mb-1">🌊 自然景观</p>
                  <p className="text-sm">
                    壮丽的海浪拍打着崎岖的海岸线,浪花四溅,日落时分金色阳光铺满海面,海鸥在空中盘旋,无人机镜头缓缓上升展现全景,史诗般的自然纪录片风格
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ModelCard({
  value,
  selected,
  onClick,
  title,
  subtitle,
  price,
  features,
  recommended
}: {
  value: string
  selected: boolean
  onClick: () => void
  title: string
  subtitle: string
  price: string
  features: string[]
  recommended?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-gray-200 bg-white hover:border-primary/50"
      }`}
    >
      {recommended && (
        <div className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
          推荐
        </div>
      )}
      <div className="mb-2">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="mb-3 text-lg font-bold text-primary">{price}</div>
      <ul className="space-y-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-primary">✓</span> {feature}
          </li>
        ))}
      </ul>
    </button>
  )
}
