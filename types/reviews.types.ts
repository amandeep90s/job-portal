export interface ReviewDetail {
  id: string;
  rating: number;
  comment?: string;
  reviewType: string;
  reviewerName: string;
  companyName?: string;
  createdAt: Date;
}

export interface ReviewFilters {
  reviewType?: string;
  companyId?: string;
  minRating?: number;
}

// Reviews feature types
export interface ReviewPayload {
  rating: number;
  comment?: string;
  reviewType: string;
  companyId?: string;
  reviewedById: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}
