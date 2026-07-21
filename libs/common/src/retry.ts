import { Logger } from '@nestjs/common';

const logger = new Logger('Retry');

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; delayMs?: number; label?: string } = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const delayMs = options.delayMs ?? 300;
  const label = options.label ?? 'operation';

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(
        `${label} failed (attempt ${attempt}/${retries}): ${String(error)}`,
      );
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}
