import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuestionStatus, QuestionTarget } from '../../../common/constants';

@Entity('questions')
export class QuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @Column({ name: 'asker_id', type: 'uuid' })
  askerId!: string;

  @Column({ type: 'varchar', length: 20 })
  target!: QuestionTarget;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  answer!: string | null;

  @Column({ name: 'answered_by', type: 'uuid', nullable: true })
  answeredBy!: string | null;

  @Column({ type: 'bigint', default: 1000 })
  fee!: string;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: QuestionStatus;

  @Column({ name: 'is_highlighted', default: true })
  isHighlighted!: boolean;

  @Column({ name: 'deadline_at', type: 'timestamptz', nullable: true })
  deadlineAt!: Date | null;

  @Column({ name: 'answered_at', type: 'timestamptz', nullable: true })
  answeredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
