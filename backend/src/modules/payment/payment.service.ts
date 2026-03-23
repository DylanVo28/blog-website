import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { JobQueueService } from '../../jobs/job-queue.service';
import { toNumber } from '../../common/utils/number.util';
import { UserEntity } from '../users/entities/user.entity';
import { DepositEntity } from '../wallet/entities/deposit.entity';
import { TransactionEntity } from '../wallet/entities/transaction.entity';
import { WalletEntity } from '../wallet/entities/wallet.entity';
import { AdminReviewDepositDto } from './dto/admin-review-deposit.dto';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { MomoProvider } from './providers/momo.provider';
import { VnpayProvider } from './providers/vnpay.provider';
import { DepositCodeService } from './services/deposit-code.service';
import { MomoQrService } from './services/momo-qr.service';
import { VietQrService } from './services/viet-qr.service';

type ReviewableDepositStatus = 'pending' | 'user_confirmed';
type ManualDepositMethod = 'momo_qr' | 'vcb_qr';
type BankWebhookSource = 'casso' | 'sepay';

interface ParsedQrData {
  deepLink: string | null;
  raw: string | null;
}

interface MomoQrConfig {
  phone: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  expireMinutes: number;
  allowedAmounts: number[];
}

interface VcbQrConfig {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  template: string;
  minAmount: number;
  maxAmount: number;
  expireMinutes: number;
  allowedAmounts: number[];
}

interface NormalizedBankWebhookTransaction {
  transactionId: string;
  amount: number;
  description: string;
  occurredAt: Date | null;
  raw: Record<string, unknown>;
  source: BankWebhookSource;
}

@Injectable()
export class PaymentService {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly REVIEWABLE_DEPOSIT_STATUSES: ReviewableDepositStatus[] = [
    'pending',
    'user_confirmed',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly jobQueueService: JobQueueService,
    @InjectRepository(DepositEntity)
    private readonly depositsRepository: Repository<DepositEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly vnpayProvider: VnpayProvider,
    private readonly momoProvider: MomoProvider,
    private readonly momoQrService: MomoQrService,
    private readonly vietQrService: VietQrService,
    private readonly depositCodeService: DepositCodeService,
  ) {}

  async createDeposit(userId: string, dto: CreateDepositDto) {
    await this.expireOverdueDeposits({
      userId,
    });

    const paymentMethod = dto.paymentMethod ?? 'momo_qr';

    switch (paymentMethod) {
      case 'momo_qr':
        return this.createMomoQrDeposit(userId, dto.amount);
      case 'vcb_qr':
        return this.createVcbQrDeposit(userId, dto.amount);
      default:
        throw new BadRequestException(
          'Flow này chỉ hỗ trợ MoMo QR cá nhân hoặc QR Vietcombank.',
        );
    }
  }

