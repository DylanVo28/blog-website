import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('document_embeddings')
export class DocumentEmbeddingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex!: number;

  @Column({ name: 'chunk_text', type: 'text' })
  chunkText!: string;

  @Column({
    type: 'vector',
    length: 768,
  })
  embedding!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
