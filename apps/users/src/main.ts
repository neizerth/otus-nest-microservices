import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { REDIS_OPTIONS } from '@app/common';
import { UsersModule } from './users.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersModule,
    {
      transport: Transport.REDIS,
      options: REDIS_OPTIONS,
    },
  );

  await app.listen();
  console.log(`Users microservice listening on Redis ${REDIS_OPTIONS.host}:${REDIS_OPTIONS.port}`);
}

void bootstrap();
