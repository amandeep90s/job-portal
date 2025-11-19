import { CompanySize } from "./common.types";

export interface CompanyDetail {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  verified: boolean;
  industry?: string;
  companySize?: CompanySize;
}

// Companies feature types
export interface CompanyPayload {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  city?: string;
  country?: string;
  industry?: string;
  companySize?: CompanySize;
}

export interface UpdateCompanyPayload {
  name?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  city?: string;
  country?: string;
  industry?: string;
  companySize?: CompanySize;
}
