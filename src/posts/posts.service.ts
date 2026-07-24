import { BadRequestException, Injectable } from '@nestjs/common';
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
    let mediaKey: string | undefined
    let mediaType: 'image' | 'video' | undefined

    if (file) {
      mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image'
      const allowed = mediaType === 'image' ? ALLOWED_TYPES['image'] : ALLOWED_TYPES['video']

      if (!allowed.includes(file.mimetype)) {
        throw new BadRequestException(`Unsupported ${mediaType} type`);
      }

      const ext = file.originalname.split('.').pop()
      mediaKey = `posts/${mediaType}s/${createPostDto.user_id}/${randomUUID()}.${ext}`

      const result = await this.minioService.uploadBuffer(
        createPostDto.user_id,
        file.originalname,
        file.buffer,
        file.mimetype,
      );

      mediaKey = result.objectKey,
        mediaType = result.mediaType

      if (mediaType === 'video') {
        const viewUrl = await this.minioService.getPresignedViewUrl(mediaKey)

        try {
          await this.videoValidator.validateDuration(viewUrl)
        } catch (error) {
          await this.minioService.deleteObject(mediaKey)
          throw error
        }

        const post = this.postRepo.create({
          ...createPostDto,
          mediaKey: mediaKey,
          mediaType: mediaType
        })

        return await this.postRepo.save(post)
      }
    }
  }

  async findAll() {
    return `This action returns all posts`;
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
