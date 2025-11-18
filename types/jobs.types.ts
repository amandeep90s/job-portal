export interface JobDetail {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  status: string;
  views: number;
  companyName: string;
  createdAt: Date;
}

export interface JobFilters {
  searchQuery?: string;
  employmentType?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  status?: string;
}

// Jobs feature types
export interface JobPostPayload {
  title: string;
  description: string;
  employmentType: string;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  locationType?: string;
  experienceLevel?: string;
  deadline?: Date;
  skills: string[];
}

export interface UpdateJobPayload {
  title?: string;
  description?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  status?: string;
}
