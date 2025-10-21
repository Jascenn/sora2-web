'use client'

import { Button } from '@/components/ui/button'

export default function GenerateError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h2 className="text-2xl font-bold text-red-600">视频生成页面错误</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>重试</Button>
      </div>
    </div>
  )
}
