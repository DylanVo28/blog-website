import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSecurityFields20260321143000
  implements MigrationInterface
{
  name = 'AddUserSecurityFields20260321143000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS ban_reason TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS ban_reason,
      DROP COLUMN IF EXISTS banned_by,
      DROP COLUMN IF EXISTS banned_at,
      DROP COLUMN IF EXISTS reset_password_expires_at,
      DROP COLUMN IF EXISTS reset_password_token;
    `);
  }
}
