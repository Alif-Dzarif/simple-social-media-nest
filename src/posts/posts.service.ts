import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
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

  async create(createPostDto: CreatePostDto, file: Express.Multer.File) {
    let mediaKey: string | undefined;
    let mediaType: 'image' | 'video' | undefined;
    let mediaUrl: string | undefined

    if (file) {
      const result = await this.minioService.uploadBuffer(
        createPostDto.user_id,
        file.originalname,
        file.buffer,
        file.mimetype,
      );
      mediaKey = result.objectKey;
      mediaType = result.mediaType;
      mediaUrl = await this.minioService.getPresignedViewUrl(mediaKey);

      try {
        if (mediaType === 'video') {
          await this.videoValidator.validateDuration(mediaUrl);
        }

        const post = this.postRepo.create({ ...createPostDto, mediaKey, mediaType, mediaUrl });
        return await this.postRepo.save(post);
      } catch (error) {
        await this.minioService.deleteObject(mediaKey);
        throw error;
      }
    }
  }

  async findAll() {
    return this.postRepo.find()
  }

  async findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  async remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
