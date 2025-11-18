// Companies feature types
export interface CompanyPayload {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  city?: string;
  country?: string;
  industry?: string;
  companySize?: string;
}

export interface CompanyDetail {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  verified: boolean;
  industry?: string;
  companySize?: string;
}

export interface UpdateCompanyPayload {
  name?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  city?: string;
  country?: string;
  industry?: string;
  companySize?: string;
}
