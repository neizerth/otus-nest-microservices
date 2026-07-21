import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { REDIS_OPTIONS } from '@app/common';
import { MailerModule } from './mailer.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MailerModule,
    {
      transport: Transport.REDIS,
      options: REDIS_OPTIONS,
    },
  );

  await app.listen();
  console.log(`Mailer microservice listening on Redis ${REDIS_OPTIONS.host}:${REDIS_OPTIONS.port}`);
}

void bootstrap();
