import { ApplicationStatus } from "./common.types";

export interface ApplicationDetail {
  id: string;
  jobTitle: string;
  candidateName: string;
  status: ApplicationStatus;
  appliedAt: Date;
  rating?: number;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  jobId?: string;
  sortBy?: string;
}

// Applications feature types
export interface ApplicationPayload {
  jobId: string;
  resumeUrl?: string;
  coverLetter?: string;
}

export interface UpdateApplicationStatusPayload {
  status: ApplicationStatus;
  rejectionReason?: string;
  rating?: number;
}