  async confirmDepositTransfer(
    userId: string,
    depositId: string,
    dto: ConfirmDepositDto,
  ) {
    const deposit = await this.depositsRepository.findOne({
      where: {
        id: depositId,
        userId,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Không tìm thấy giao dịch nạp tiền.');
    }

    if (deposit.paymentMethod !== 'momo_qr') {
      throw new BadRequestException(
        'Chỉ deposit MoMo QR mới cần người dùng xác nhận thủ công.',
      );
    }

    const freshDeposit = await this.syncDepositExpiration(deposit);

    if (freshDeposit.status === 'expired') {
      throw new BadRequestException(
        'Mã nạp tiền đã hết hạn. Vui lòng tạo yêu cầu mới.',
      );
    }

    if (
      !PaymentService.REVIEWABLE_DEPOSIT_STATUSES.includes(
        freshDeposit.status as ReviewableDepositStatus,
      )
    ) {
      throw new BadRequestException(
        `Deposit đang ở trạng thái "${freshDeposit.status}", không thể xác nhận chuyển khoản.`,
      );
    }

    freshDeposit.status = 'user_confirmed';
    freshDeposit.userConfirmedAt = freshDeposit.userConfirmedAt ?? new Date();
    freshDeposit.transferProofUrl = dto.proofImageUrl?.trim() || null;

    const saved = await this.depositsRepository.save(freshDeposit);

    return {
      message: 'Đã ghi nhận xác nhận chuyển tiền. Admin sẽ duyệt trong ít phút.',
      deposit: this.toDepositResponse(saved),
    };
  }

  async getDepositStatus(userId: string, depositId: string) {
    const deposit = await this.depositsRepository.findOne({
      where: {
        id: depositId,
        userId,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Không tìm thấy giao dịch nạp tiền.');
    }

    const freshDeposit = await this.syncDepositExpiration(deposit);
    return this.toDepositResponse(freshDeposit);
  }

  async listUserDeposits(userId: string, page = PaymentService.DEFAULT_PAGE) {
    await this.expireOverdueDeposits({
      userId,
    });

    const currentPage = this.normalizePage(page);
    const items = await this.depositsRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (currentPage - 1) * PaymentService.DEFAULT_LIMIT,
      take: PaymentService.DEFAULT_LIMIT,
    });

    return {
      page: currentPage,
      items: items.map((item) => this.toDepositResponse(item)),
    };
  }

  async getAvailablePaymentMethods() {
    const momoConfig = this.readMomoQrConfig();
    const vcbConfig = this.readVcbQrConfig();

    return {
      items: [
        {
          method: 'momo_qr',
          label: 'MoMo QR cá nhân',
          description:
            'Quét QR và xác nhận chuyển khoản để admin duyệt thủ công.',
          minAmount: momoConfig.minAmount,
          maxAmount: momoConfig.maxAmount,
          enabled: this.isMomoQrConfigured(momoConfig),
          expireMinutes: momoConfig.expireMinutes,
          autoConfirm: false,
          allowedAmounts: momoConfig.allowedAmounts,
          receiver: {
            phone: momoConfig.phone,
            name: momoConfig.name,
            bankCode: null,
            bankName: null,
            accountNumber: null,
          },
        },
        {
          method: 'vcb_qr',
          label: 'VCB QR tự động',
          description:
            'Quét VietQR và hệ thống sẽ tự cộng ví khi webhook ngân hàng khớp nội dung.',
          minAmount: vcbConfig.minAmount,
          maxAmount: vcbConfig.maxAmount,
          enabled: this.isVcbQrConfigured(vcbConfig),
          expireMinutes: vcbConfig.expireMinutes,
          autoConfirm: true,
          allowedAmounts: vcbConfig.allowedAmounts,
          receiver: {
            phone: null,
            name: vcbConfig.accountName,
            bankCode: vcbConfig.bankCode,
            bankName: vcbConfig.bankName,
            accountNumber: vcbConfig.accountNumber,
          },
        },
      ],
    };
  }

  async listPendingDeposits(page = PaymentService.DEFAULT_PAGE) {
    await this.expireOverdueDeposits();

    const currentPage = this.normalizePage(page);
    const items = await this.depositsRepository
      .createQueryBuilder('deposit')
      .where('deposit.payment_method = :method', {
        method: 'momo_qr',
      })
      .andWhere('deposit.status IN (:...statuses)', {
        statuses: PaymentService.REVIEWABLE_DEPOSIT_STATUSES,
      })
      .orderBy(
        `CASE WHEN deposit.status = 'user_confirmed' THEN 0 ELSE 1 END`,
        'ASC',
      )
      .addOrderBy('deposit.created_at', 'DESC')
      .skip((currentPage - 1) * PaymentService.DEFAULT_LIMIT)
      .take(PaymentService.DEFAULT_LIMIT)
      .getMany();

    if (!items.length) {
      return {
        page: currentPage,
        items: [],
      };
    }

    const users = await this.usersRepository.find({
      where: {
        id: In([...new Set(items.map((item) => item.userId))]),
      },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      page: currentPage,
      items: items.map((item) => ({
        ...this.toDepositResponse(item),
        user: userMap.has(item.userId)
          ? {
              id: userMap.get(item.userId)?.id,
              email: userMap.get(item.userId)?.email ?? null,
              displayName: userMap.get(item.userId)?.displayName ?? null,
            }
          : null,
      })),
    };
  }

  async reviewDeposit(
    adminId: string,
    depositId: string,
    approved: AdminReviewDepositDto['approved'],
    note?: AdminReviewDepositDto['note'],
  ) {
    const savedDeposit = await this.dataSource.transaction(async (manager) => {
      const depositRepository = manager.getRepository(DepositEntity);
      const walletRepository = manager.getRepository(WalletEntity);
      const transactionRepository = manager.getRepository(TransactionEntity);

      const deposit = await depositRepository.findOne({
        where: {
          id: depositId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!deposit) {
        throw new NotFoundException('Không tìm thấy deposit cần duyệt.');
      }

      if (deposit.paymentMethod !== 'momo_qr') {
        throw new BadRequestException(
          'Chỉ deposit MoMo QR mới cần admin duyệt thủ công.',
        );
      }

      if (this.isDepositExpired(deposit)) {
        deposit.status = 'expired';
        await depositRepository.save(deposit);
        throw new BadRequestException('Deposit đã hết hạn, không thể duyệt.');
      }

      if (
        !PaymentService.REVIEWABLE_DEPOSIT_STATUSES.includes(
          deposit.status as ReviewableDepositStatus,
        )
      ) {
        throw new BadRequestException(
          `Deposit đang ở trạng thái "${deposit.status}", không thể duyệt.`,
        );
      }

      if (!approved) {
        deposit.status = 'failed';
        deposit.adminConfirmedBy = adminId;
        deposit.adminNote = note?.trim() || 'Admin từ chối giao dịch này.';
        return depositRepository.save(deposit);
      }

      let wallet = await walletRepository.findOne({
        where: {
          userId: deposit.userId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!wallet) {
        wallet = await walletRepository.save(
          walletRepository.create({
            userId: deposit.userId,
            balance: '0',
            totalEarned: '0',
            totalSpent: '0',
          }),
        );
      }

      wallet.balance = String(
        toNumber(wallet.balance) + toNumber(deposit.amount),
      );
      await walletRepository.save(wallet);

      deposit.status = 'completed';
      deposit.adminConfirmedBy = adminId;
      deposit.adminNote = note?.trim() || null;
      deposit.completedAt = new Date();

      const saved = await depositRepository.save(deposit);

      await transactionRepository.save(
        transactionRepository.create({
          senderId: null,
          receiverId: deposit.userId,
          amount: deposit.amount,
          type: 'deposit',
          status: 'completed',
          referenceId: deposit.id,
          referenceType: 'deposit',
          metadata: {
            provider: deposit.paymentMethod ?? 'momo_qr',
            depositCode: deposit.depositCode,
            approvedBy: adminId,
            reviewMode: 'manual',
          },
        }),
      );

      return saved;
    });

    return {
      success: true,
      deposit: this.toDepositResponse(savedDeposit),
    };
  }

  async handleVnpayCallback(dto: PaymentCallbackDto) {
    return this.processDepositCallback('vnpay', dto);
  }

  async handleMomoCallback(dto: PaymentCallbackDto) {
    return this.processDepositCallback('momo', dto);
  }

  async handleCassoWebhook(payload: Record<string, unknown>) {
    const transactions = this.normalizeCassoTransactions(payload);
    const summary = await this.processBankWebhookTransactions(transactions);

    return {
      success: true,
      provider: 'casso',
      ...summary,
    };
  }

  async handleSepayWebhook(payload: Record<string, unknown>) {
    const transactions = this.normalizeSepayTransactions(payload);
    const summary = await this.processBankWebhookTransactions(transactions);

    return {
      success: true,
      provider: 'sepay',
      ...summary,
    };
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

  async expireDeposit(depositId: string) {
    const deposit = await this.depositsRepository.findOne({
      where: {
        id: depositId,
      },
    });

    if (!deposit) {
      return null;
    }

    const freshDeposit = await this.syncDepositExpiration(deposit);
    return this.toDepositResponse(freshDeposit);
  }

  private async createMomoQrDeposit(userId: string, amount: number) {
    const config = this.getMomoQrConfig();
    this.validateManualDepositAmount(
      amount,
      config.minAmount,
      config.maxAmount,
      config.allowedAmounts,
      'MoMo QR',
    );

    const existingDeposit = await this.findActiveManualDeposit(
      userId,
      'momo_qr',
    );

    if (existingDeposit) {
      const refreshedDeposit = await this.refreshManualMomoQrDeposit(
        existingDeposit,
        config,
      );
      return this.formatDepositResponse(refreshedDeposit);
    }

    const depositCode = await this.depositCodeService.generateUniqueCode();
    const qrPayload = this.momoQrService.generateScanPayload({
      phone: config.phone,
      name: config.name,
      amount,
      comment: depositCode,
    });
    const qrImageUrl = await this.momoQrService.generateQrDataUrl(qrPayload);

    const expiresAt = new Date(Date.now() + config.expireMinutes * 60_000);
    const deposit = await this.depositsRepository.save(
      this.depositsRepository.create({
        userId,
        amount: String(amount),
        depositCode,
        paymentMethod: 'momo_qr',
        paymentRef: null,
        receiverPhone: config.phone,
        receiverName: config.name,
        bankCode: null,
        bankName: null,
        accountNumber: null,
        qrData: JSON.stringify({
          deepLink: null,
          raw: qrPayload,
        }),
        qrImageUrl,
        status: 'pending',
        expiresAt,
        matchedAt: null,
        webhookData: null,
      }),
    );

    this.enqueueDepositExpiry(deposit.id, config.expireMinutes);

    return this.formatDepositResponse(deposit);
  }

  private async createVcbQrDeposit(userId: string, amount: number) {
    const config = this.getVcbQrConfig();
    this.validateManualDepositAmount(
      amount,
      config.minAmount,
      config.maxAmount,
      config.allowedAmounts,
      'VCB QR',
    );

    const existingDeposit = await this.findActiveManualDeposit(userId, 'vcb_qr');

    if (existingDeposit) {
      const refreshedDeposit = await this.refreshVcbQrDeposit(
        existingDeposit,
        config,
      );
      return this.formatDepositResponse(refreshedDeposit);
    }

    const depositCode = await this.depositCodeService.generateUniqueCode();
    const qrImageUrl = this.vietQrService.generateQrUrl({
      bankCode: config.bankCode,
      accountNumber: config.accountNumber,
      accountName: config.accountName,
      amount,
      description: depositCode,
      template: config.template,
    });

    const expiresAt = new Date(Date.now() + config.expireMinutes * 60_000);
    const deposit = await this.depositsRepository.save(
      this.depositsRepository.create({
        userId,
        amount: String(amount),
        depositCode,
        paymentMethod: 'vcb_qr',
        paymentRef: null,
        receiverPhone: null,
        receiverName: config.accountName,
        bankCode: config.bankCode,
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        qrData: null,
        qrImageUrl,
        status: 'pending',
        expiresAt,
        matchedAt: null,
        webhookData: null,
      }),
    );

    this.enqueueDepositExpiry(deposit.id, config.expireMinutes);

    return this.formatDepositResponse(deposit);
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

    if (
      isSuccessful &&
      PaymentService.REVIEWABLE_DEPOSIT_STATUSES.includes(
        deposit.status as ReviewableDepositStatus,
      )
    ) {
      await this.dataSource.transaction(async (manager) => {
        const walletRepository = manager.getRepository(WalletEntity);
        const depositRepository = manager.getRepository(DepositEntity);

        let lockedWallet = await walletRepository.findOne({
          where: {
            userId: deposit.userId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!lockedWallet) {
          lockedWallet = await walletRepository.save(
            walletRepository.create({
              userId: deposit.userId,
              balance: '0',
              totalEarned: '0',
              totalSpent: '0',
            }),
          );
        }

        lockedWallet.balance = String(
          toNumber(lockedWallet.balance) + toNumber(deposit.amount),
        );
        await walletRepository.save(lockedWallet);

        deposit.status = 'completed';
        deposit.completedAt = new Date();
        deposit.paymentRef = dto.paymentRef ?? deposit.paymentRef ?? deposit.id;
        await depositRepository.save(deposit);

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
    } else if (
      !isSuccessful &&
      PaymentService.REVIEWABLE_DEPOSIT_STATUSES.includes(
        deposit.status as ReviewableDepositStatus,
      )
    ) {
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
      deposit: refreshedDeposit ? this.toDepositResponse(refreshedDeposit) : null,
    };
  }

  private async processBankWebhookTransactions(
    transactions: NormalizedBankWebhookTransaction[],
  ) {
    let matched = 0;
    let ignored = 0;

    for (const transaction of transactions) {
      const handled = await this.processBankWebhookTransaction(transaction);

      if (handled) {
        matched += 1;
      } else {
        ignored += 1;
      }
    }

    return {
      received: transactions.length,
      matched,
      ignored,
    };
  }

  private async processBankWebhookTransaction(
    transaction: NormalizedBankWebhookTransaction,
  ) {
    if (transaction.amount <= 0) {
      return false;
    }

    const depositCode = this.depositCodeService.parseDepositCode(
      transaction.description,
    );

    if (!depositCode) {
      return false;
    }

    const deposit = await this.depositsRepository.findOne({
      where: {
        depositCode,
        paymentMethod: 'vcb_qr',
        status: 'pending',
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!deposit) {
      return false;
    }

    if (this.isDepositExpired(deposit)) {
      await this.syncDepositExpiration(deposit);
      return false;
    }

    const expectedAmount = toNumber(deposit.amount);
    const creditedAmount = this.calculateCreditedVcbAmount(
      transaction.amount,
      expectedAmount,
    );

    if (creditedAmount <= 0) {
      return false;
    }

    return this.dataSource.transaction(async (manager) => {
      const depositRepository = manager.getRepository(DepositEntity);
      const walletRepository = manager.getRepository(WalletEntity);
      const transactionRepository = manager.getRepository(TransactionEntity);

      const lockedDeposit = await depositRepository.findOne({
        where: {
          id: deposit.id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (
        !lockedDeposit ||
        lockedDeposit.paymentMethod !== 'vcb_qr' ||
        lockedDeposit.status !== 'pending'
      ) {
        return false;
      }

      if (this.isDepositExpired(lockedDeposit)) {
        lockedDeposit.status = 'expired';
        await depositRepository.save(lockedDeposit);
        return false;
      }

      let wallet = await walletRepository.findOne({
        where: {
          userId: lockedDeposit.userId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!wallet) {
        wallet = await walletRepository.save(
          walletRepository.create({
            userId: lockedDeposit.userId,
            balance: '0',
            totalEarned: '0',
            totalSpent: '0',
          }),
        );
      }

      wallet.balance = String(toNumber(wallet.balance) + creditedAmount);
      await walletRepository.save(wallet);

      const receivedAt = transaction.occurredAt ?? new Date();
      const note = this.buildVcbWebhookNote(
        transaction.amount,
        expectedAmount,
        creditedAmount,
      );

      lockedDeposit.status = 'completed';
      lockedDeposit.amount = String(creditedAmount);
      lockedDeposit.paymentRef = transaction.transactionId;
      lockedDeposit.completedAt = receivedAt;
      lockedDeposit.matchedAt = receivedAt;
      lockedDeposit.adminNote = note;
      lockedDeposit.webhookData = {
        source: transaction.source,
        transactionId: transaction.transactionId,
        description: transaction.description,
        receivedAmount: transaction.amount,
        creditedAmount,
        receivedAt: receivedAt.toISOString(),
        raw: transaction.raw,
      };

      await depositRepository.save(lockedDeposit);

      await transactionRepository.save(
        transactionRepository.create({
          senderId: null,
          receiverId: lockedDeposit.userId,
          amount: String(creditedAmount),
          type: 'deposit',
          status: 'completed',
          referenceId: lockedDeposit.id,
          referenceType: 'deposit',
          metadata: {
            provider: 'vcb_qr',
            webhookSource: transaction.source,
            bankTransactionId: transaction.transactionId,
            depositCode,
            receivedAmount: transaction.amount,
            creditedAmount,
          },
        }),
      );

      return true;
    });
  }

  private async expireOverdueDeposits(filters?: { userId?: string }) {
    const items = await this.depositsRepository.find({
      where: {
        ...(filters?.userId
          ? {
              userId: filters.userId,
            }
          : {}),
        status: In(PaymentService.REVIEWABLE_DEPOSIT_STATUSES),
        expiresAt: LessThan(new Date()),
      },
    });

    if (!items.length) {
      return;
    }

    await this.depositsRepository.save(
      items.map((item) => ({
        ...item,
        status: 'expired' as const,
      })),
    );
  }

  private async syncDepositExpiration(deposit: DepositEntity) {
    if (!this.isDepositExpired(deposit)) {
      return deposit;
    }

    deposit.status = 'expired';
    return this.depositsRepository.save(deposit);
  }

  private isDepositExpired(deposit: DepositEntity) {
    return (
      Boolean(deposit.expiresAt) &&
      PaymentService.REVIEWABLE_DEPOSIT_STATUSES.includes(
        deposit.status as ReviewableDepositStatus,
      ) &&
      new Date(deposit.expiresAt as Date).getTime() <= Date.now()
    );
  }

  private readMomoQrConfig(): MomoQrConfig {
    return {
      phone:
        this.configService.get<string>('payment.momoQr.phone')?.trim() ?? '',
      name: this.configService.get<string>('payment.momoQr.name')?.trim() ?? '',
      minAmount: Number(
        this.configService.get<number>('payment.momoQr.minAmount') ?? 10000,
      ),
      maxAmount: Number(
        this.configService.get<number>('payment.momoQr.maxAmount') ?? 5000000,
      ),
      expireMinutes: Number(
        this.configService.get<number>('payment.momoQr.expireMinutes') ?? 30,
      ),
      allowedAmounts: this.normalizeAllowedAmounts(
        this.configService.get<number[]>('payment.momoQr.allowedAmounts') ?? [],
      ),
    };
  }

  private getMomoQrConfig() {
    const config = this.readMomoQrConfig();

    if (!this.isMomoQrConfigured(config)) {
      throw new BadRequestException(
        'MoMo QR chưa được cấu hình. Hãy đặt MOMO_QR_PHONE và MOMO_QR_NAME.',
      );
    }

    return config;
  }

  private isMomoQrConfigured(config: MomoQrConfig) {
    return Boolean(config.phone && config.name);
  }

  private readVcbQrConfig(): VcbQrConfig {
    return {
      bankCode:
        this.configService.get<string>('payment.vcbQr.bankCode')?.trim() ??
        '',
      bankName:
        this.configService.get<string>('payment.vcbQr.bankName')?.trim() ??
        '',
      accountNumber:
        this.configService
          .get<string>('payment.vcbQr.accountNumber')
          ?.trim() ?? '',
      accountName:
        this.configService.get<string>('payment.vcbQr.accountName')?.trim() ??
        '',
      template:
        this.configService.get<string>('payment.vcbQr.template')?.trim() ??
        'compact2',
      minAmount: Number(
        this.configService.get<number>('payment.vcbQr.minAmount') ?? 10000,
      ),
      maxAmount: Number(
        this.configService.get<number>('payment.vcbQr.maxAmount') ?? 5000000,
      ),
      expireMinutes: Number(
        this.configService.get<number>('payment.vcbQr.expireMinutes') ?? 15,
      ),
      allowedAmounts: this.normalizeAllowedAmounts(
        this.configService.get<number[]>('payment.vcbQr.allowedAmounts') ?? [],
      ),
    };
  }

  private getVcbQrConfig() {
    const config = this.readVcbQrConfig();

    if (!this.isVcbQrConfigured(config)) {
      throw new BadRequestException(
        'VCB QR chưa được cấu hình. Hãy đặt VCB_QR_ACCOUNT_NUMBER và VCB_QR_ACCOUNT_NAME.',
      );
    }

    return config;
  }

  private isVcbQrConfigured(config: VcbQrConfig) {
    return Boolean(
      config.bankCode &&
        config.bankName &&
        config.accountNumber &&
        config.accountName,
    );
  }

  private validateManualDepositAmount(
    amount: number,
    minAmount: number,
    maxAmount: number,
    allowedAmounts: number[],
    label: string,
  ) {
    if (amount < minAmount) {
      throw new BadRequestException(
        `Số tiền tối thiểu cho ${label} là ${this.formatCurrency(minAmount)}.`,
      );
    }

    if (amount > maxAmount) {
      throw new BadRequestException(
        `Số tiền tối đa cho ${label} là ${this.formatCurrency(maxAmount)}.`,
      );
    }

    if (allowedAmounts.length && !allowedAmounts.includes(amount)) {
      throw new BadRequestException(
        `${label} chỉ hỗ trợ các mệnh giá: ${allowedAmounts
          .map((value) => this.formatCurrency(value))
          .join(', ')}.`,
      );
    }
  }

  private async findActiveManualDeposit(
    userId: string,
    paymentMethod: ManualDepositMethod,
  ) {
    return this.depositsRepository.findOne({
      where: {
        userId,
        status: In(PaymentService.REVIEWABLE_DEPOSIT_STATUSES),
        paymentMethod,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private enqueueDepositExpiry(depositId: string, expireMinutes: number) {
    void this.jobQueueService
      .enqueueDepositExpiry(depositId, expireMinutes * 60_000)
      .catch(() => undefined);
  }

  private formatDepositResponse(deposit: DepositEntity) {
    if (deposit.paymentMethod === 'vcb_qr') {
      return {
        deposit: this.toDepositResponse(deposit),
        payment: {
          method: 'vcb_qr',
          autoConfirm: true,
          receiver: {
            phone: null,
            name: deposit.receiverName,
            bankCode: deposit.bankCode,
            bankName: deposit.bankName,
            accountNumber: deposit.accountNumber,
          },
          qr: {
            imageDataUrl: deposit.qrImageUrl,
            deepLink: null,
            raw: null,
          },
          transferContent: deposit.depositCode,
          instructions: [
            'Mở ứng dụng ngân hàng hoặc ví hỗ trợ quét VietQR.',
            'Quét mã QR bên dưới và kiểm tra đúng số tiền trước khi xác nhận.',
            `Bắt buộc giữ nguyên nội dung ${deposit.depositCode} để hệ thống tự đối soát.`,
            'Sau khi ngân hàng báo thành công, ví sẽ tự cập nhật trong ít giây khi webhook trả về.',
          ],
        },
      };
    }

    const parsedQrData = this.parseQrData(deposit.qrData);

    return {
      deposit: this.toDepositResponse(deposit),
      payment: {
        method: 'momo_qr',
        autoConfirm: false,
        receiver: {
          phone: deposit.receiverPhone,
          name: deposit.receiverName,
          bankCode: null,
          bankName: null,
          accountNumber: null,
        },
        qr: {
          imageDataUrl: deposit.qrImageUrl,
          deepLink: parsedQrData.deepLink,
          raw: parsedQrData.raw,
        },
        transferContent: deposit.depositCode,
        instructions: [
          'Mở ứng dụng MoMo và quét QR bên dưới.',
          'Kiểm tra đúng số tiền hiển thị trên màn hình.',
          `Nếu MoMo không tự điền nội dung, hãy dán mã ${deposit.depositCode} vào ô lời nhắn/nội dung chuyển khoản.`,
          'Sau khi chuyển xong, quay lại và bấm "Tôi đã chuyển tiền".',
        ],
      },
    };
  }

  private parseQrData(input: string | null): ParsedQrData {
    if (!input) {
      return {
        deepLink: null,
        raw: null,
      };
    }

    try {
      const parsed = JSON.parse(input) as Partial<ParsedQrData>;
      return {
        deepLink:
          typeof parsed.deepLink === 'string' ? parsed.deepLink : null,
        raw: typeof parsed.raw === 'string' ? parsed.raw : null,
      };
    } catch {
      return {
        deepLink: null,
        raw: input,
      };
    }
  }

  private async refreshManualMomoQrDeposit(
    deposit: DepositEntity,
    config: MomoQrConfig,
  ) {
    const parsedQrData = this.parseQrData(deposit.qrData);
    const nextQrPayload = this.momoQrService.generateScanPayload({
      phone: config.phone,
      name: config.name,
      amount: toNumber(deposit.amount),
      comment: deposit.depositCode ?? '',
    });
    const shouldRefreshQr =
      deposit.receiverPhone !== config.phone ||
      deposit.receiverName !== config.name ||
      parsedQrData.raw !== nextQrPayload ||
      !deposit.qrImageUrl;

    if (!shouldRefreshQr) {
      return deposit;
    }

    deposit.receiverPhone = config.phone;
    deposit.receiverName = config.name;
    deposit.bankCode = null;
    deposit.bankName = null;
    deposit.accountNumber = null;
    deposit.qrData = JSON.stringify({
      deepLink: null,
      raw: nextQrPayload,
    });
    deposit.qrImageUrl =
      await this.momoQrService.generateQrDataUrl(nextQrPayload);

    return this.depositsRepository.save(deposit);
  }

  private async refreshVcbQrDeposit(
    deposit: DepositEntity,
    config: VcbQrConfig,
  ) {
    const nextQrUrl = this.vietQrService.generateQrUrl({
      bankCode: config.bankCode,
      accountNumber: config.accountNumber,
      accountName: config.accountName,
      amount: toNumber(deposit.amount),
      description: deposit.depositCode ?? '',
      template: config.template,
    });

    const shouldRefreshQr =
      deposit.receiverName !== config.accountName ||
      deposit.bankCode !== config.bankCode ||
      deposit.bankName !== config.bankName ||
      deposit.accountNumber !== config.accountNumber ||
      deposit.qrImageUrl !== nextQrUrl;

    if (!shouldRefreshQr) {
      return deposit;
    }

    deposit.receiverPhone = null;
    deposit.receiverName = config.accountName;
    deposit.bankCode = config.bankCode;
    deposit.bankName = config.bankName;
    deposit.accountNumber = config.accountNumber;
    deposit.qrData = null;
    deposit.qrImageUrl = nextQrUrl;

    return this.depositsRepository.save(deposit);
  }

  private normalizeCassoTransactions(payload: Record<string, unknown>) {
    const error = this.readNumber(payload.error);

    if (error !== null && error !== 0) {
      return [];
    }

    if (!Array.isArray(payload.data)) {
      return [];
    }

    return payload.data.flatMap((item) =>
      this.normalizeBankTransaction(item, {
        source: 'casso',
        transactionIdKeys: ['tid', 'id'],
        amountKeys: ['amount'],
        descriptionKeys: ['description'],
        occurredAtKeys: ['when'],
      }),
    );
  }

  private normalizeSepayTransactions(payload: Record<string, unknown>) {
    const candidates = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.transactions)
        ? payload.transactions
        : [payload];

    return candidates.flatMap((item) =>
      this.normalizeBankTransaction(item, {
        source: 'sepay',
        transactionIdKeys: ['referenceNumber', 'reference_number', 'id'],
        amountKeys: ['transferAmount', 'transfer_amount', 'amount'],
        descriptionKeys: ['content', 'description'],
        occurredAtKeys: ['transactionDate', 'transaction_date', 'createdAt'],
      }),
    );
  }

  private normalizeBankTransaction(
    input: unknown,
    options: {
      source: BankWebhookSource;
      transactionIdKeys: string[];
      amountKeys: string[];
      descriptionKeys: string[];
      occurredAtKeys: string[];
    },
  ): NormalizedBankWebhookTransaction[] {
    if (!this.isRecord(input)) {
      return [];
    }

    const transactionId = this.readFirstString(input, options.transactionIdKeys);
    const amount = this.readFirstNumber(input, options.amountKeys);
    const description =
      this.readFirstString(input, options.descriptionKeys) ?? '';
    const occurredAt = this.readDate(
      this.readFirstValue(input, options.occurredAtKeys),
    );

    if (!transactionId || amount === null) {
      return [];
    }

    return [
      {
        transactionId,
        amount,
        description,
        occurredAt,
        raw: input,
        source: options.source,
      },
    ];
  }

  private calculateCreditedVcbAmount(actualAmount: number, expectedAmount: number) {
    if (actualAmount <= 0 || expectedAmount <= 0) {
      return 0;
    }

    return Math.min(Math.floor(actualAmount), Math.floor(expectedAmount));
  }

  private buildVcbWebhookNote(
    actualAmount: number,
    expectedAmount: number,
    creditedAmount: number,
  ) {
    if (actualAmount < expectedAmount) {
      return `Hệ thống ghi nhận ${this.formatCurrency(actualAmount)} thay vì ${this.formatCurrency(expectedAmount)}. Ví đã được cộng theo số tiền thực nhận ${this.formatCurrency(creditedAmount)}.`;
    }

    if (actualAmount > expectedAmount) {
      return `Ngân hàng báo nhận ${this.formatCurrency(actualAmount)}. Hệ thống cộng ${this.formatCurrency(creditedAmount)} theo yêu cầu QR đã tạo.`;
    }

    return null;
  }

  private toDepositResponse(deposit: DepositEntity) {
    return {
      id: deposit.id,
      userId: deposit.userId,
      amount: toNumber(deposit.amount),
      depositCode: deposit.depositCode,
      paymentMethod: deposit.paymentMethod,
      paymentRef: deposit.paymentRef,
      receiverPhone: deposit.receiverPhone,
      receiverName: deposit.receiverName,
      bankCode: deposit.bankCode,
      bankName: deposit.bankName,
      accountNumber: deposit.accountNumber,
      status: deposit.status,
      userConfirmedAt: deposit.userConfirmedAt,
      transferProofUrl: deposit.transferProofUrl,
      adminConfirmedBy: deposit.adminConfirmedBy,
      adminNote: deposit.adminNote,
      expiresAt: deposit.expiresAt,
      matchedAt: deposit.matchedAt,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
      completedAt: deposit.completedAt,
    };
  }

  private normalizeAllowedAmounts(values: number[]) {
    return [...new Set(values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))]
      .map((value) => Math.floor(value))
      .sort((left, right) => left - right);
  }

  private normalizePage(page: number) {
    if (!Number.isFinite(page) || page < 1) {
      return PaymentService.DEFAULT_PAGE;
    }

    return Math.floor(page);
  }

  private isSuccessfulStatus(status?: string) {
    if (!status) {
      return true;
    }

    return ['success', 'completed', 'paid', '00'].includes(
      status.toLowerCase(),
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private readFirstValue(
    record: Record<string, unknown>,
    keys: string[],
  ): unknown {
    for (const key of keys) {
      if (key in record) {
        return record[key];
      }
    }

    return null;
  }

  private readFirstString(
    record: Record<string, unknown>,
    keys: string[],
  ): string | null {
    return this.readString(this.readFirstValue(record, keys));
  }

  private readFirstNumber(
    record: Record<string, unknown>,
    keys: string[],
  ): number | null {
    return this.readNumber(this.readFirstValue(record, keys));
  }

  private readString(value: unknown) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private readNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private readDate(value: unknown) {
    const raw = this.readString(value);

    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  }
}
