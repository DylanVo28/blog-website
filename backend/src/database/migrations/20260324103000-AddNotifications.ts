import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications20260324103000 implements MigrationInterface {
  name = 'AddNotifications20260324103000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notifications_recipient_created
      ON notifications(recipient_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notifications_recipient_unread
      ON notifications(recipient_id, is_read, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS notifications;
    `);
  }
}
