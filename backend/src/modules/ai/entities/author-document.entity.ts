import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('author_documents')
export class AuthorDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId!: string | null;

  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true })
  fileUrl!: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName!: string | null;

  @Column({ name: 'content_plain', type: 'text', nullable: true })
  contentPlain!: string | null;

  @Column({ name: 'is_processed', default: false })
  isProcessed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
