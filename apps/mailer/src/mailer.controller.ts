import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MailerService } from './mailer.service';

@Controller()
export class MailerController {
  private readonly logger = new Logger(MailerController.name);

  constructor(private readonly mailerService: MailerService) {}

  // Pattern as in the webinar slides
  @MessagePattern({ cmd: 'user-create' })
  handleUserCreate(
    @Payload()
    payload: { email: string; name: string; correlationId?: string },
  ) {
    this.logger.log(
      `cmd=user-create correlationId=${payload.correlationId ?? '-'}`,
    );
    return this.mailerService.sendWelcome(payload);
  }
}
