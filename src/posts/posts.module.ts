import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VideoValidatorModule } from '../media/video-validator/video-validator.module';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB global ceiling
    }),
    VideoValidatorModule,
    MinioModule
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule { }
