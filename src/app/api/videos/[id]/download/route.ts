import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'

/**
 * Verify JWT token and extract user ID
 */
function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    return null
  }
}

/**
 * Download video endpoint
 * GET /api/videos/[id]/download
 *
 * Features:
 * - User authentication verification
 * - Video ownership validation
 * - Download from Supabase Storage or direct URL
 * - Proper content-disposition headers for download
 * - Download activity logging
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify Supabase admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase admin client not configured' },
        { status: 500 }
      )
    }

    const videoId = params.id

    // Validate video ID format
    if (!videoId || videoId.length < 10) {
      return NextResponse.json(
        { success: false, error: '无效的视频ID' },
        { status: 400 }
      )
    }

    // Get and verify authentication token
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录或登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: '登录状态无效，请重新登录' },
        { status: 401 }
      )
    }

    // Fetch video from database
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      console.error('Video not found:', videoError)
      return NextResponse.json(
        { success: false, error: '视频不存在' },
        { status: 404 }
      )
    }

    // Verify video ownership (only the owner can download)
    if (video.user_id !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '您没有权限下载此视频' },
        { status: 403 }
      )
    }

    // Check if video is completed and has file URL
    if (video.status !== 'completed' || !video.file_url) {
      return NextResponse.json(
        {
          success: false,
          error: '视频尚未生成完成或文件不可用',
          details: {
            status: video.status,
            hasFileUrl: !!video.file_url
          }
        },
        { status: 400 }
      )
    }

    // Log download activity (non-blocking)
    const logDownload = async () => {
      try {
        // You can add download tracking to metadata or create a separate downloads table
        const currentMetadata = video.metadata || {}
        const downloads = (currentMetadata.downloads || 0) + 1
        const downloadHistory = currentMetadata.download_history || []

        downloadHistory.push({
          timestamp: new Date().toISOString(),
          userId: user.userId,
          userEmail: user.email,
        })

        await supabaseAdmin
          .from('videos')
          .update({
            metadata: {
              ...currentMetadata,
              downloads,
              download_history: downloadHistory.slice(-10), // Keep last 10 downloads
              last_downloaded_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', videoId)
      } catch (error) {
        console.error('Failed to log download:', error)
        // Don't fail the download if logging fails
      }
    }

    // Log download asynchronously
    logDownload()

    // Generate download filename
    const fileExtension = video.file_url.split('.').pop()?.split('?')[0] || 'mp4'
    const sanitizedPrompt = video.prompt
      .substring(0, 50)
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    const filename = `sora_${sanitizedPrompt}_${videoId.substring(0, 8)}.${fileExtension}`

    // If the file_url is a full URL (e.g., from Supabase Storage or CDN)
    if (video.file_url.startsWith('http://') || video.file_url.startsWith('https://')) {
      // Fetch the video file
      const videoResponse = await fetch(video.file_url)

      if (!videoResponse.ok) {
        return NextResponse.json(
          { success: false, error: '无法获取视频文件' },
          { status: 500 }
        )
      }

      // Get the video content
      const videoBuffer = await videoResponse.arrayBuffer()
      const contentType = videoResponse.headers.get('content-type') || 'video/mp4'

      // Return video with download headers
      return new NextResponse(videoBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': videoBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    } else {
      // If file_url is a storage path (not a full URL)
      // This would be for Supabase Storage bucket paths
      const storagePath = video.file_url

      // Get signed URL from Supabase Storage
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const bucketName = 'videos' // Assuming videos are stored in a 'videos' bucket

      if (!supabaseUrl) {
        return NextResponse.json(
          { success: false, error: 'Storage configuration error' },
          { status: 500 }
        )
      }

      // Create a signed URL that expires in 1 hour
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from(bucketName)
        .createSignedUrl(storagePath, 3600) // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
        console.error('Failed to create signed URL:', signedUrlError)
        return NextResponse.json(
          { success: false, error: '无法生成下载链接' },
          { status: 500 }
        )
      }

      // Redirect to the signed URL with download headers
      return NextResponse.redirect(signedUrlData.signedUrl, {
        headers: {
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      })
    }
  } catch (error: any) {
    console.error('Video download error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '下载失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
