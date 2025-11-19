import { UserRole, UserStatus } from "./common.types";

export interface EmployerProfilePayload {
  position: string;
  companyId: string;
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

export interface UpdateUserPayload {
  name?: string;
  phoneNumber?: string;
  twoFactorEnabled?: boolean;
}

// Users feature types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  verifiedAt?: Date;
  status: UserStatus;
  createdAt: Date;
}
