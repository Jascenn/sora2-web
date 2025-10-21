"use client"

import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Sora2
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            隐私政策
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            最后更新于 2025年10月19日
          </p>
        </div>

        <div className="prose prose-lg mx-auto mt-12 rounded-lg border bg-white p-8 shadow-sm">
          <h2>1. 我们收集的信息</h2>
          <p>
            我们收集您在使用我们服务时提供给我们的信息，包括：
          </p>
          <ul>
            <li><strong>账户信息：</strong> 当您注册账户时，我们会收集您的昵称、电子邮件地址和密码（加密存储）。</li>
            <li><strong>用户内容：</strong> 我们会收集您为生成视频而提供的文本提示。我们还会存储您生成的视频。</li>
            <li><strong>交易信息：</strong> 如果您购买积分，我们会收集与交易相关的信息，例如您的购买历史。</li>
            <li><strong>使用信息：</strong> 我们会自动收集有关您如何与我们的服务互动的信息，例如您的 IP 地址、浏览器类型和访问时间。</li>
          </ul>

          <h2>2. 我们如何使用您的信息</h2>
          <p>
            我们使用您的信息来：
          </p>
          <ul>
            <li>提供、维护和改进我们的服务。</li>
            <li>处理您的交易并向您发送相关信息。</li>
            <li>就我们的服务与您沟通，包括通知、更新和支持消息。</li>
            <li>监控和分析趋势、使用情况和与我们服务相关的活动。</li>
            <li>保护 Sora2 和我们的用户。</li>
          </ul>

          <h2>3. 信息共享</h2>
          <p>
            我们不会与第三方分享您的个人信息，除非在以下情况下：
          </p>
          <ul>
            <li>经您同意。</li>
            <li>用于法律目的，例如响应法律程序或政府请求。</li>
            <li>为保护权利和财产。</li>
            <li>与我们的业务转让有关。</li>
          </ul>

          <h2>4. 数据安全</h2>
          <p>
            我们采取合理措施保护您的信息免遭丢失、盗窃、滥用和未经授权的访问。然而，没有任何安全系统是坚不可摧的。
          </p>

          <h2>5. Cookie</h2>
          <p>
            我们使用 Cookie 来操作和管理我们的服务。我们使用 httpOnly Cookie 进行身份验证，以增强安全性。这些 Cookie 对于我们服务的功能至关重要。
          </p>

          <h2>6. 您的选择</h2>
          <p>
            您可以随时访问和更新您的账户信息。您也可以随时删除您的账户，但请注意，我们可能会根据法律要求或出于合法的商业目的保留某些信息。
          </p>

          <h2>7. 联系我们</h2>
          <p>
            如果您对本隐私政策有任何疑问，请通过 contact@sora2.com 与我们联系。
          </p>

          <div className="mt-12 text-center">
            <Link href="/register">
              <span className="rounded-md bg-primary px-6 py-3 text-white shadow-sm hover:bg-primary/90">
                好的，我明白了
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
