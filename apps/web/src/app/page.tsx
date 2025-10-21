import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

// Lazy load Header for better performance
const Header = dynamic(() => import("@/components/Header").then(mod => ({ default: mod.Header })), {
  ssr: true,
  loading: () => (
    <header className="border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16" />
    </header>
  ),
})

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-6">
            <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-pulse">
              ⚡ 基于 OpenAI Sora-2 最新技术
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
              文字变视频<br/>AI 让创意触手可及
            </h1>
            <p className="max-w-3xl text-lg md:text-xl text-muted-foreground mx-auto leading-relaxed">
              无需专业技能，无需昂贵设备<br/>
              <span className="font-semibold text-gray-700">只需一句话描述，即可生成电影级别的专业视频内容</span>
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">✓ 支持1080p高清</span>
              <span className="flex items-center gap-1">✓ 最长20秒</span>
              <span className="flex items-center gap-1">✓ 多种宽高比</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/generate">
              <Button size="lg" className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                开始免费创作 →
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 hover:bg-gray-50">
                查看示例作品
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 md:gap-12 pt-8 border-t max-w-3xl w-full">
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">视频生成量</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-primary">5K+</div>
              <div className="text-sm text-muted-foreground">创作者</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-primary">4.9/5</div>
              <div className="text-sm text-muted-foreground">用户评分</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center mb-16">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            核心优势
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
            为什么选择 Sora2
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            基于 OpenAI 最新 Sora-2 技术，为您提供前所未有的视频创作体验
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            title="简单易用"
            description="零门槛上手，无需视频剪辑经验。只需输入文字描述，AI 即刻为您生成专业级视频内容"
            icon="✨"
          />
          <FeatureCard
            title="高质量输出"
            description="支持 1080p 全高清画质，多种宽高比选择，最长可生成 20 秒流畅视频，满足各种使用场景"
            icon="🎬"
          />
          <FeatureCard
            title="灵活定价"
            description="透明的积分消耗体系，按实际使用付费。无隐藏费用，让每一分钱都物有所值"
            icon="💎"
          />
          <FeatureCard
            title="快速生成"
            description="采用高性能异步队列系统，智能任务调度，通常 3-5 分钟即可完成视频生成"
            icon="⚡"
          />
          <FeatureCard
            title="多样化风格"
            description="支持写实、动画、科幻等多种视觉风格，涵盖自然、城市、人物等丰富场景，激发无限创意"
            icon="🎨"
          />
          <FeatureCard
            title="安全可靠"
            description="企业级云存储，数据加密传输，严格的隐私保护政策，您的创作内容安全无忧"
            icon="🔒"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              简单三步
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
              从创意到成片，仅需片刻
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              无需复杂操作，三个简单步骤即可获得专业级视频作品
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <StepCard
              number="1"
              title="描述场景"
              description="用自然语言详细描述您想要的视频内容，可以包括场景、动作、氛围、风格等元素"
            />
            <StepCard
              number="2"
              title="AI 生成"
              description="Sora-2 强大的 AI 引擎理解您的创意，运用深度学习技术生成高质量视频内容"
            />
            <StepCard
              number="3"
              title="预览下载"
              description="在线预览生成结果，满意后一键下载高清视频，立即用于您的项目中"
            />
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">平均生成时间：3-5 分钟</p>
            <Link href="/generate">
              <Button size="lg" className="px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                立即开始创作 →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary via-primary to-primary/90 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10">
            <div className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              ⚡ 立即开始
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              将您的创意变为现实
              <br />
              <span className="text-white/90">AI 视频创作，从这里开始</span>
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed">
              加入超过 5000+ 创作者的行列，体验 AI 视频生成的无限可能性。
              <br />
              注册即送 <span className="font-bold text-yellow-300">50 积分</span>，立即开始免费创作！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg px-10 py-7 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  免费注册账号 →
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline" className="text-lg px-10 py-7 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  查看精彩案例
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm opacity-80">
              ✓ 无需信用卡 &nbsp;&nbsp; ✓ 注册即用 &nbsp;&nbsp; ✓ 随时取消
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div>
              <h3 className="font-bold text-2xl mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Sora2
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                基于 OpenAI Sora-2 最新技术的专业 AI 视频生成平台，让创作触手可及
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/generate" className="text-muted-foreground hover:text-primary transition-colors">
                视频生成
              </Link>
              <Link href="/gallery" className="text-muted-foreground hover:text-primary transition-colors">
                作品展示
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                个人中心
              </Link>
            </div>

            <div className="pt-6 border-t w-full max-w-2xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  © 2025 Sora2. Powered by OpenAI Sora-2
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    系统运行正常
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="group flex flex-col items-center space-y-4 rounded-xl border p-8 bg-white hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
      <div className="text-5xl group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-center text-muted-foreground leading-relaxed text-sm">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative flex flex-col items-center text-center space-y-4 group">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-3xl font-bold shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
        {number}
      </div>
      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">{description}</p>
      {number !== "3" && (
        <div className="hidden md:block absolute top-10 -right-16 text-4xl text-primary/20">→</div>
      )}
    </div>
  )
}
