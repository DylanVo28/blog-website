import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVcbQrDepositFields20260323110000
  implements MigrationInterface
{
  name = 'AddVcbQrDepositFields20260323110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deposits
      ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS webhook_data JSONB;
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
        OR payment_method IN ('vnpay', 'momo', 'momo_qr', 'vcb_qr')
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_deposits_manual_method_status
      ON deposits(payment_method, status, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_deposits_manual_method_status;
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
      ALTER TABLE deposits
      DROP COLUMN IF EXISTS webhook_data,
      DROP COLUMN IF EXISTS matched_at,
      DROP COLUMN IF EXISTS account_number,
      DROP COLUMN IF EXISTS bank_name,
      DROP COLUMN IF EXISTS bank_code;
    `);
  }
}
