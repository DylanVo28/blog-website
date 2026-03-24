import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  recipientId!: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  data!: Record<string, unknown>;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
