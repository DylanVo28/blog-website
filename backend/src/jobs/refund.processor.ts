import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RefundProcessor {
  private readonly logger = new Logger(RefundProcessor.name);

  async processExpiredQuestions() {
    this.logger.log('Refund processor scaffolded. BullMQ job wiring comes in Phase 3.');
    return [];
  }
}
