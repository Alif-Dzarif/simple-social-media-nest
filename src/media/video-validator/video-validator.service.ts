import { BadRequestException, Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg'

@Injectable()
export class VideoValidatorService {
  private readonly MAX_DURATION_SECONDS = 90

  async validateDuration(sourceUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(sourceUrl, (err, metadata) => {
        if (err) {
          return reject(new BadRequestException('Could not read video metadata'));
        }

        const duration = metadata.format.duration ?? 0

        if (duration > this.MAX_DURATION_SECONDS) {
          return reject(
            new BadRequestException(`Video exceeds ${this.MAX_DURATION_SECONDS}s limit (got ${Math.round(duration)}s)`)
          )
        }

        resolve(duration)
      })
    })
  }
}
