export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  NEW_NOTIFICATION: "notification:new",
  QUESTION_ANSWERED: "question:answered",
  QUESTION_REFUNDED: "question:refunded",
  NEW_COMMENT: "comment:new",
} as const;
