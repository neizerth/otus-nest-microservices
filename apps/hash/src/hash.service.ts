import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HashService {
  generateHash(id: number, data: string) {
    const hash = createHash('sha256').update(data).digest('hex');
    return { id, hash };
  }
}
