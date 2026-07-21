import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MAILER_SERVICE, REDIS_OPTIONS } from '@app/common';
import { EventStore } from './infrastructure/event-store';
import { UserRepository } from './infrastructure/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MAILER_SERVICE,
        transport: Transport.REDIS,
        options: REDIS_OPTIONS,
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, EventStore],
})
export class UsersModule {}
