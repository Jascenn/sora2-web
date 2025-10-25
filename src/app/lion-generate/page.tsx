'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function LionGeneratePage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🦁 LionCC Video Generator
          </h1>
          <p className="text-gray-300 text-lg">
            高质量AI视频生成工具，支持多种风格和比例
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">🦁 生成视频</h2>
            <p className="text-gray-300 mb-6">
              此功能正在开发中，敬请期待！
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              {isGenerating ? '生成中...' : '生成视频'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}