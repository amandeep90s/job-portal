// Analytics feature types
export interface JobAnalytics {
  jobId: string;
  viewCount: number;
  clickCount: number;
  applicationCount: number;
  conversionRate: number;
  lastViewedAt?: Date;
}

export interface AnalyticsFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  companyId?: string;
}

export interface CompanyAnalytics {
  totalJobsPosted: number;
  totalApplications: number;
  totalHires: number;
  averageTimeToHire: number;
}
