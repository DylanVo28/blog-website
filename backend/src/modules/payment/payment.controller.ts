import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JobQueueService } from '../../jobs/job-queue.service';
import { AdminReviewDepositDto } from './dto/admin-review-deposit.dto';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly jobQueueService: JobQueueService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('methods')
  getPaymentMethods() {
    return this.paymentService.getAvailablePaymentMethods();
  }

  @UseGuards(JwtAuthGuard)
  @Post('deposits')
  createDeposit(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDepositDto,
  ) {
    return this.paymentService.createDeposit(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('deposits')
  getMyDeposits(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
  ) {
    return this.paymentService.listUserDeposits(userId, Number(page ?? 1));
  }

  @UseGuards(JwtAuthGuard)
  @Get('deposits/:id/status')
  getDepositStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') depositId: string,
  ) {
    return this.paymentService.getDepositStatus(userId, depositId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deposits/:id/confirm')
  confirmTransfer(
    @CurrentUser('sub') userId: string,
    @Param('id') depositId: string,
    @Body() dto: ConfirmDepositDto,
  ) {
    return this.paymentService.confirmDepositTransfer(userId, depositId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/deposits/pending')
  getPendingDeposits(@Query('page') page?: string) {
    return this.paymentService.listPendingDeposits(Number(page ?? 1));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/deposits/:id')
  reviewDeposit(
    @CurrentUser('sub') adminId: string,
    @Param('id') depositId: string,
    @Body() dto: AdminReviewDepositDto,
  ) {
    return this.paymentService.reviewDeposit(
      adminId,
      depositId,
      dto.approved,
      dto.note,
    );
  }

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
