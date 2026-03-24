import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AppRole } from '../../../common/constants';
import type { AuthProvider } from '../../auth/types/social-auth.types';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  username!: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'display_name', length: 100 })
  displayName!: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'reader' })
  role!: AppRole;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz' })
  emailVerifiedAt!: Date;

  @Column({ name: 'auth_provider', type: 'varchar', length: 20, default: 'local' })
  authProvider!: AuthProvider;

  @Column({ name: 'is_password_set', default: true })
  isPasswordSet!: boolean;

  @Column({ name: 'reset_password_token', type: 'varchar', length: 255, nullable: true })
  resetPasswordToken!: string | null;

  @Column({ name: 'reset_password_expires_at', type: 'timestamptz', nullable: true })
  resetPasswordExpiresAt!: Date | null;

  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  passwordChangedAt!: Date | null;

  @Column({ name: 'banned_at', type: 'timestamptz', nullable: true })
  bannedAt!: Date | null;

  @Column({ name: 'banned_by', type: 'uuid', nullable: true })
  bannedBy!: string | null;

  @Column({ name: 'ban_reason', type: 'text', nullable: true })
  banReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
