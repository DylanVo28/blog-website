import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentAgentPhaseOne20260418193000
  implements MigrationInterface
{
  name = 'AddContentAgentPhaseOne20260418193000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE content_agent_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(120) UNIQUE NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        schedule_hour INT NOT NULL DEFAULT 19 CHECK (schedule_hour BETWEEN 0 AND 23),
        schedule_minute INT NOT NULL DEFAULT 0 CHECK (schedule_minute BETWEEN 0 AND 59),
        topics JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_allowlist JSONB NOT NULL DEFAULT '[]'::jsonb,
        publish_mode VARCHAR(30) NOT NULL DEFAULT 'draft_only'
          CHECK (publish_mode IN ('draft_only', 'auto_publish', 'review_required')),
        system_author_id UUID REFERENCES users(id) ON DELETE SET NULL,
        default_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        default_tag_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        writing_style TEXT,
        max_article_age_hours INT NOT NULL DEFAULT 24 CHECK (max_article_age_hours BETWEEN 1 AND 168),
        max_research_items INT NOT NULL DEFAULT 20 CHECK (max_research_items BETWEEN 1 AND 50),
        last_scheduled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE content_agent_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id UUID NOT NULL REFERENCES content_agent_configs(id) ON DELETE CASCADE,
        scheduled_for TIMESTAMPTZ NOT NULL,
        trigger_source VARCHAR(20) NOT NULL
          CHECK (trigger_source IN ('schedule', 'manual')),
        status VARCHAR(30) NOT NULL DEFAULT 'queued'
          CHECK (status IN ('queued', 'researching', 'generating', 'validating', 'draft_created', 'skipped', 'failed')),
        idempotency_key VARCHAR(180) NOT NULL UNIQUE,
        failure_reason TEXT,
        selected_research_item_id UUID,
        draft_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
        draft_title VARCHAR(500),
        draft_excerpt VARCHAR(500),
        draft_content JSONB,
        draft_content_plain TEXT,
        citations JSONB NOT NULL DEFAULT '[]'::jsonb,
        validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (config_id, scheduled_for)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE content_agent_research_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES content_agent_runs(id) ON DELETE CASCADE,
        source_type VARCHAR(30) NOT NULL DEFAULT 'rss',
        source_url VARCHAR(1000) NOT NULL,
        canonical_url VARCHAR(1000) NOT NULL,
        source_domain VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        summary TEXT,
        content_text TEXT,
        topic VARCHAR(120),
        published_at TIMESTAMPTZ,
        final_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        ranking_reasons JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_selected BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (run_id, canonical_url)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_content_agent_configs_enabled
      ON content_agent_configs(enabled);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_content_agent_runs_config_scheduled
      ON content_agent_runs(config_id, scheduled_for DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_content_agent_runs_status
      ON content_agent_runs(status, scheduled_for DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_content_agent_research_items_run_score
      ON content_agent_research_items(run_id, is_selected DESC, final_score DESC);
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_content_agent_configs_updated_at
      BEFORE UPDATE ON content_agent_configs
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_content_agent_runs_updated_at
      BEFORE UPDATE ON content_agent_runs
      FOR EACH ROW
      EXECUTE FUNCTION set_row_updated_at();
    `);

    await queryRunner.query(`
      INSERT INTO content_agent_configs (
        name,
        enabled,
        timezone,
        schedule_hour,
        schedule_minute,
        topics,
        source_allowlist,
        publish_mode,
        default_tag_ids
      )
      VALUES (
        'Daily AI Research Agent',
        FALSE,
        'Asia/Ho_Chi_Minh',
        19,
        0,
        '[]'::jsonb,
        '[]'::jsonb,
        'draft_only',
        '[]'::jsonb
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS content_agent_research_items;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS content_agent_runs;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS content_agent_configs;
    `);
  }
}
