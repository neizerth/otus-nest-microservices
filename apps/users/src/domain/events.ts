import { DomainEvent } from '@app/common';

export type UserCreatedEvent = DomainEvent & {
  type: 'UserCreated';
};
