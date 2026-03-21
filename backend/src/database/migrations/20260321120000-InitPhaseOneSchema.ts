import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitPhaseOneSchema20260321120000
  implements MigrationInterface
{
  name = 'InitPhaseOneSchema20260321120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TYPE transaction_type AS ENUM (
        'deposit',
        'withdrawal',
        'question_to_author',
        'question_to_ai',
        'refund',
        'withdrawal_fee',
        'bonus'
      );

      CREATE TYPE transaction_status AS ENUM (
        'pending',
        'completed',
        'failed',
        'refunded'
      );

      CREATE TYPE question_target AS ENUM ('author', 'ai');

      CREATE TYPE question_status AS ENUM (
        'pending',
        'answered',
        'refunded',
        'expired'
      );

      CREATE OR REPLACE FUNCTION set_row_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_url VARCHAR(500),
        bio TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'reader'
          CHECK (role IN ('reader', 'author', 'admin')),
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(120) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        slug VARCHAR(60) UNIQUE NOT NULL
      );

      CREATE TABLE wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id),
        balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
        total_earned BIGINT NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
        total_spent BIGINT NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(600) UNIQUE NOT NULL,
        content JSONB NOT NULL,
        content_plain TEXT,
        excerpt VARCHAR(500),
        cover_image VARCHAR(500),
        category_id UUID REFERENCES categories(id),
        status VARCHAR(20) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft', 'published', 'archived')),
        view_count BIGINT NOT NULL DEFAULT 0 CHECK (view_count >= 0),
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE post_tags (
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
      );

      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        parent_id UUID REFERENCES comments(id),
        content TEXT NOT NULL,
        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id),
        receiver_id UUID REFERENCES users(id),
        amount BIGINT NOT NULL CHECK (amount > 0),
        type transaction_type NOT NULL,
        status transaction_status NOT NULL DEFAULT 'pending',
        reference_id UUID,
        reference_type VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES posts(id),
        asker_id UUID NOT NULL REFERENCES users(id),
        target question_target NOT NULL,
        content TEXT NOT NULL,
        answer TEXT,
        answered_by UUID REFERENCES users(id),
        fee BIGINT NOT NULL DEFAULT 1000 CHECK (fee > 0),
        transaction_id UUID REFERENCES transactions(id),
        status question_status NOT NULL DEFAULT 'pending',
        is_highlighted BOOLEAN NOT NULL DEFAULT TRUE,
        deadline_at TIMESTAMPTZ,
        answered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        amount BIGINT NOT NULL CHECK (amount >= 50000),
        payment_method VARCHAR(50)
          CHECK (payment_method IN ('vnpay', 'momo')),
        payment_ref VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'completed', 'failed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        amount BIGINT NOT NULL CHECK (amount >= 100000),
        fee_amount BIGINT NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
        bank_name VARCHAR(100),
        bank_account VARCHAR(50),
        bank_holder VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
        approved_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE post_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        chunk_index INT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding vector(768) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE author_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID NOT NULL REFERENCES users(id),
        post_id UUID REFERENCES posts(id),
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        content_plain TEXT,
        is_processed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE document_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES author_documents(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id),
        chunk_index INT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding vector(768) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        target_id UUID NOT NULL,
        target_type VARCHAR(20) NOT NULL
          CHECK (target_type IN ('question', 'comment')),
        type VARCHAR(20) NOT NULL DEFAULT 'like'
          CHECK (type IN ('like', 'heart')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, target_id, target_type)
      );

      CREATE INDEX idx_posts_author ON posts(author_id);
      CREATE INDEX idx_posts_category ON posts(category_id);
      CREATE INDEX idx_posts_status ON posts(status);
      CREATE INDEX idx_posts_published ON posts(published_at DESC);

      CREATE INDEX idx_comments_post ON comments(post_id);
      CREATE INDEX idx_comments_user ON comments(user_id);
      CREATE INDEX idx_comments_parent ON comments(parent_id);

      CREATE INDEX idx_transactions_sender ON transactions(sender_id);
      CREATE INDEX idx_transactions_receiver ON transactions(receiver_id);
      CREATE INDEX idx_transactions_status ON transactions(status);
      CREATE INDEX idx_transactions_created ON transactions(created_at);
      CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);

      CREATE INDEX idx_questions_post ON questions(post_id);
      CREATE INDEX idx_questions_asker ON questions(asker_id);
      CREATE INDEX idx_questions_status ON questions(status);
      CREATE INDEX idx_questions_deadline ON questions(deadline_at)
        WHERE status = 'pending';

      CREATE INDEX idx_deposits_user ON deposits(user_id);
      CREATE INDEX idx_deposits_status ON deposits(status);

      CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
      CREATE INDEX idx_withdrawals_status ON withdrawals(status);
      CREATE INDEX idx_withdrawals_approved_by ON withdrawals(approved_by);

      CREATE INDEX idx_embeddings_post ON post_embeddings(post_id);
      CREATE INDEX idx_embeddings_vector ON post_embeddings
        USING hnsw (embedding vector_cosine_ops);

      CREATE INDEX idx_author_documents_author ON author_documents(author_id);
      CREATE INDEX idx_author_documents_post ON author_documents(post_id);

      CREATE INDEX idx_doc_embeddings_author ON document_embeddings(author_id);
      CREATE INDEX idx_doc_embeddings_document ON document_embeddings(document_id);
      CREATE INDEX idx_doc_embeddings_vector ON document_embeddings
        USING hnsw (embedding vector_cosine_ops);

      CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
      CREATE INDEX idx_reactions_user ON reactions(user_id);

      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();

      CREATE TRIGGER trg_wallets_updated_at
      BEFORE UPDATE ON wallets
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();

      CREATE TRIGGER trg_posts_updated_at
      BEFORE UPDATE ON posts
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();

      CREATE TRIGGER trg_comments_updated_at
      BEFORE UPDATE ON comments
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();

      CREATE TRIGGER trg_transactions_updated_at
      BEFORE UPDATE ON transactions
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();

      CREATE TRIGGER trg_questions_updated_at
      BEFORE UPDATE ON questions
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS reactions;
      DROP TABLE IF EXISTS document_embeddings;
      DROP TABLE IF EXISTS author_documents;
      DROP TABLE IF EXISTS post_embeddings;
      DROP TABLE IF EXISTS withdrawals;
      DROP TABLE IF EXISTS deposits;
      DROP TABLE IF EXISTS questions;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS comments;
      DROP TABLE IF EXISTS post_tags;
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS wallets;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS users;

      DROP FUNCTION IF EXISTS set_row_updated_at();

      DROP TYPE IF EXISTS question_status;
      DROP TYPE IF EXISTS question_target;
      DROP TYPE IF EXISTS transaction_status;
      DROP TYPE IF EXISTS transaction_type;
    `);
  }
}
