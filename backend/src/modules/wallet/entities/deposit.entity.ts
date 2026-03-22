import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  DepositStatus,
  PaymentMethod,
} from '../../../common/constants';

@Entity('deposits')
export class DepositEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ name: 'deposit_code', type: 'varchar', length: 20, nullable: true })
  depositCode!: string | null;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod!: PaymentMethod | null;

  @Column({ name: 'payment_ref', type: 'varchar', length: 255, nullable: true })
  paymentRef!: string | null;

  @Column({ name: 'receiver_phone', type: 'varchar', length: 20, nullable: true })
  receiverPhone!: string | null;

  @Column({ name: 'receiver_name', type: 'varchar', length: 100, nullable: true })
  receiverName!: string | null;

  @Column({ name: 'qr_data', type: 'text', nullable: true })
  qrData!: string | null;

  @Column({ name: 'qr_image_url', type: 'text', nullable: true })
  qrImageUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: DepositStatus;

  @Column({ name: 'user_confirmed_at', type: 'timestamptz', nullable: true })
  userConfirmedAt!: Date | null;

  @Column({ name: 'transfer_proof_url', type: 'text', nullable: true })
  transferProofUrl!: string | null;

  @Column({ name: 'admin_confirmed_by', type: 'uuid', nullable: true })
  adminConfirmedBy!: string | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
