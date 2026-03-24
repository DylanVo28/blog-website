export interface NotificationResponseDto {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
  readAt: Date | null;
}
