import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { MinioService } from '../minio/minio.service';
import { VideoValidatorService } from '../media/video-validator/video-validator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { Like } from '../likes/entities/like.entity';
import { Comment } from '../comments/entities/comment.entity';

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
    const { entities, raw } = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .select([
        'post.id',
        'post.mediaKey',
        'post.mediaType',
        'post.caption',
        'post.hide',
        'user.id',
        'user.username',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(comment.id)', 'count')
          .from(Comment, 'comment')
          .where('comment.post_id = post.id');
      }, 'commentsCount')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(like.id)', 'count')
          .from(Like, 'like')
          .where('like.post_id = post.id');
      }, 'likesCount')
      .getRawAndEntities();

    return Promise.all(
      entities.map(async (post: Post, i: number) => {
        const withMedia = await this.attachMediaUrl(post);
        return {
          ...withMedia,
          count: {
            comment: parseInt(raw[i].commentsCount, 10) || 0,
            like: parseInt(raw[i].likesCount, 10) || 0,
          },
        };
      }),
    );
  }

  async findRandom() {
    const { entities, raw } = await this.postRepo
      .createQueryBuilder('post')
      .orderBy('RANDOM()') // MySQL: use 'RAND()' instead
      .limit(10) // however many you want to return
      .leftJoinAndSelect('post.user', 'user')
      .select([
        'post.id',
        'post.mediaKey',
        'post.mediaType',
        'post.caption',
        'post.hide',
        'user.id',
        'user.username',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(comment.id)', 'count')
          .from(Comment, 'comment')
          .where('comment.post_id = post.id');
      }, 'commentsCount')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(like.id)', 'count')
          .from(Like, 'like')
          .where('like.post_id = post.id');
      }, 'likesCount')
      .getRawAndEntities();

    return Promise.all(
      entities.map(async (post: Post, i: number) => {
        const withMedia = await this.attachMediaUrl(post);
        return {
          ...withMedia,
          count: {
            comment: parseInt(raw[i].commentsCount, 10) || 0,
            like: parseInt(raw[i].likesCount, 10) || 0,
          },
        };
      }),
    );
  }

  async findOne(id: string) {
    const { entities, raw } = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .select([
        'post.id',
        'post.mediaKey',
        'post.mediaType',
        'post.caption',
        'user.id',
        'user.username',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(comment.id)', 'count')
          .from(Comment, 'comment')
          .where('comment.post_id = post.id');
      }, 'commentsCount')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(like.id)', 'count')
          .from(Like, 'like')
          .where('like.post_id = post.id');
      }, 'likesCount')
      .where('post.id = :id', { id })
      .getRawAndEntities();

    const post = entities[0];
    if (!post) throw new NotFoundException('Post not found');

    const withMedia = await this.attachMediaUrl(post);
    return {
      ...withMedia,
      count: {
        comment: parseInt(raw[0].commentsCount, 10) || 0,
        like: parseInt(raw[0].likesCount, 10) || 0,
      },
    };
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const { hide } = updatePostDto
    const post = await this.postRepo.findOneBy({ id })

    const post_obj = updatePostDto

    if (!post) throw new NotFoundException({
      message: "Post not unavailable"
    })

    if (hide) {
      post_obj.hide = hide
    }

    Object.assign(post, post_obj)

    return await this.postRepo.save(post)
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
