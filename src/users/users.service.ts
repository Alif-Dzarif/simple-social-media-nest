import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { hashPassword } from '../common/utils/hash.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) { }

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto
    const existing = await this.userRepo.findOneBy({ email })

    if (existing) {
      throw new ConflictException("Email already in use")
    }

    const hashedPassword = await hashPassword(password)

    const user = this.userRepo.create({
      ...createUserDto,
      password: hashedPassword
    })

    const { password: _, ...rest } = await this.userRepo.save(user)

    return rest
  }

  async findAll() {
    return await this.userRepo.find();
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOneBy({ id })

    if (!user) throw new NotFoundException({
      message: "user not exist"
    })

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto
    const user = await this.userRepo.findOneBy({ id })

    const user_obj = updateUserDto

    if (!user) throw new NotFoundException({
      message: "user not exist"
    })

    if (password) {
      user_obj.password = await hashPassword(password)
    }

    Object.assign(user, user_obj)

    return await this.userRepo.save(user);
  }

  async remove(id: string) {
    const user = await this.userRepo.findOneBy({ id })

    if (!user) throw new NotFoundException({
      message: "user not exist"
    })

    const removed = await this.userRepo.delete(id);

    if (!removed.affected) throw new ConflictException({ message: "Failed to delete user" })

    return { message: "Success delete user" }
  }
}
