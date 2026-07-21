import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateUserDto, MAILER_SERVICE, User } from '@app/common';
import { lastValueFrom, timeout } from 'rxjs';
import { randomUUID } from 'crypto';
import { UserCreatedEvent } from './domain/events';
import { EventStore } from './infrastructure/event-store';
import { UserRepository } from './infrastructure/user.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly events: EventStore,
    @Inject(MAILER_SERVICE) private readonly mailer: ClientProxy,
  ) {}

  async create(dto: CreateUserDto): Promise<{ user: User; mail: unknown }> {
    const user: User = {
      id: randomUUID(),
      email: dto.email,
      name: dto.name,
      createdAt: new Date().toISOString(),
    };

    this.users.save(user);

    const event: UserCreatedEvent = {
      type: 'UserCreated',
      aggregateId: user.id,
      payload: { email: user.email, name: user.name },
      correlationId: dto.correlationId,
      occurredAt: new Date().toISOString(),
    };
    this.events.append(event);

    this.logger.log(`User created id=${user.id}`);

    const mail = await lastValueFrom(
      this.mailer
        .send(
          { cmd: 'user-create' },
          {
            email: user.email,
            name: user.name,
            correlationId: dto.correlationId,
          },
        )
        .pipe(timeout(5000)),
    );

    return { user, mail };
  }

  findOne(id: string): User {
    const user = this.users.findById(id);
    if (!user) {
      throw new RpcException(`User ${id} not found`);
    }
    return user;
  }

  getEvents(id: string) {
    this.findOne(id);
    return this.events.forAggregate(id);
  }
}
