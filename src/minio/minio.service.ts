// minio/minio.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Client } from 'minio';
import { ALLOWED_TYPES, SIZE_LIMITS } from '../common/constants/media.constant';

@Injectable()
export class MinioService {
  private client: Client;
  private bucket = process.env.MINIO_BUCKET || 'post-media';

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    });
  }

  private detectMediaType(contentType: string): 'image' | 'video' {
    if (ALLOWED_TYPES.image.includes(contentType)) return 'image';
    if (ALLOWED_TYPES.video.includes(contentType)) return 'video';
    throw new BadRequestException('Unsupported file type');
  }

  // for server-side upload (you already have the buffer via Multer)
  async uploadBuffer(
    userId: string,
    originalname: string,
    buffer: Buffer,
    contentType: string,
  ) {
    const mediaType = this.detectMediaType(contentType);

    if (buffer.length > SIZE_LIMITS[mediaType]) {
      throw new BadRequestException(
        `${mediaType} exceeds max size of ${SIZE_LIMITS[mediaType] / 1024 / 1024}MB`,
      );
    }

    const ext = originalname.split('.').pop();
    const objectKey = `posts/${mediaType}s/${userId}/${randomUUID()}.${ext}`;

    await this.client.putObject(this.bucket, objectKey, buffer, buffer.length, {
      'Content-Type': contentType,
    });

    return { objectKey, mediaType };
  }

  // keep this for the presigned-URL flow, if you use it elsewhere (e.g. direct client upload)
  async getPresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    declaredSize?: number,
  ) {
    const mediaType = this.detectMediaType(contentType);

    if (declaredSize && declaredSize > SIZE_LIMITS[mediaType]) {
      throw new BadRequestException(
        `${mediaType} exceeds max size of ${SIZE_LIMITS[mediaType] / 1024 / 1024}MB`,
      );
    }

    const ext = filename.split('.').pop();
    const objectKey = `posts/${mediaType}s/${userId}/${randomUUID()}.${ext}`;

    // was presignedGetObject — bug, should be presignedPutObject for uploads
    const uploadUrl = await this.client.presignedPutObject(this.bucket, objectKey, 600);

    return { uploadUrl, objectKey, mediaType };
  }

  async getPresignedViewUrl(objectKey: string) {
    return this.client.presignedGetObject(this.bucket, objectKey, 3600);
  }

  async deleteObject(objectKey: string) {
    await this.client.removeObject(this.bucket, objectKey); // was missing `await`
  }
}