import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthData } from '../auth/dto/auth.dto';
import { FilterLikesQueryDto } from './dto/filter-likes-query.dto';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Req() req: AuthData, @Body() createLikeDto: CreateLikeDto) {
    return this.likesService.create(req.user.id, createLikeDto);
  }

  @Get()
  findAll(@Query() query: FilterLikesQueryDto) {
    return this.likesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.likesService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Req() req: AuthData, @Param('id') id: string) {
    return this.likesService.remove(req.user.id, id);
  }
}
