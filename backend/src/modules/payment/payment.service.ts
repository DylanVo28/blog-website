import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { toNumber } from '../../common/utils/number.util';
import { DepositEntity } from '../wallet/entities/deposit.entity';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { MomoProvider } from './providers/momo.provider';
import { VnpayProvider } from './providers/vnpay.provider';

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DepositEntity)
    private readonly depositsRepository: Repository<DepositEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    private readonly vnpayProvider: VnpayProvider,
    private readonly momoProvider: MomoProvider,
  ) {}

  async handleVnpayCallback(dto: PaymentCallbackDto) {
    return this.processDepositCallback('vnpay', dto);
  }

  async handleMomoCallback(dto: PaymentCallbackDto) {
    return this.processDepositCallback('momo', dto);
  }

  async processQueuedCallback(
    provider: 'vnpay' | 'momo',
    dto: PaymentCallbackDto,
  ) {
    return this.processDepositCallback(provider, dto);
  }

  handleVnpayReturn(query: Record<string, unknown>) {
    return {
      provider: 'vnpay',
      status: 'received',
      query,
    };
  }

  private async processDepositCallback(
    provider: 'vnpay' | 'momo',
    dto: PaymentCallbackDto,
  ) {
    const verification =
      provider === 'vnpay'
        ? this.vnpayProvider.verifyCallback(dto as Record<string, unknown>)
        : this.momoProvider.verifyCallback(dto as Record<string, unknown>);

    const depositId = dto.orderId ?? dto.paymentRef;

    if (!depositId) {
      throw new NotFoundException('Deposit reference not found in callback.');
    }

    const deposit = await this.depositsRepository.findOne({
      where: [
        {
          id: depositId,
        },
        {
          paymentRef: depositId,
        },
      ],
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found.');
    }

    const isSuccessful = this.isSuccessfulStatus(dto.status);

    if (isSuccessful && deposit.status !== 'completed') {
      await this.dataSource.transaction(async (manager) => {
        const lockedWallet = await manager.getRepository(WalletEntity).findOne({
          where: {
            userId: deposit.userId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!lockedWallet) {
          throw new NotFoundException('Wallet not found for deposit.');
        }

        lockedWallet.balance = String(
          toNumber(lockedWallet.balance) + toNumber(deposit.amount),
        );
        await manager.save(WalletEntity, lockedWallet);

        deposit.status = 'completed';
        deposit.completedAt = new Date();
        deposit.paymentRef = dto.paymentRef ?? deposit.paymentRef ?? deposit.id;
        await manager.save(DepositEntity, deposit);

        await manager.save(
          TransactionEntity,
          manager.create(TransactionEntity, {
            senderId: null,
            receiverId: deposit.userId,
            amount: deposit.amount,
            type: 'deposit',
            status: 'completed',
            referenceId: deposit.id,
            referenceType: 'deposit',
            metadata: {
              provider,
              callbackStatus: dto.status ?? 'completed',
            },
          }),
        );
      });
    } else if (!isSuccessful && deposit.status === 'pending') {
      deposit.status = 'failed';
      deposit.paymentRef = dto.paymentRef ?? deposit.paymentRef ?? deposit.id;
      await this.depositsRepository.save(deposit);
    }

    const refreshedDeposit = await this.depositsRepository.findOne({
      where: {
        id: deposit.id,
      },
    });

    return {
      provider,
      verification,
      deposit: refreshedDeposit,
    };
  }

  private isSuccessfulStatus(status?: string) {
    if (!status) {
      return true;
    }

    return ['success', 'completed', 'paid', '00'].includes(
      status.toLowerCase(),
    );
  }
}
