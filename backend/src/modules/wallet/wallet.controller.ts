import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser('sub') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('transactions')
  getTransactions(@CurrentUser('sub') userId: string) {
    return this.walletService.getTransactions(userId);
  }

  @Post('deposit')
  deposit(
    @CurrentUser('sub') userId: string,
    @Body() dto: DepositDto,
  ) {
    return this.walletService.createDeposit(userId, dto);
  }

  @Post('withdraw')
  withdraw(
    @CurrentUser('sub') userId: string,
    @Body() dto: WithdrawDto,
  ) {
    return this.walletService.createWithdrawal(userId, dto);
  }

  @Get('earnings')
  getEarnings(@CurrentUser('sub') userId: string) {
    return this.walletService.getEarnings(userId);
  }
}
