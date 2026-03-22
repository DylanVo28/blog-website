import { MigrationInterface, QueryRunner } from 'typeorm';

export class LowerDepositMinimumTo1000020260322153000
  implements MigrationInterface
{
  name = 'LowerDepositMinimumTo1000020260322153000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'deposits'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%amount >= 50000%';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE deposits DROP CONSTRAINT %I', constraint_name);
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
          WHERE rel.relname = 'deposits'
            AND con.conname = 'deposits_amount_check'
        ) THEN
          ALTER TABLE deposits
          ADD CONSTRAINT deposits_amount_check CHECK (amount >= 10000);
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deposits
      DROP CONSTRAINT IF EXISTS deposits_amount_check;
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      ADD CONSTRAINT deposits_amount_check CHECK (amount >= 50000);
    `);
  }
}
