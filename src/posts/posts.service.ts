import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { MinioService } from '../minio/minio.service';
import { VideoValidatorService } from '../media/video-validator/video-validator.service';
import { ALLOWED_TYPES } from '../common/constants/media.constant';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private minioService: MinioService,
    private videoValidator: VideoValidatorService
  ) { }

  async create(user_id: string, createPostDto: CreatePostDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Media file is required');
    }

    const result = await this.minioService.uploadBuffer(
      user_id,
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    const mediaKey = result.objectKey;
    const mediaType = result.mediaType;
    const mediaUrl = await this.minioService.getPresignedViewUrl(mediaKey);

    try {
      if (mediaType === 'video') {
        const tempUrl = await this.minioService.getPresignedViewUrl(mediaKey); // short-lived, used once, never saved
        await this.videoValidator.validateDuration(tempUrl);
      }

      const post = this.postRepo.create({
        ...createPostDto,
        mediaKey,
        mediaType,
        user_id,
      });
      return await this.postRepo.save(post);
    } catch (error) {
      await this.minioService.deleteObject(mediaKey);
      throw error;
    }
  }

  async findAll() {
    const posts = await this.postRepo.find();
    return Promise.all(posts.map((post) => this.attachMediaUrl(post)));
  }

  async findOne(id: string) {
    const post = await this.postRepo.findOneBy({ id });
    if (!post) throw new NotFoundException('Post not found');
    return this.attachMediaUrl(post);
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  async remove(id: string) {
    try {
      const post = await this.postRepo.findOneBy({ id })

      if (!post) throw new NotFoundException("User not found")

      await this.minioService.deleteObject(post.mediaKey)
      const { affected } = await this.postRepo.delete(id)

      if (!affected) throw new ConflictException("Failed to delete post")

      return { message: "Success delete post" }
    } catch (error) {
      throw error
    }
  }

  private async attachMediaUrl(post: Post) {
    return {
      ...post,
      mediaUrl: post.mediaKey ? await this.minioService.getPresignedViewUrl(post.mediaKey) : null,
    };
  }
}
