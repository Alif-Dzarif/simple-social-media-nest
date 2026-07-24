import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,

  ) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileInterceptor('media'))
  create(@Body() createPostDto: CreatePostDto, @UploadedFile() file: Express.Multer.File) {
    return this.postsService.create(createPostDto, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get("random")
  getRandom() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
