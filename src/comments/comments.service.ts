import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Repository } from 'typeorm';
import { PostsService } from '../posts/posts.service';
import { FilterCommentsQueryDto } from './dto/filter-comments-query.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private postService: PostsService
  ) { }

  async create(user_id: string, createCommentDto: CreateCommentDto) {
    const { post_id } = createCommentDto
    const post = await this.postService.findOne(post_id)

    if (!post) throw new NotFoundException("Post unavailable")

    const comment = this.commentRepo.create({
      ...createCommentDto,
      user_id
    })

    return await this.commentRepo.save(comment);
  }

  async findAll(options: FilterCommentsQueryDto) {

    const { page = 1, post_id, limit = 10 } = options

    const comments = await this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post')
      .select([
        'comment.id',
        'comment.user_id',
        'comment.post_id',
        'comment.content',
        'user.id',
        'user.username',
        'post.id',
      ])

    if (post_id) {
      comments.andWhere('comment.post_id = :post_id', { post_id: post_id })
    }

    const [data, total] = await comments
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    return {
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data,
    }
  }

  async findOne(id: string) {
    const comment = await this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.post', 'post')
      .select([
        'comment.id',
        'comment.user_id',
        'comment.post_id',
        'comment.content',
        'user.id',
        'user.username',
        'post.id',
      ])
      .where('comment.id = :id', { id })
      .getOne()

    if (!comment) throw new NotFoundException("Comment Unavailable")

    return comment
  }

  async update(user_id: string, id: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentRepo.findOneBy({ id })

    if (!comment) throw new NotFoundException("Comment unavailable")

    if (comment.user_id !== user_id) throw new UnauthorizedException("User not allowed")

    Object.assign(comment, updateCommentDto)

    return await this.commentRepo.save(comment)
  }

  async remove(user_id: string, id: string) {
    const comment = await this.commentRepo.findOneBy({ id })

    if (!comment) throw new NotFoundException("Comment unavailable")

    if (comment.user_id !== user_id) throw new UnauthorizedException("User not allowed")

    const { affected } = await this.commentRepo.delete(id)

    if (!affected) throw new ConflictException("Failed to delete comment")

    return { message: "Success delete comment" }
  }
}
