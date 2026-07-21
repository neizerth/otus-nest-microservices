export const USERS_SERVICE = 'USERS_SERVICE';
export const MAILER_SERVICE = 'MAILER_SERVICE';
export const HASH_PACKAGE = 'TASK_PACKAGE';
export const HASH_SERVICE_NAME = 'TaskService';

export const REDIS_OPTIONS = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const GRPC_URL = process.env.GRPC_URL ?? '127.0.0.1:50051';
export const CORRELATION_HEADER = 'x-correlation-id';
