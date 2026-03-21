import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WithdrawalStatus } from '../../../common/constants';

@Entity('withdrawals')
export class WithdrawalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ name: 'fee_amount', type: 'bigint', default: 0 })
  feeAmount!: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName!: string | null;

  @Column({ name: 'bank_account', type: 'varchar', length: 50, nullable: true })
  bankAccount!: string | null;

  @Column({ name: 'bank_holder', type: 'varchar', length: 100, nullable: true })
  bankHolder!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: WithdrawalStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
