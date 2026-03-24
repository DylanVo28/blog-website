import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('email_verifications')
@Index('idx_email_verifications_email_created_at', ['email', 'createdAt'])
@Index('idx_email_verifications_expires_at', ['expiresAt'])
export class EmailVerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'otp_hash', type: 'varchar', length: 255 })
  otpHash!: string;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'max_attempts', type: 'int', default: 5 })
  maxAttempts!: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  get isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  get isVerified(): boolean {
    return this.verifiedAt !== null;
  }

  get isUsed(): boolean {
    return this.usedAt !== null;
  }
}
