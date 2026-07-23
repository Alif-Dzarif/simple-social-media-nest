import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Client } from 'minio'

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'], // .mov = quicktime
};

const SIZE_LIMITS = {
  image: 10 * 1024 * 1024,      // 5MB
  video: 100 * 1024 * 1024,    // 100MB
};

@Injectable()
export class MinioService {
  private client: Client
  private bucket = process.env.MINIO_BUCKET || 'post-media'

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    })
  }

  private detectMediaType(contentType: string): 'image' | 'video' {
    if (ALLOWED_TYPES.image.includes(contentType)) return 'image'
    if (ALLOWED_TYPES.video.includes(contentType)) return 'video'
    throw new BadRequestException('Unsupported file type')
  }

  async getPresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    declaredSize?: number
  ) {
    const mediaType = this.detectMediaType(contentType)

    if (declaredSize && declaredSize > SIZE_LIMITS[mediaType]) {
      throw new BadRequestException(
        `${mediaType} exceeds max size of ${SIZE_LIMITS[mediaType] / 1024 / 1024}MB`,
      );
    }

    const ext = filename.split('.').pop()
    const objectKey = `posts/${mediaType}s/${userId}/${randomUUID()}.${ext}`

    const uploadUrl = await this.client.presignedGetObject(this.bucket, objectKey, 600)

    return { uploadUrl, objectKey, mediaType }
  }

  async getPresignedViewUrl(
    objectKey: string
  ) {
    return this.client.presignedGetObject(this.bucket, objectKey, 3600)
  }

  async deleteObject(
    objectKey: string
  ) {
    this.client.removeObject(this.bucket, objectKey)
  }
}
