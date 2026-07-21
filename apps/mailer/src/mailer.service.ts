import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly sent: Array<Record<string, unknown>> = [];

  sendWelcome(user: {
    email: string;
    name: string;
    correlationId?: string;
  }) {
    const letter = {
      to: user.email,
      subject: `Welcome, ${user.name}!`,
      body: `Hi ${user.name}, your account is ready.`,
      correlationId: user.correlationId,
      sentAt: new Date().toISOString(),
    };

    this.sent.push(letter);
    this.logger.log(`Welcome email "sent" to ${user.email}`);

    return { success: true, letter };
  }
}
