import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepositEntity } from '../../wallet/entities/deposit.entity';

@Injectable()
export class DepositCodeService {
  private readonly alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  constructor(
    @InjectRepository(DepositEntity)
    private readonly depositsRepository: Repository<DepositEntity>,
  ) {}

  async generateUniqueCode() {
    let attempts = 0;

    while (attempts < 10) {
      const code = `NAP${this.generateToken(6)}`;
      const existing = await this.depositsRepository.findOne({
        where: {
          depositCode: code,
        },
      });

      if (!existing) {
        return code;
      }

      attempts += 1;
    }

    return `NAP${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }

  parseDepositCode(transferContent: string | null | undefined) {
    if (!transferContent) {
      return null;
    }

    const normalized = transferContent.toUpperCase().replace(/[\s-]/g, '');
    const match = normalized.match(/NAP([A-Z0-9]{6})/);

    if (!match) {
      return null;
    }

    return `NAP${match[1]}`;
  }

  private generateToken(length: number) {
    const bytes = randomBytes(length);
    let code = '';

    for (let index = 0; index < length; index += 1) {
      code += this.alphabet[bytes[index] % this.alphabet.length];
    }

    return code;
  }
}
