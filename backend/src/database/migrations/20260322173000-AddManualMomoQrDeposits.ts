import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManualMomoQrDeposits20260322173000
  implements MigrationInterface
{
  name = 'AddManualMomoQrDeposits20260322173000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deposits
      ADD COLUMN IF NOT EXISTS deposit_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS qr_data TEXT,
      ADD COLUMN IF NOT EXISTS qr_image_url TEXT,
      ADD COLUMN IF NOT EXISTS user_confirmed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS transfer_proof_url TEXT,
      ADD COLUMN IF NOT EXISTS admin_confirmed_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS admin_note TEXT,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      DROP CONSTRAINT IF EXISTS deposits_status_check;
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      ADD CONSTRAINT deposits_status_check
      CHECK (status IN ('pending', 'user_confirmed', 'completed', 'failed', 'expired'));
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      DROP CONSTRAINT IF EXISTS deposits_payment_method_check;
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      ADD CONSTRAINT deposits_payment_method_check
      CHECK (
        payment_method IS NULL
        OR payment_method IN ('vnpay', 'momo', 'momo_qr')
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_deposits_code
      ON deposits(deposit_code)
      WHERE deposit_code IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deposits_expires
      ON deposits(expires_at)
      WHERE status IN ('pending', 'user_confirmed');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_deposits_expires;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_deposits_code;
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      DROP CONSTRAINT IF EXISTS deposits_payment_method_check;
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      ADD CONSTRAINT deposits_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('vnpay', 'momo'));
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      DROP CONSTRAINT IF EXISTS deposits_status_check;
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      ADD CONSTRAINT deposits_status_check
      CHECK (status IN ('pending', 'completed', 'failed'));
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      DROP COLUMN IF EXISTS updated_at,
      DROP COLUMN IF EXISTS expires_at,
      DROP COLUMN IF EXISTS admin_note,
      DROP COLUMN IF EXISTS admin_confirmed_by,
      DROP COLUMN IF EXISTS transfer_proof_url,
      DROP COLUMN IF EXISTS user_confirmed_at,
      DROP COLUMN IF EXISTS qr_image_url,
      DROP COLUMN IF EXISTS qr_data,
      DROP COLUMN IF EXISTS receiver_name,
      DROP COLUMN IF EXISTS receiver_phone,
      DROP COLUMN IF EXISTS deposit_code;
    `);
  }
}
