import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSocialLogin20260324160000 implements MigrationInterface {
  name = 'AddSocialLogin20260324160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',
      ADD COLUMN IF NOT EXISTS is_password_set BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN password_hash DROP NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE users
      SET
        auth_provider = COALESCE(auth_provider, 'local'),
        is_password_set = CASE
          WHEN password_hash IS NULL THEN FALSE
          ELSE TRUE
        END;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(20) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        display_name VARCHAR(255),
        avatar_url VARCHAR(500),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMPTZ,
        raw_profile JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_social_accounts_provider_provider_id
          UNIQUE (provider, provider_id),
        CONSTRAINT uq_social_accounts_user_provider
          UNIQUE (user_id, provider)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id
      ON social_accounts(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_social_accounts_provider_provider_id
      ON social_accounts(provider, provider_id);
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON social_accounts;
      CREATE TRIGGER trg_social_accounts_updated_at
      BEFORE UPDATE ON social_accounts
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON social_accounts;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_social_accounts_provider_provider_id;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_social_accounts_user_id;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS social_accounts;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS auth_provider,
      DROP COLUMN IF EXISTS is_password_set;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN password_hash SET NOT NULL;
    `);
  }
}
