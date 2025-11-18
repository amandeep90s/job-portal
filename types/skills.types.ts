export interface JobSeekerSkillPayload {
  skill: string;
  skillId?: string;
}

export interface JobSkillPayload {
  jobId: string;
  skillId: string;
}

export interface SkillDetail {
  id: string;
  name: string;
  category?: string;
}

// Skills feature types
export interface SkillPayload {
  name: string;
  category?: string;
}
