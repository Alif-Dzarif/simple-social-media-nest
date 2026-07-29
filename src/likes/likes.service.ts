import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';
import { PostsService } from '../posts/posts.service';
import { FilterLikesQueryDto } from './dto/filter-likes-query.dto';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    private postService: PostsService
  ) { }
  async create(user_id: string, createLikeDto: CreateLikeDto) {
    const { post_id } = createLikeDto

    const post = await this.postService.findOne(post_id)

    if (!post) throw new NotFoundException("Post unavailable")

    const like = this.likeRepo.create({
      ...createLikeDto,
      user_id
    })

    return this.likeRepo.save(like)
  }

  async findAll(options: FilterLikesQueryDto) {
    const { page = 1, post_id, limit = 10 } = options

    const likes = await this.likeRepo
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.post', 'post')
      .leftJoinAndSelect('like.user', 'user')
      .select([
        'like.id',
        'like.user_id',
        'like.post_id',
        'user.id',
        'user.username',
        'post.id'
      ])

    if (post_id) {
      likes.andWhere('like.post_id = :post_id', { post_id })
    }

    const [data, total] = await likes
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data
    }
  }

  async findOne(id: string) {
    const like = await this.likeRepo
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.post', 'post')
      .leftJoinAndSelect('like.user', 'user')
      .select([
        'like.id',
        'like.user_id',
        'like.post_id',
        'user.id',
        'user.username',
        'post.id'
      ])
      .where('like.id = :id', { id })
      .getOne()

    if (!like) throw new NotFoundException("Data unavailable")

    return like
  }


  async remove(user_id: string, id: string) {
    const like = await this.likeRepo.findOneBy({ id })

    if (!like) throw new NotFoundException("Data unavailable")

    if (like.user_id !== user_id) throw new UnauthorizedException("User not allowed")

    const { affected } = await this.likeRepo.delete(id)

    if (!affected) throw new ConflictException("Failed to remove like")

    return { message: "Success remove like" }
  }
}
