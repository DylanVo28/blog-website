import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileBankFields20260325100000
  implements MigrationInterface
{
  name = 'AddUserProfileBankFields20260325100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(120),
      ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50),
      ADD COLUMN IF NOT EXISTS bank_holder VARCHAR(120);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS bank_holder,
      DROP COLUMN IF EXISTS bank_account,
      DROP COLUMN IF EXISTS bank_name;
    `);
  }
}
