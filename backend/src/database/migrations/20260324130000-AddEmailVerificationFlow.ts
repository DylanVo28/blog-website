import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationFlow20260324130000
  implements MigrationInterface
{
  name = 'AddEmailVerificationFlow20260324130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(30),
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
    `);

    await queryRunner.query(`
      UPDATE users
      SET
        email_verified_at = COALESCE(email_verified_at, created_at, NOW()),
        is_verified = TRUE
      WHERE email_verified_at IS NULL OR is_verified = FALSE;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN email_verified_at SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
      ON users(username)
      WHERE username IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 5,
        expires_at TIMESTAMPTZ NOT NULL,
        verified_at TIMESTAMPTZ,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_email_created_at
      ON email_verifications(email, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at
      ON email_verifications(expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_email_verifications_expires_at;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_email_verifications_email_created_at;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS email_verifications;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_username_unique;
    `);

    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS email_verified_at,
      DROP COLUMN IF EXISTS username;
    `);
  }
}
