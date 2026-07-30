import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowDto } from './dto/update-follow.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Repository } from 'typeorm';
import { FilterFollowsQueryDto } from './dto/filter-follows-query';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>
  ) { }

  async create(user_id: string, createFollowDto: CreateFollowDto) {
    const follow = await this.followRepo.create({
      ...createFollowDto,
      user_id
    })

    return await this.followRepo.save(follow)
  }

  async findAll(options: FilterFollowsQueryDto) {
    const { page = 1, user_id, limit = 10 } = options

    const follows = await this.followRepo
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.followers', 'followers')
      .leftJoinAndSelect('follow.following', 'following')
      .select([
        'follow.id',
        'follow.user_id',
        'follow.followee_id',
        'followers.id',
        'followers.username',
        'following.id',
        'following.username',
      ])

    if (user_id) {
      follows.andWhere('follow.user_id = :user_id', { user_id })
    }

    const [data, total] = await follows
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount()

    return {
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      data,
    }

  }

  async findOne(id: string) {
    const follow = await this.followRepo
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.followers', 'followers')
      .leftJoinAndSelect('follow.following', 'following')
      .select([
        'follow.id',
        'follow.user_id',
        'follow.followee_id',
        'followers.id',
        'followers.username',
        'following.id',
        'following.username',
      ])
      .where('follow.id = :id', { id })
      .getOne()

    if (!follow) throw new NotFoundException("Data unavailable")

    return follow
  }

  async remove(user_id: string, id: string) {
    const follow = await this.followRepo.findOneBy({ id })

    if (!follow) throw new NotFoundException("Data unavailable")

    if (follow.user_id !== user_id) throw new UnauthorizedException("User not allowed")

    const { affected } = await this.followRepo.delete(id)

    if (!affected) throw new ConflictException("Failed to unfollow")

    return { message: "Success unfollow" }
  }
}
