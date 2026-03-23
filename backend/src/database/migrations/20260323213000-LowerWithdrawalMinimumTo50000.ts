import { MigrationInterface, QueryRunner } from 'typeorm';

export class LowerWithdrawalMinimumTo5000020260323213000
  implements MigrationInterface
{
  name = 'LowerWithdrawalMinimumTo5000020260323213000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'withdrawals'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%amount >= 100000%';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE withdrawals DROP CONSTRAINT %I', constraint_name);
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          WHERE rel.relname = 'withdrawals'
            AND con.conname = 'withdrawals_amount_check'
        ) THEN
          ALTER TABLE withdrawals
          ADD CONSTRAINT withdrawals_amount_check CHECK (amount >= 50000);
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE withdrawals
      DROP CONSTRAINT IF EXISTS withdrawals_amount_check;
    `);

    await queryRunner.query(`
      ALTER TABLE withdrawals
      ADD CONSTRAINT withdrawals_amount_check CHECK (amount >= 100000);
    `);
  }
}
