import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold">页面不存在</h2>
        <p className="text-muted-foreground max-w-md">
          抱歉,您访问的页面不存在或已被删除
        </p>
        <Link href="/">
          <Button className="mt-6">返回首页</Button>
        </Link>
      </div>
    </div>
  )
}
