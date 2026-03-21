import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TransactionStatus,
  TransactionType,
} from '../../../common/constants';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  senderId!: string | null;

  @Column({ name: 'receiver_id', type: 'uuid', nullable: true })
  receiverId!: string | null;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ type: 'varchar', length: 30 })
  type!: TransactionType;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: TransactionStatus;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId!: string | null;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  referenceType!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
