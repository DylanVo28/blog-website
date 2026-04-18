import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('content_agent_research_items')
@Index('ux_content_agent_research_item_run_canonical', ['runId', 'canonicalUrl'], {
  unique: true,
})
export class ContentAgentResearchItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'run_id', type: 'uuid' })
  runId!: string;

  @Column({ name: 'source_type', type: 'varchar', length: 30, default: 'rss' })
  sourceType!: string;

  @Column({ name: 'source_url', type: 'varchar', length: 1000 })
  sourceUrl!: string;

  @Column({ name: 'canonical_url', type: 'varchar', length: 1000 })
  canonicalUrl!: string;

  @Column({ name: 'source_domain', type: 'varchar', length: 255 })
  sourceDomain!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  topic!: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'final_score', type: 'double precision', default: 0 })
  finalScore!: number;

  @Column({ name: 'ranking_reasons', type: 'jsonb', default: () => "'{}'::jsonb" })
  rankingReasons!: Record<string, unknown>;

  @Column({ name: 'is_selected', default: false })
  isSelected!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
