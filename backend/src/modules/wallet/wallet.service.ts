import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Injectable()
export class WalletService {
  getWallet(userId: string) {
    return {
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    };
  }

  getTransactions(userId: string) {
    return {
      userId,
      items: [],
    };
  }

  createDeposit(userId: string, dto: DepositDto) {
    return {
      id: randomUUID(),
      userId,
      status: 'pending',
      ...dto,
    };
  }

  createWithdrawal(userId: string, dto: WithdrawDto) {
    return {
      id: randomUUID(),
      userId,
      status: 'pending',
      feeAmount: 0,
      ...dto,
    };
  }

  getEarnings(userId: string) {
    return {
      userId,
      availableToWithdraw: 0,
      totalEarned: 0,
    };
  }
}
