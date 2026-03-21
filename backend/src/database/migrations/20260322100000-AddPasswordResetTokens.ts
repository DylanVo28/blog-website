import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokens20260322100000
  implements MigrationInterface
{
  name = 'AddPasswordResetTokens20260322100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        otp_code VARCHAR(6),
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 5,
        blocked_until TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token
      ON password_reset_tokens(token);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
      ON password_reset_tokens(user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_otp_code_user_id
      ON password_reset_tokens(otp_code, user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at
      ON password_reset_tokens(expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_password_reset_tokens_otp_code_user_id;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_password_reset_tokens_token;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS password_reset_tokens;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS password_changed_at;
    `);
  }
}
