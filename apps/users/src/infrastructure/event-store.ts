import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@app/common';

@Injectable()
export class EventStore {
  private readonly events: DomainEvent[] = [];

  append(event: DomainEvent): void {
    this.events.push(event);
  }

  forAggregate(aggregateId: string): DomainEvent[] {
    return this.events.filter((event) => event.aggregateId === aggregateId);
  }
}
