import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  PLATFORM_SYSTEM_DISPLAY_NAME,
  PLATFORM_SYSTEM_EMAIL,
  PLATFORM_SYSTEM_PASSWORD_HASH,
} from '../../common/constants';
import { toNumber } from '../../common/utils/number.util';
import { UserEntity } from '../users/entities/user.entity';
import { MomoProvider } from '../payment/providers/momo.provider';
import { VnpayProvider } from '../payment/providers/vnpay.provider';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { DepositEntity } from './entities/deposit.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { WithdrawalEntity } from './entities/withdrawal.entity';
import { WalletEntity } from './entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    @InjectRepository(DepositEntity)
    private readonly depositsRepository: Repository<DepositEntity>,
    @InjectRepository(WithdrawalEntity)
    private readonly withdrawalsRepository: Repository<WithdrawalEntity>,
    private readonly vnpayProvider: VnpayProvider,
    private readonly momoProvider: MomoProvider,
  ) {}

  async getWallet(userId: string) {
    const wallet = await this.ensureWalletForUser(userId);

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: toNumber(wallet.balance),
      totalEarned: toNumber(wallet.totalEarned),
      totalSpent: toNumber(wallet.totalSpent),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async getTransactions(userId: string) {
    await this.ensureWalletForUser(userId);
    const items = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.sender_id = :userId OR transaction.receiver_id = :userId', {
        userId,
      })
      .orderBy('transaction.created_at', 'DESC')
      .getMany();

    return {
      userId,
      items: items.map((item) => ({
        ...item,
        amount: toNumber(item.amount),
      })),
    };
  }

  async createDeposit(userId: string, dto: DepositDto) {
    await this.ensureWalletForUser(userId);

    const deposit = await this.depositsRepository.save(
      this.depositsRepository.create({
        userId,
        amount: String(dto.amount),
        paymentMethod: dto.paymentMethod,
        paymentRef: null,
        status: 'pending',
      }),
    );

    deposit.paymentRef = deposit.id;
    await this.depositsRepository.save(deposit);

    const paymentRequest =
      dto.paymentMethod === 'vnpay'
        ? this.vnpayProvider.createPaymentUrl(deposit.id, dto.amount)
        : this.momoProvider.createPaymentUrl(deposit.id, dto.amount);

    return {
      ...deposit,
      amount: toNumber(deposit.amount),
      paymentRequest,
    };
  }

  async createWithdrawal(userId: string, dto: WithdrawDto) {
    const wallet = await this.ensureWalletForUser(userId);

    if (toNumber(wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance.');
    }

    const withdrawal = await this.withdrawalsRepository.save(
      this.withdrawalsRepository.create({
        userId,
        amount: String(dto.amount),
        feeAmount: '0',
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
        bankHolder: dto.bankHolder,
        status: 'pending',
      }),
    );

    return {
      ...withdrawal,
      amount: toNumber(withdrawal.amount),
      feeAmount: toNumber(withdrawal.feeAmount),
    };
  }

  async getEarnings(userId: string) {
    const wallet = await this.ensureWalletForUser(userId);

    return {
      userId,
      availableToWithdraw: toNumber(wallet.balance),
      totalEarned: toNumber(wallet.totalEarned),
      totalSpent: toNumber(wallet.totalSpent),
    };
  }

  async ensureWalletForUser(
    userId: string,
    manager?: EntityManager,
  ): Promise<WalletEntity> {
    const userRepository = manager?.getRepository(UserEntity) ?? this.usersRepository;
    const walletRepository =
      manager?.getRepository(WalletEntity) ?? this.walletsRepository;

    const user = await userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    let wallet = await walletRepository.findOne({
      where: {
        userId,
      },
    });

    if (!wallet) {
      wallet = walletRepository.create({
        userId,
        balance: '0',
        totalEarned: '0',
        totalSpent: '0',
      });
      wallet = await walletRepository.save(wallet);
    }

    return wallet;
  }

  async ensurePlatformSystemWallet(
    manager?: EntityManager,
  ): Promise<WalletEntity> {
    const userRepository = manager?.getRepository(UserEntity) ?? this.usersRepository;
    const walletRepository =
      manager?.getRepository(WalletEntity) ?? this.walletsRepository;

    let systemUser = await userRepository.findOne({
      where: {
        email: PLATFORM_SYSTEM_EMAIL,
      },
    });

    if (!systemUser) {
      systemUser = await userRepository.save(
        userRepository.create({
          email: PLATFORM_SYSTEM_EMAIL,
          passwordHash: PLATFORM_SYSTEM_PASSWORD_HASH,
          displayName: PLATFORM_SYSTEM_DISPLAY_NAME,
          role: 'admin',
          isVerified: true,
        }),
      );
    }

    let wallet = await walletRepository.findOne({
      where: {
        userId: systemUser.id,
      },
    });

    if (!wallet) {
      wallet = await walletRepository.save(
        walletRepository.create({
          userId: systemUser.id,
          balance: '0',
          totalEarned: '0',
          totalSpent: '0',
        }),
      );
    }

    return wallet;
  }
}
