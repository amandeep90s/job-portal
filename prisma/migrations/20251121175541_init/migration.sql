-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'employer', 'job_seeker');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'deactivated');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'open', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'under_review', 'shortlisted', 'interview', 'rejected', 'hired', 'withdrawn');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trial', 'pending');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('startup_1_10', 'small_11_50', 'medium_51_200', 'large_201_1000', 'enterprise_1000_plus');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('employer_review', 'candidate_review', 'company_review');

-- CreateEnum
CREATE TYPE "WorkLocationType" AS ENUM ('remote', 'hybrid', 'on_site');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('phone', 'video', 'in_person');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('beginner', 'intermediate', 'expert');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('application_update', 'interview_invite', 'job_recommendation', 'system_alert', 'message');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('email', 'notification', 'message');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'job_seeker',
    "status" "UserStatus" NOT NULL DEFAULT 'inactive',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT DEFAULT 'UTC',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_profiles" (
    "id" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "totalExperience" INTEGER,
    "currentLocation" TEXT,
    "preferredLocation" TEXT,
    "expectedSalary" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'INR',
    "resumeUrl" TEXT,
    "avatarUrl" TEXT,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "openToWork" BOOLEAN NOT NULL DEFAULT true,
    "preferredEmploymentTypes" "EmploymentType"[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_seeker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_experiences" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educations" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "fieldOfStudy" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "grade" TEXT,
    "description" TEXT,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "industry" TEXT,
    "companySize" "CompanySize",
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_locations" (
    "id" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_profiles" (
    "id" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "employmentType" "EmploymentType" NOT NULL,
    "minSalary" INTEGER,
    "maxSalary" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'INR',
    "salaryPeriod" TEXT,
    "locationType" "WorkLocationType" NOT NULL DEFAULT 'on_site',
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "experienceLevel" "ExperienceLevel",
    "deadline" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT,
    "postedById" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "seekerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_histories" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_views" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "billingPeriod" TEXT NOT NULL DEFAULT 'monthly',
    "jobPostLimit" INTEGER NOT NULL,
    "resumeViewLimit" INTEGER NOT NULL,
    "featuredJobLimit" INTEGER NOT NULL DEFAULT 0,
    "analyticsAccess" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_skills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiencyLevel" "ProficiencyLevel",
    "yearsOfExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_seeker_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_status_histories" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "interviewType" "InterviewType" NOT NULL,
    "interviewRound" INTEGER NOT NULL DEFAULT 1,
    "meetingLink" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "scheduledById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_feedbacks" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewId" TEXT,
    "rating" INTEGER,
    "feedback" TEXT,
    "strengths" TEXT[],
    "areasForImprovement" TEXT[],
    "recommended" BOOLEAN,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewType" "ReviewType" NOT NULL,
    "companyId" TEXT,
    "reviewById" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_view_analytics" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "saveCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_view_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_status_idx" ON "users"("email", "status");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_otp_idx" ON "verification_tokens"("identifier", "otp");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_idx" ON "verification_tokens"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_identifier_token_idx" ON "password_reset_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_idx" ON "password_reset_tokens"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_profiles_userId_key" ON "job_seeker_profiles"("userId");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_industry_idx" ON "companies"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "employer_profiles_userId_key" ON "employer_profiles"("userId");

-- CreateIndex
CREATE INDEX "jobs_status_createdAt_idx" ON "jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "jobs_companyId_status_idx" ON "jobs"("companyId", "status");

-- CreateIndex
CREATE INDEX "jobs_employmentType_locationType_idx" ON "jobs"("employmentType", "locationType");

-- CreateIndex
CREATE INDEX "jobs_experienceLevel_idx" ON "jobs"("experienceLevel");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");

-- CreateIndex
CREATE INDEX "job_applications_seekerId_status_idx" ON "job_applications"("seekerId", "status");

-- CreateIndex
CREATE INDEX "job_applications_jobId_status_idx" ON "job_applications"("jobId", "status");

-- CreateIndex
CREATE INDEX "job_applications_appliedAt_idx" ON "job_applications"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_seekerId_jobId_key" ON "job_applications"("seekerId", "jobId");

-- CreateIndex
CREATE INDEX "application_status_histories_applicationId_createdAt_idx" ON "application_status_histories"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_seekerId_jobId_key" ON "saved_jobs"("seekerId", "jobId");

-- CreateIndex
CREATE INDEX "job_views_jobId_viewedAt_idx" ON "job_views"("jobId", "viewedAt");

-- CreateIndex
CREATE INDEX "job_views_userId_viewedAt_idx" ON "job_views"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "subscriptions_status_endDate_idx" ON "subscriptions"("status", "endDate");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "communications_userId_sentAt_idx" ON "communications"("userId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_skills_userId_skillId_key" ON "job_seeker_skills"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "job_skills_jobId_skillId_key" ON "job_skills"("jobId", "skillId");

-- CreateIndex
CREATE INDEX "job_status_histories_jobId_createdAt_idx" ON "job_status_histories"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "interviews_applicationId_scheduledDate_idx" ON "interviews"("applicationId", "scheduledDate");

-- CreateIndex
CREATE INDEX "interviews_status_scheduledDate_idx" ON "interviews"("status", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "interview_feedbacks_applicationId_key" ON "interview_feedbacks"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_feedbacks_interviewId_key" ON "interview_feedbacks"("interviewId");

-- CreateIndex
CREATE INDEX "reviews_companyId_rating_idx" ON "reviews"("companyId", "rating");

-- CreateIndex
CREATE INDEX "reviews_reviewedById_reviewType_idx" ON "reviews"("reviewedById", "reviewType");

-- CreateIndex
CREATE UNIQUE INDEX "job_view_analytics_jobId_key" ON "job_view_analytics"("jobId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "job_seeker_profiles" ADD CONSTRAINT "job_seeker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_experiences" ADD CONSTRAINT "work_experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educations" ADD CONSTRAINT "educations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_locations" ADD CONSTRAINT "company_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "employer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_histories" ADD CONSTRAINT "application_status_histories_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_skills" ADD CONSTRAINT "job_seeker_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_skills" ADD CONSTRAINT "job_seeker_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_histories" ADD CONSTRAINT "job_status_histories_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_histories" ADD CONSTRAINT "job_status_histories_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_scheduledById_fkey" FOREIGN KEY ("scheduledById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedbacks" ADD CONSTRAINT "interview_feedbacks_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewById_fkey" FOREIGN KEY ("reviewById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_view_analytics" ADD CONSTRAINT "job_view_analytics_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
