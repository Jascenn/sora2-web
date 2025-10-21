'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold text-red-600">管理后台错误</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>重试</Button>
          <Button variant="outline" onClick={() => window.location.href = '/admin'}>
            返回仪表盘
          </Button>
        </div>
      </div>
    </div>
  )
}
