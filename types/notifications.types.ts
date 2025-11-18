// Notifications feature types
export interface NotificationPayload {
  title: string;
  message: string;
  type?: string;
  userId: string;
}

export interface NotificationDetail {
  id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: Date;
}

export interface UpdateNotificationPayload {
  read?: boolean;
}
