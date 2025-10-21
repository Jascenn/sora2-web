import { db } from '../lib/db'
import { SoraService } from '../services/sora.service'

/**
 * Script to update video durations for all completed videos
 * This will fetch actual duration from video files and update the database
 */
async function updateVideoDurations() {
  console.log('🔄 Starting video duration update script...')

  const soraService = new SoraService()

  try {
    // Get all completed videos with file URLs
    const result = await db.query(
      `SELECT id, file_url as "fileUrl", duration, prompt
       FROM videos
       WHERE status = 'completed' AND file_url IS NOT NULL
       ORDER BY created_at DESC`
    )

    const videos = result.rows
    console.log(`📹 Found ${videos.length} completed videos to process`)

    if (videos.length === 0) {
      console.log('✅ No videos to update')
      return
    }

    let successCount = 0
    let failCount = 0
    let skippedCount = 0

    // Process each video
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      console.log(`\n[${i + 1}/${videos.length}] Processing video: ${video.id}`)
      console.log(`   Prompt: ${video.prompt.substring(0, 50)}...`)
      console.log(`   Current duration: ${video.duration}s`)

      try {
        // Get actual video duration
        console.log(`   ⏱️  Fetching actual duration from: ${video.fileUrl.substring(0, 60)}...`)
        const actualDuration = await soraService.getVideoDuration(video.fileUrl)

        if (actualDuration === null) {
          console.log(`   ⚠️  Could not determine duration, skipping`)
          skippedCount++
          continue
        }

        console.log(`   ✅ Actual duration: ${actualDuration}s`)

        // Update database if duration is different
        if (actualDuration !== video.duration) {
          await db.query(
            'UPDATE videos SET duration = $1, updated_at = NOW() WHERE id = $2',
            [actualDuration, video.id]
          )
          console.log(`   📝 Updated database: ${video.duration}s → ${actualDuration}s`)
          successCount++
        } else {
          console.log(`   ✓  Duration already correct, no update needed`)
          skippedCount++
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing video ${video.id}:`, error.message)
        failCount++
      }

      // Add a small delay to avoid overwhelming the system
      if (i < videos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Update Summary:')
    console.log(`   ✅ Successfully updated: ${successCount}`)
    console.log(`   ⚠️  Skipped (no change or error): ${skippedCount}`)
    console.log(`   ❌ Failed: ${failCount}`)
    console.log(`   📹 Total processed: ${videos.length}`)
    console.log('='.repeat(60))

  } catch (error: any) {
    console.error('❌ Script error:', error.message)
    throw error
  }
}

// Run the script
updateVideoDurations()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
