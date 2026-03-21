import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  async sendNotification(type: string, recipientId: string) {
    this.logger.log(`Notification scaffolded: ${type} -> ${recipientId}`);
    return {
      type,
      recipientId,
      queued: false,
    };
  }
}
