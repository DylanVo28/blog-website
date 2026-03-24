export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  WALLET_BALANCE_UPDATED: "wallet:balance_updated",
  NEW_NOTIFICATION: "notification:new",
  QUESTION_ANSWERED: "question:answered",
  QUESTION_AI_ANSWERED: "question:ai_answered",
  QUESTION_REFUNDED: "question:refunded",
  NEW_COMMENT: "comment:new",
} as const;
