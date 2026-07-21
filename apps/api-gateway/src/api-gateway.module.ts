import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  GRPC_URL,
  HASH_PACKAGE,
  REDIS_OPTIONS,
  USERS_SERVICE,
} from '@app/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { CorrelationIdMiddleware } from './correlation.middleware';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: USERS_SERVICE,
        transport: Transport.REDIS,
        options: REDIS_OPTIONS,
      },
      {
        name: HASH_PACKAGE,
        transport: Transport.GRPC,
        options: {
          package: 'task',
          protoPath: join(process.cwd(), 'proto/task.proto'),
          url: GRPC_URL,
        },
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService, CorrelationIdMiddleware],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
