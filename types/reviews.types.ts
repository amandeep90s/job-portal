import { ReviewType } from "./common.types";

export interface ReviewDetail {
  id: string;
  rating: number;
  comment?: string;
  reviewType: ReviewType;
  reviewerName: string;
  companyName?: string;
  createdAt: Date;
}

export interface ReviewFilters {
  reviewType?: ReviewType;
  companyId?: string;
  minRating?: number;
}

// Reviews feature types
export interface ReviewPayload {
  rating: number;
  comment?: string;
  reviewType: ReviewType;
  companyId?: string;
  reviewedById: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}
