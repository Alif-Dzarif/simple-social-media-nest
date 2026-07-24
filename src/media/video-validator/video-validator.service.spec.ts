import { Test, TestingModule } from '@nestjs/testing';
import { VideoValidatorService } from './video-validator.service';

describe('VideoValidatorService', () => {
  let service: VideoValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoValidatorService],
    }).compile();

    service = module.get<VideoValidatorService>(VideoValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
