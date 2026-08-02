export type TenantStatus = "trial" | "active" | "suspended" | "cancelled";

export type TenantRole = "owner" | "admin" | "manager" | "member" | "viewer";

export type TenantMembershipStatus = "invited" | "active" | "disabled";

export type Tenant = {
  id: string;
  code: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  countryCode: string;
  timezone: string;
  status: TenantStatus;
  trialEndsAt: string | null;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantMembership = {
  id: string;
  tenantId: string;
  profileId: string;
  role: TenantRole;
  status: TenantMembershipStatus;
  joinedAt: string;
};

export type TenantWithMembership = Tenant & {
  membership: TenantMembership;
};

export type UpdateTenantInput = {
  name?: string;
  logoUrl?: string | null;
  countryCode?: string;
  timezone?: string;
  onboardingCompleted?: boolean;
};

export type CreateProjectInput = {
  tenantId: string;
  code: string;
  name: string;
  description?: string | null;
};

export type TenantProject = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused" | "closed" | "archived";
  createdAt: string;
  updatedAt: string;
};
