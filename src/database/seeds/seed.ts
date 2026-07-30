// src/database/seeds/seed.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);

  await usersService.create({
    username: 'kuroneko',
    email: 'kuroneko@mail.com',
    password: 'kuroneko',
  });


  console.log('Seeding complete');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});