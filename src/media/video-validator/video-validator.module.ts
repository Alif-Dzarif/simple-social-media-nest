import { Module } from '@nestjs/common';
import { VideoValidatorService } from './video-validator.service';

@Module({
  providers: [VideoValidatorService],
  exports: [VideoValidatorService]
})
export class VideoValidatorModule { }
