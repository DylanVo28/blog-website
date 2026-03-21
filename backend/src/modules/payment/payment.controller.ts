import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('vnpay/callback')
  handleVnpayCallback(@Body() dto: PaymentCallbackDto) {
    return this.paymentService.handleVnpayCallback(dto);
  }

  @Post('momo/callback')
  handleMomoCallback(@Body() dto: PaymentCallbackDto) {
    return this.paymentService.handleMomoCallback(dto);
  }

  @Get('vnpay/return')
  handleVnpayReturn(@Query() query: Record<string, unknown>) {
    return this.paymentService.handleVnpayReturn(query);
  }
}
