'use client'

export default function LionGenerateLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent border-purple-500"></div>
        <p className="text-gray-300 text-lg">🦁 LionCC 正在生成您的专属视频...</p>
      </div>
    </div>
  )
}