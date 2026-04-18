import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ContentAgentCitation,
  ContentAgentRunStatus,
  ContentAgentTriggerSource,
} from '../content-agent.types';

@Entity('content_agent_runs')
@Index('ux_content_agent_runs_config_scheduled_for', ['configId', 'scheduledFor'], {
  unique: true,
})
export class ContentAgentRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'config_id', type: 'uuid' })
  configId!: string;

  @Column({ name: 'scheduled_for', type: 'timestamptz' })
  scheduledFor!: Date;

  @Column({ name: 'trigger_source', type: 'varchar', length: 20 })
  triggerSource!: ContentAgentTriggerSource;

  @Column({ type: 'varchar', length: 30, default: 'queued' })
  status!: ContentAgentRunStatus;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 180, unique: true })
  idempotencyKey!: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'selected_research_item_id', type: 'uuid', nullable: true })
  selectedResearchItemId!: string | null;

  @Column({ name: 'draft_post_id', type: 'uuid', nullable: true })
  draftPostId!: string | null;

  @Column({ name: 'draft_title', type: 'varchar', length: 500, nullable: true })
  draftTitle!: string | null;

  @Column({ name: 'draft_excerpt', type: 'varchar', length: 500, nullable: true })
  draftExcerpt!: string | null;

  @Column({ name: 'draft_content', type: 'jsonb', nullable: true })
  draftContent!: Record<string, unknown> | null;

  @Column({ name: 'draft_content_plain', type: 'text', nullable: true })
  draftContentPlain!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  citations!: ContentAgentCitation[];

  @Column({ name: 'validation_result', type: 'jsonb', default: () => "'{}'::jsonb" })
  validationResult!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
