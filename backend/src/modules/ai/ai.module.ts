import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AuthorDocumentEntity } from './entities/author-document.entity';
import { PostEmbeddingEntity } from './entities/post-embedding.entity';
import { ChunkingService } from './rag/chunking.service';
import { EmbeddingService } from './rag/embedding.service';
import { RetrievalService } from './rag/retrieval.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEmbeddingEntity, AuthorDocumentEntity]),
  ],
  controllers: [AiController],
  providers: [AiService, ChunkingService, EmbeddingService, RetrievalService],
  exports: [AiService, TypeOrmModule],
})
export class AiModule {}
