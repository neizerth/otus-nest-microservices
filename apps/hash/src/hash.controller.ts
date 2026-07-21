import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HashService } from './hash.service';

@Controller()
export class HashController {
  private readonly logger = new Logger(HashController.name);

  constructor(private readonly hashService: HashService) {}

  @GrpcMethod('TaskService', 'GenerateHash')
  generateHash(data: { id: number; data: string }) {
    this.logger.log(`GenerateHash id=${data.id}`);
    return this.hashService.generateHash(data.id, data.data);
  }
}
