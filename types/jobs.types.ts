import { EmploymentType, ExperienceLevel, JobStatus } from "./common.types";

export interface JobDetail {
  id: string;
  title: string;
  description: string;
  employmentType: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  status: JobStatus;
  views: number;
  companyName: string;
  createdAt: Date;
}

export interface JobFilters {
  searchQuery?: string;
  employmentType?: EmploymentType;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: ExperienceLevel;
  status?: JobStatus;
}

// Jobs feature types
export interface JobPostPayload {
  title: string;
  description: string;
  employmentType: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  locationType?: string;
  experienceLevel?: ExperienceLevel;
  deadline?: Date;
  skills: string[];
}

export interface UpdateJobPayload {
  title?: string;
  description?: string;
  employmentType?: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  location?: string;
  status?: JobStatus;
}
