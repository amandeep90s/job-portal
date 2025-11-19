import { SubscriptionStatus } from "./common.types";

// Subscriptions feature types
export interface PlanDetail {
  id: string;
  name: string;
  price: number;
  jobPostLimit: number;
  resumeViewLimit: number;
}

export interface SubscriptionDetail {
  id: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  companyName: string;
}

export interface SubscriptionPayload {
  planId: string;
  companyId: string;
}

export interface UpdateSubscriptionPayload {
  status?: SubscriptionStatus;
  endDate?: Date;
}
