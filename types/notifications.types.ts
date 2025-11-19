import { NotificationType } from "./common.types";

export interface NotificationDetail {
  id: string;
  title: string;
  message: string;
  type?: NotificationType;
  read: boolean;
  createdAt: Date;
}

// Notifications feature types
export interface NotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
  userId: string;
}

export interface UpdateNotificationPayload {
  read?: boolean;
}
