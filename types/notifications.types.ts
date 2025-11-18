export interface NotificationDetail {
  id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: Date;
}

// Notifications feature types
export interface NotificationPayload {
  title: string;
  message: string;
  type?: string;
  userId: string;
}

export interface UpdateNotificationPayload {
  read?: boolean;
}
