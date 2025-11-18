export interface ApplicationDetail {
  id: string;
  jobTitle: string;
  candidateName: string;
  status: string;
  appliedAt: Date;
  rating?: number;
}

export interface ApplicationFilters {
  status?: string;
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
  status: string;
  rejectionReason?: string;
  rating?: number;
}
