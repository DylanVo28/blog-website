import { PaymentCallbackDto } from '../modules/payment/dto/payment-callback.dto';

export const JOB_QUEUE_NAMES = {
  embedding: 'embedding-queue',
  aiAnswer: 'ai-answer-queue',
  refund: 'refund-queue',
  notification: 'notification-queue',
  payment: 'payment-queue',
} as const;

export const JOB_NAMES = {
  indexPostEmbeddings: 'index-post-embeddings',
  indexAuthorDocumentEmbeddings: 'index-author-document-embeddings',
  answerAiQuestion: 'answer-ai-question',
  refundExpiredAuthorQuestions: 'refund-expired-author-questions',
  sendNotification: 'send-notification',
  processVnpayCallback: 'process-vnpay-callback',
  processMomoCallback: 'process-momo-callback',
  expireDeposit: 'expire-deposit',
} as const;

export interface IndexPostEmbeddingsJobData {
  postId: string;
}

export interface IndexAuthorDocumentEmbeddingsJobData {
  documentId: string;
}

export interface AiAnswerJobData {
  questionId: string;
  postId: string;
  content: string;
  authorId: string;
  askerId: string;
}

export interface RefundSweepJobData {
  triggeredBy: 'startup' | 'interval' | 'manual';
}

export interface NotificationJobData {
  type: string;
  recipientId: string;
  payload?: Record<string, unknown>;
}

export interface PaymentCallbackJobData {
  provider: 'vnpay' | 'momo';
  callback: PaymentCallbackDto;
}

export interface ExpireDepositJobData {
  depositId: string;
}

export type PaymentJobData = PaymentCallbackJobData | ExpireDepositJobData;
