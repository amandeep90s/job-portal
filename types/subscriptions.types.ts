// Subscriptions feature types
export interface PlanDetail {
  id: string;
  name: string;
  price: number;
  jobPostLimit: number;
  resumeViewLimit: number;
}

export interface SubscriptionPayload {
  planId: string;
  companyId: string;
}

export interface SubscriptionDetail {
  id: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  status: string;
  companyName: string;
}

export interface UpdateSubscriptionPayload {
  status?: string;
  endDate?: Date;
}
