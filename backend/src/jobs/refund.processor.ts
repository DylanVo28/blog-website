import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { QuestionsService } from '../modules/questions/questions.service';

@Injectable()
export class RefundProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RefundProcessor.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly questionsService: QuestionsService) {}

  onModuleInit() {
    void this.runRefundCycle();
    this.intervalId = setInterval(() => {
      void this.runRefundCycle();
    }, 5 * 60 * 1000);
    this.intervalId.unref?.();
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processExpiredQuestions() {
    return this.questionsService.processExpiredAuthorQuestions();
  }

  private async runRefundCycle() {
    try {
      const result = await this.processExpiredQuestions();
      if (result.processed > 0) {
        this.logger.log(
          `Processed ${result.processed} expired author question refund(s).`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Refund processor run failed.',
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
