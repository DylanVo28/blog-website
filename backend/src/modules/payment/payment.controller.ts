import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { JobQueueService } from '../../jobs/job-queue.service';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly jobQueueService: JobQueueService,
  ) {}

  @Post('vnpay/callback')
  async handleVnpayCallback(@Body() dto: PaymentCallbackDto) {
    try {
      const job = await this.jobQueueService.enqueuePaymentCallback({
        provider: 'vnpay',
        callback: dto,
      });

      return {
        provider: 'vnpay',
        status: 'queued',
        jobId: job.id ?? null,
        orderId: dto.orderId ?? dto.paymentRef ?? null,
      };
    } catch {
      return this.paymentService.handleVnpayCallback(dto);
    }
  }

  @Post('momo/callback')
  async handleMomoCallback(@Body() dto: PaymentCallbackDto) {
    try {
      const job = await this.jobQueueService.enqueuePaymentCallback({
        provider: 'momo',
        callback: dto,
      });

      return {
        provider: 'momo',
        status: 'queued',
        jobId: job.id ?? null,
        orderId: dto.orderId ?? dto.paymentRef ?? null,
      };
    } catch {
      return this.paymentService.handleMomoCallback(dto);
    }
  }

  @Get('vnpay/return')
  handleVnpayReturn(@Query() query: Record<string, unknown>) {
    return this.paymentService.handleVnpayReturn(query);
  }
}
