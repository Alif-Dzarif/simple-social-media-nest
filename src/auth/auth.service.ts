import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { compareHashedPassword } from '../common/utils/hash.util';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(username: string, password: string) {
    const message = "Incorrect Username or Password"

    const user = await this.userService.findOneByUsername(username)

    if (!user) throw new UnauthorizedException(message)

    const isMatch = await compareHashedPassword(password, user.password)

    if (!isMatch) throw new UnauthorizedException(message)

    return {
      token: this.jwtService.sign({
        id: user.id,
        username: user.username
      })
    }
  }
}
