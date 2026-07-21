import { Injectable } from '@nestjs/common';
import { User } from '@app/common';

@Injectable()
export class UserRepository {
  private readonly store = new Map<string, User>();

  save(user: User): void {
    this.store.set(user.id, user);
  }

  findById(id: string): User | undefined {
    return this.store.get(id);
  }
}
