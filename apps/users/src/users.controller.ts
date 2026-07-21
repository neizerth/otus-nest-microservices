import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from '@app/common';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'users.create' })
  create(@Payload() payload: CreateUserDto) {
    this.logger.log(
      `cmd=users.create correlationId=${payload.correlationId ?? '-'}`,
    );
    return this.usersService.create(payload);
  }

  @MessagePattern({ cmd: 'users.findOne' })
  findOne(@Payload() payload: { id: string; correlationId?: string }) {
    return this.usersService.findOne(payload.id);
  }

  @MessagePattern({ cmd: 'users.events' })
  events(@Payload() payload: { id: string; correlationId?: string }) {
    return this.usersService.getEvents(payload.id);
  }
}
