import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
@Index('idx_password_reset_tokens_user_id', ['userId'])
@Index('idx_password_reset_tokens_expires_at', ['expiresAt'])
@Index('idx_password_reset_tokens_otp_code_user_id', ['otpCode', 'userId'])
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ name: 'otp_code', type: 'varchar', length: 6, nullable: true })
  otpCode!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'max_attempts', type: 'int', default: 5 })
  maxAttempts!: number;

  @Column({ name: 'blocked_until', type: 'timestamptz', nullable: true })
  blockedUntil!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  get isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }

  get isUsed(): boolean {
    return this.usedAt !== null;
  }

  get isBlocked(): boolean {
    return Boolean(this.blockedUntil && this.blockedUntil.getTime() > Date.now());
  }
}
