export type CreateUserDto = {
  email: string;
  name: string;
  correlationId?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type DomainEvent = {
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  occurredAt: string;
};

export type GenerateHashDto = {
  id: number;
  data: string;
  correlationId?: string;
};
