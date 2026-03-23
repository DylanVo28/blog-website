export const ROLES_KEY = 'roles';

export const APP_ROLES = ['reader', 'author', 'admin'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const POST_STATUSES = ['draft', 'published', 'archived'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const QUESTION_TARGETS = ['author', 'ai'] as const;
export type QuestionTarget = (typeof QUESTION_TARGETS)[number];

export const QUESTION_STATUSES = [
  'pending',
  'answered',
  'refunded',
  'expired',
] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const TRANSACTION_TYPES = [
  'deposit',
  'withdrawal',
  'question_to_author',
  'question_to_ai',
  'refund',
  'withdrawal_fee',
  'bonus',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = [
  'pending',
  'completed',
  'failed',
  'refunded',
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const PAYMENT_METHODS = ['vnpay', 'momo', 'momo_qr', 'vcb_qr'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DEPOSIT_STATUSES = [
  'pending',
  'user_confirmed',
  'completed',
  'failed',
  'expired',
] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

export const WITHDRAWAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'completed',
] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const DEFAULT_QUESTION_FEE = 1000;
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const PLATFORM_SYSTEM_EMAIL = 'admin@yopmail.com';
export const PLATFORM_SYSTEM_DISPLAY_NAME = 'Blog Platform System';
export const PLATFORM_SYSTEM_PASSWORD_HASH = 'system-account-disabled';
