import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
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

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod!: PaymentMethod | null;

  @Column({ name: 'payment_ref', type: 'varchar', length: 255, nullable: true })
  paymentRef!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: DepositStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
