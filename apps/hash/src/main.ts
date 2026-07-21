import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GRPC_URL } from '@app/common';
import { HashModule } from './hash.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    HashModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'task',
        protoPath: join(process.cwd(), 'proto/task.proto'),
        url: GRPC_URL,
      },
    },
  );

  await app.listen();
  console.log(`Hash gRPC microservice listening on ${GRPC_URL}`);
}

void bootstrap();
