import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentAgentPublishMode } from '../content-agent.types';

@Entity('content_agent_configs')
export class ContentAgentConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 120 })
  name!: string;

  @Column({ default: false })
  enabled!: boolean;

  @Column({ type: 'varchar', length: 80, default: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @Column({ name: 'schedule_hour', type: 'int', default: 19 })
  scheduleHour!: number;

  @Column({ name: 'schedule_minute', type: 'int', default: 0 })
  scheduleMinute!: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  topics!: string[];

  @Column({ name: 'source_allowlist', type: 'jsonb', default: () => "'[]'::jsonb" })
  sourceAllowlist!: string[];

  @Column({ name: 'publish_mode', type: 'varchar', length: 30, default: 'draft_only' })
  publishMode!: ContentAgentPublishMode;

  @Column({ name: 'system_author_id', type: 'uuid', nullable: true })
  systemAuthorId!: string | null;

  @Column({ name: 'default_category_id', type: 'uuid', nullable: true })
  defaultCategoryId!: string | null;

  @Column({ name: 'default_tag_ids', type: 'jsonb', default: () => "'[]'::jsonb" })
  defaultTagIds!: string[];

  @Column({ name: 'writing_style', type: 'text', nullable: true })
  writingStyle!: string | null;

  @Column({ name: 'max_article_age_hours', type: 'int', default: 24 })
  maxArticleAgeHours!: number;

  @Column({ name: 'max_research_items', type: 'int', default: 20 })
  maxResearchItems!: number;

  @Column({ name: 'last_scheduled_at', type: 'timestamptz', nullable: true })
  lastScheduledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
