import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { UpdateFollowDto } from './dto/update-follow.dto';
import { AuthData } from '../auth/dto/auth.dto';
import { FilterFollowsQueryDto } from './dto/filter-follows-query';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) { }

  @Post()
  create(@Req() req: AuthData, @Body() createFollowDto: CreateFollowDto) {
    return this.followsService.create(req.user.id, createFollowDto);
  }

  @Get()
  findAll(@Query() query: FilterFollowsQueryDto) {
    return this.followsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followsService.findOne(id);
  }

  @Delete(':id')
  remove(@Req() req: AuthData, @Param('id') id: string) {
    return this.followsService.remove(req.user.id, id);
  }
}
