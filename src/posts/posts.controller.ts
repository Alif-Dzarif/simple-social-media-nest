import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthData } from '../auth/dto/auth.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,

  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileInterceptor('media'))
  create(@Req() req: AuthData, @Body() createPostDto: CreatePostDto, @UploadedFile() file: Express.Multer.File) {
    return this.postsService.create(req.user.id, createPostDto, file);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get("random")
  getRandom() {
    return this.postsService.findRandom();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
