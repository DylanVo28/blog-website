import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostStatus } from '../../../common/constants';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ unique: true, length: 600 })
  slug!: string;

  @Column({ type: 'jsonb' })
  content!: Record<string, unknown>;

  @Column({ name: 'content_plain', type: 'text', nullable: true })
  contentPlain!: string | null;

  @Column({ length: 500, nullable: true })
  excerpt!: string | null;

  @Column({ name: 'cover_image', length: 500, nullable: true })
  coverImage!: string | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId!: string | null;

  @Column({ length: 20, default: 'draft' })
  status!: PostStatus;

  @Column({ name: 'view_count', type: 'bigint', default: 0 })
  viewCount!: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
