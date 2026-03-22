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

type ReviewableDepositStatus = 'pending' | 'user_confirmed';

interface ParsedQrData {
  deepLink: string | null;
  raw: string | null;
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
    private readonly depositCodeService: DepositCodeService,
  ) {}

  async createDeposit(userId: string, dto: CreateDepositDto) {
    const config = this.getMomoQrConfig();
    const paymentMethod = dto.paymentMethod ?? 'momo_qr';

    if (paymentMethod !== 'momo_qr') {
      throw new BadRequestException(
        'Flow này chỉ hỗ trợ MoMo QR cá nhân. Hãy chọn MoMo QR.',
      );
    }

    if (dto.amount < config.minAmount) {
      throw new BadRequestException(
        `Số tiền tối thiểu là ${config.minAmount.toLocaleString('vi-VN')}đ.`,
      );
    }

    if (dto.amount > config.maxAmount) {
      throw new BadRequestException(
        `Số tiền tối đa là ${config.maxAmount.toLocaleString('vi-VN')}đ.`,
      );
    }

    await this.expireOverdueDeposits({
      userId,
    });

    const existingDeposit = await this.depositsRepository.findOne({
      where: {
        userId,
        status: In(PaymentService.REVIEWABLE_DEPOSIT_STATUSES),
        paymentMethod: 'momo_qr',
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (existingDeposit) {
      const refreshedDeposit = await this.refreshManualMomoQrDeposit(
        existingDeposit,
        config,
      );
      return this.formatManualDepositResponse(refreshedDeposit);
    }

    const depositCode = await this.depositCodeService.generateUniqueCode();
    const qrPayload = this.momoQrService.generateScanPayload({
      phone: config.phone,
      name: config.name,
      amount: dto.amount,
      comment: depositCode,
    });
    const qrImageUrl = await this.momoQrService.generateQrDataUrl(qrPayload);

    const expiresAt = new Date(Date.now() + config.expireMinutes * 60_000);
    const deposit = await this.depositsRepository.save(
      this.depositsRepository.create({
        userId,
        amount: String(dto.amount),
        depositCode,
        paymentMethod: 'momo_qr',
        paymentRef: null,
        receiverPhone: config.phone,
        receiverName: config.name,
        qrData: JSON.stringify({
          deepLink: null,
          raw: qrPayload,
        }),
        qrImageUrl,
        status: 'pending',
        expiresAt,
      }),
    );

    void this.jobQueueService
      .enqueueDepositExpiry(deposit.id, config.expireMinutes * 60_000)
      .catch(() => undefined);

    return this.formatManualDepositResponse(deposit);
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

    const freshDeposit = await this.syncDepositExpiration(deposit);

    if (freshDeposit.status === 'expired') {
      throw new BadRequestException(
        'Mã nạp tiền đã hết hạn. Vui lòng tạo yêu cầu mới.',
      );
    }

    if (!PaymentService.REVIEWABLE_DEPOSIT_STATUSES.includes(freshDeposit.status as ReviewableDepositStatus)) {
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
    const config = this.getMomoQrConfig();

    return {
      items: [
        {
          method: 'momo_qr',
          label: 'MoMo QR cá nhân',
          description:
            'Quét QR và chuyển đúng số tiền, đúng nội dung để admin duyệt thủ công.',
          minAmount: config.minAmount,
          maxAmount: config.maxAmount,
          receiver: {
            phone: config.phone,
            name: config.name,
          },
          enabled: Boolean(config.phone && config.name),
          expireMinutes: config.expireMinutes,
        },
      ],
    };
  }

  async listPendingDeposits(page = PaymentService.DEFAULT_PAGE) {
    await this.expireOverdueDeposits();

    const currentPage = this.normalizePage(page);
    const items = await this.depositsRepository
      .createQueryBuilder('deposit')
      .where('deposit.status IN (:...statuses)', {
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

  private getMomoQrConfig() {
    const phone = this.configService.get<string>('payment.momoQr.phone')?.trim() ?? '';
    const name = this.configService.get<string>('payment.momoQr.name')?.trim() ?? '';
    const minAmount = Number(
      this.configService.get<number>('payment.momoQr.minAmount') ?? 10000,
    );
    const maxAmount = Number(
      this.configService.get<number>('payment.momoQr.maxAmount') ?? 5000000,
    );
    const expireMinutes = Number(
      this.configService.get<number>('payment.momoQr.expireMinutes') ?? 30,
    );

    if (!phone || !name) {
      throw new BadRequestException(
        'MoMo QR chưa được cấu hình. Hãy đặt MOMO_QR_PHONE và MOMO_QR_NAME.',
      );
    }

    return {
      phone,
      name,
      minAmount,
      maxAmount,
      expireMinutes,
    };
  }

  private formatManualDepositResponse(deposit: DepositEntity) {
    const parsedQrData = this.parseQrData(deposit.qrData);

    return {
      deposit: this.toDepositResponse(deposit),
      payment: {
        method: 'momo_qr',
        receiver: {
          phone: deposit.receiverPhone,
          name: deposit.receiverName,
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
    config: {
      phone: string;
      name: string;
      minAmount: number;
      maxAmount: number;
      expireMinutes: number;
    },
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
    deposit.qrData = JSON.stringify({
      deepLink: null,
      raw: nextQrPayload,
    });
    deposit.qrImageUrl = await this.momoQrService.generateQrDataUrl(nextQrPayload);

    return this.depositsRepository.save(deposit);
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
      status: deposit.status,
      userConfirmedAt: deposit.userConfirmedAt,
      transferProofUrl: deposit.transferProofUrl,
      adminConfirmedBy: deposit.adminConfirmedBy,
      adminNote: deposit.adminNote,
      expiresAt: deposit.expiresAt,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
      completedAt: deposit.completedAt,
    };
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
}
