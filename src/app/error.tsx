'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-red-600">出错了</h1>
        <h2 className="text-2xl font-semibold">抱歉,页面遇到了问题</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message || '发生了未知错误,请稍后再试'}
        </p>
        <div className="flex gap-4 justify-center mt-6">
          <Button onClick={reset}>重试</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}
