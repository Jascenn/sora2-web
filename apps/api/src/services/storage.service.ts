import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { promises as fs } from 'fs'
import path from 'path'

export class StorageService {
  private s3Client: S3Client | null = null
  private bucket: string = ''
  private uploadDir: string
  private provider: string

  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 's3'
    this.uploadDir = process.env.UPLOAD_DIR || './uploads'

    if (this.provider === 's3') {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      })
      this.bucket = process.env.AWS_S3_BUCKET || ''
    } else if (this.provider === 'local') {
      // 确保上传目录存在
      fs.mkdir(this.uploadDir, { recursive: true })
    } else {
      throw new Error(`Unsupported storage provider: ${this.provider}`)
    }
  }

  /**
   * Upload video to storage
   */
  async uploadVideo(
    buffer: Buffer,
    fileName: string,
    contentType = 'video/mp4'
  ): Promise<string> {
    try {
      if (this.provider === 's3') {
        if (!this.s3Client) {
          throw new Error('S3 client not initialized')
        }

        const key = `videos/${Date.now()}-${fileName}`

        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })

        await this.s3Client.send(command)

        return `https://${this.bucket}.s3.amazonaws.com/${key}`
      } else if (this.provider === 'local') {
        // 本地存储
        const videosDir = path.join(this.uploadDir, 'videos')
        await fs.mkdir(videosDir, { recursive: true })

        const localFileName = `${Date.now()}-${fileName}`
        const localPath = path.join(videosDir, localFileName)

        await fs.writeFile(localPath, buffer)

        // 返回可访问的 URL
        return `${process.env.BACKEND_URL}/uploads/videos/${localFileName}`
      } else {
        throw new Error(`Unsupported storage provider: ${this.provider}`)
      }
    } catch (error: any) {
      console.error('Storage Error:', error)
      throw new Error(`Failed to upload video: ${error.message}`)
    }
  }

  /**
   * Upload thumbnail to storage
   */
  async uploadThumbnail(
    buffer: Buffer,
    fileName: string
  ): Promise<string> {
    try {
      if (this.provider === 's3') {
        if (!this.s3Client) {
          throw new Error('S3 client not initialized')
        }

        const key = `thumbnails/${Date.now()}-${fileName}`

        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'image/jpeg',
        })

        await this.s3Client.send(command)

        return `https://${this.bucket}.s3.amazonaws.com/${key}`
      } else if (this.provider === 'local') {
        // 本地存储
        const thumbnailsDir = path.join(this.uploadDir, 'thumbnails')
        await fs.mkdir(thumbnailsDir, { recursive: true })

        const localFileName = `${Date.now()}-${fileName}`
        const localPath = path.join(thumbnailsDir, localFileName)

        await fs.writeFile(localPath, buffer)

        // 返回可访问的 URL
        return `${process.env.BACKEND_URL}/uploads/thumbnails/${localFileName}`
      } else {
        throw new Error(`Unsupported storage provider: ${this.provider}`)
      }
    } catch (error: any) {
      console.error('Storage Error:', error)
      throw new Error(`Failed to upload thumbnail: ${error.message}`)
    }
  }

  /**
   * Generate presigned download URL
   */
  async getDownloadUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
    try {
      if (!this.s3Client) {
        throw new Error('S3 client not initialized')
      }

      const key = fileUrl.split('.com/')[1]

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn })
    } catch (error: any) {
      console.error('Storage Error:', error)
      throw new Error(`Failed to generate download URL: ${error.message}`)
    }
  }
}
