export const CONTENT_AGENT_PUBLISH_MODES = [
  'draft_only',
  'auto_publish',
  'review_required',
] as const;

export type ContentAgentPublishMode =
  (typeof CONTENT_AGENT_PUBLISH_MODES)[number];

export const CONTENT_AGENT_RUN_STATUSES = [
  'queued',
  'researching',
  'generating',
  'validating',
  'draft_created',
  'skipped',
  'failed',
] as const;

export type ContentAgentRunStatus = (typeof CONTENT_AGENT_RUN_STATUSES)[number];

export const CONTENT_AGENT_TRIGGER_SOURCES = ['schedule', 'manual'] as const;

export type ContentAgentTriggerSource =
  (typeof CONTENT_AGENT_TRIGGER_SOURCES)[number];

export interface ContentAgentCitation {
  title: string;
  url: string;
  domain: string;
}
