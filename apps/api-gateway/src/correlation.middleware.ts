import { Injectable, NestMiddleware } from '@nestjs/common';
import { CORRELATION_HEADER } from '@app/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header(CORRELATION_HEADER);
    const correlationId = incoming?.trim() || randomUUID();
    req.headers[CORRELATION_HEADER] = correlationId;
    res.setHeader(CORRELATION_HEADER, correlationId);
    next();
  }
}
