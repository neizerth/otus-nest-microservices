import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import {
  CreateUserDto,
  GenerateHashDto,
  HASH_PACKAGE,
  HASH_SERVICE_NAME,
  USERS_SERVICE,
  withRetry,
} from '@app/common';
import { lastValueFrom, Observable, timeout } from 'rxjs';

interface TaskService {
  GenerateHash(data: {
    id: number;
    data: string;
  }): Observable<{ id: number; hash: string }>;
}

@Injectable()
export class ApiGatewayService implements OnModuleInit {
  private taskService!: TaskService;

  constructor(
    @Inject(USERS_SERVICE) private readonly users: ClientProxy,
    @Inject(HASH_PACKAGE) private readonly hashClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.taskService =
      this.hashClient.getService<TaskService>(HASH_SERVICE_NAME);
  }

  createUser(dto: CreateUserDto) {
    return withRetry(
      () =>
        lastValueFrom(
          this.users.send({ cmd: 'users.create' }, dto).pipe(timeout(8000)),
        ),
      { label: 'users.create' },
    );
  }

  getUser(id: string, correlationId?: string) {
    return withRetry(
      () =>
        lastValueFrom(
          this.users
            .send({ cmd: 'users.findOne' }, { id, correlationId })
            .pipe(timeout(5000)),
        ),
      { label: 'users.findOne' },
    );
  }

  getUserEvents(id: string, correlationId?: string) {
    return withRetry(
      () =>
        lastValueFrom(
          this.users
            .send({ cmd: 'users.events' }, { id, correlationId })
            .pipe(timeout(5000)),
        ),
      { label: 'users.events' },
    );
  }

  generateHash(dto: GenerateHashDto) {
    return withRetry(
      () =>
        lastValueFrom(
          this.taskService
            .GenerateHash({ id: dto.id, data: dto.data })
            .pipe(timeout(5000)),
        ),
      { label: 'hash.GenerateHash' },
    );
  }
}
