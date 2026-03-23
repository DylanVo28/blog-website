import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOcbQrPaymentMethod20260323203000
  implements MigrationInterface
{
  name = 'AddOcbQrPaymentMethod20260323203000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deposits
      DROP CONSTRAINT IF EXISTS deposits_payment_method_check;
    `);

    await queryRunner.query(`
      ALTER TABLE deposits
      ADD CONSTRAINT deposits_payment_method_check
      CHECK (
        payment_method IS NULL
        OR payment_method IN ('vnpay', 'momo', 'momo_qr', 'vcb_qr', 'ocb_qr')
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
  }
}
