"use client"

import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Sora2
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            服务条款
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            最后更新于 2025年10月19日
          </p>
        </div>

        <div className="prose prose-lg mx-auto mt-12 rounded-lg border bg-white p-8 shadow-sm">
          <h2>1. 欢迎使用 Sora2</h2>
          <p>
            感谢您使用我们的服务。本服务条款（“条款”）规定了您对 Sora2
            网站、相关 API 和服务的访问和使用。请仔细阅读。
          </p>

          <h2>2. 账户</h2>
          <p>
            您需要一个账户才能使用我们的大部分服务。您有责任保护您的账户凭据，并对通过您的账户进行的所有活动负责。我们建议您使用强密码并定期更新。
          </p>

          <h2>3. 服务使用</h2>
          <p>
            您同意不滥用我们的服务。例如，您同意不：
          </p>
          <ul>
            <li>干扰我们的服务或尝试使用我们提供的接口和说明以外的方法访问它们。</li>
            <li>上传或生成任何非法、有害、威胁、辱骂、骚扰、侵权、诽谤、粗俗、淫秽、侵犯他人隐私、仇恨或在种族、民族或其他方面令人反感的内容。</li>
            <li>冒充任何个人或实体，或虚假陈述您与某人或实体的关系。</li>
          </ul>

          <h2>4. 内容所有权</h2>
          <p>
            您使用我们的服务生成的内容归您所有。但是，通过使用我们的服务，您授予 Sora2
            一个全球性的、非独家的、免版税的许可，以使用、复制、分发、准备衍生作品、展示和执行该内容，仅用于运营、推广和改进我们的服务。
          </p>

          <h2>5. 积分系统</h2>
          <p>
            视频生成需要消耗积分。积分可以通过购买获得，并且不可退款。我们保留随时更改积分价格和政策的权利。
          </p>

          <h2>6. 免责声明</h2>
          <p>
            我们的服务按“原样”提供。Sora2
            及其供应商和分销商明确否认任何形式的明示或暗示的保证，包括但不限于对适销性、特定用途的适用性和不侵权的暗示保证。
          </p>

          <h2>7. 条款变更</h2>
          <p>
            我们可能会不时修改这些条款。我们将通过在我们的网站上发布修订后的条款来通知您任何重大变更。您在变更生效后继续使用我们的服务即表示您同意修订后的条款。
          </p>

          <div className="mt-12 text-center">
            <Link href="/register">
              <span className="rounded-md bg-primary px-6 py-3 text-white shadow-sm hover:bg-primary/90">
                同意并继续
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
