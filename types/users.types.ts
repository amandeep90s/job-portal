// Users feature types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  status: string;
  createdAt: Date;
}

export interface JobSeekerProfilePayload {
  headline: string;
  bio: string;
  totalExperience: number;
  currentLocation: string;
  preferredLocation: string;
  expectedSalary: number;
  resumeUrl?: string;
  avatarUrl?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface EmployerProfilePayload {
  position: string;
  companyId: string;
}

export interface UpdateUserPayload {
  name?: string;
  phoneNumber?: string;
  twoFactorEnabled?: boolean;
}
