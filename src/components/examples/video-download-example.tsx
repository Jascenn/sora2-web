/**
 * Example Component: Video Download Usage
 *
 * This is a reference implementation showing how to use the useDownloadVideo hook
 * in your components to enable video downloading functionality.
 */

'use client'

import { useDownloadVideo } from '@/hooks/use-videos'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface VideoDownloadButtonProps {
  videoId: string
  videoTitle?: string
  disabled?: boolean
}

/**
 * Video Download Button Component
 *
 * Usage:
 * ```tsx
 * <VideoDownloadButton
 *   videoId="123e4567-e89b-12d3-a456-426614174000"
 *   videoTitle="My Video"
 * />
 * ```
 */
export function VideoDownloadButton({
  videoId,
  videoTitle,
  disabled = false
}: VideoDownloadButtonProps) {
  const downloadVideo = useDownloadVideo()

  const handleDownload = () => {
    downloadVideo.mutate(videoId)
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || downloadVideo.isPending}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {downloadVideo.isPending ? '下载中...' : '下载视频'}
    </Button>
  )
}

/**
 * Alternative: Icon-only Download Button
 *
 * Usage:
 * ```tsx
 * <VideoDownloadIconButton videoId="123e4567-e89b-12d3-a456-426614174000" />
 * ```
 */
export function VideoDownloadIconButton({
  videoId,
  disabled = false
}: Omit<VideoDownloadButtonProps, 'videoTitle'>) {
  const downloadVideo = useDownloadVideo()

  const handleDownload = () => {
    downloadVideo.mutate(videoId)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || downloadVideo.isPending}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="下载视频"
    >
      <Download className={`h-5 w-5 ${downloadVideo.isPending ? 'animate-pulse' : ''}`} />
    </button>
  )
}

/**
 * Example: Video List Item with Download
 *
 * This shows how to integrate the download functionality into a video list item
 */
export function VideoListItemExample({ video }: { video: any }) {
  const downloadVideo = useDownloadVideo()

  const handleDownload = () => {
    downloadVideo.mutate(video.id)
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium">{video.prompt}</h3>
        <p className="text-sm text-gray-500">
          {video.resolution} • {video.duration}s • {video.status}
        </p>
      </div>

      <div className="flex gap-2">
        {video.status === 'completed' && video.file_url && (
          <Button
            onClick={handleDownload}
            disabled={downloadVideo.isPending}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadVideo.isPending ? '下载中...' : '下载'}
          </Button>
        )}
      </div>
    </div>
  )
}
