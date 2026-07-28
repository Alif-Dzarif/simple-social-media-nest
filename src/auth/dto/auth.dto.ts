import { IsNotEmpty, IsString } from "class-validator";

export class AuthPayloadDto {
  @IsNotEmpty()
  @IsString()
  username!: string

  @IsNotEmpty()
  @IsString()
  password!: string
}

export class AuthData {
  user!: {
    id: string
    username: string
  }
}