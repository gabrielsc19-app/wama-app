import { supabase } from "../../../app/lib/supabase";
import type {
  CreateProjectInput,
  Tenant,
  TenantMembership,
  TenantProject,
  TenantWithMembership,
  UpdateTenantInput,
} from "./TenantTypes";

type TenantRow = {
  id: string;
  code: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  country_code: string;
  timezone: string;
  status: Tenant["status"];
  trial_ends_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MembershipRow = {
  id: string;
  tenant_id: string;
  profile_id: string;
  role: TenantMembership["role"];
  status: TenantMembership["status"];
  joined_at: string;
  wama_tenants: TenantRow | TenantRow[] | null;
};

type ProjectRow = {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  status: TenantProject["status"];
  created_at: string;
  updated_at: string;
};

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    website: row.website,
    countryCode: row.country_code,
    timezone: row.timezone,
    status: row.status,
    trialEndsAt: row.trial_ends_at,
    onboardingCompleted: Boolean(row.onboarding_completed_at),
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMembership(row: MembershipRow): TenantMembership {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    profileId: row.profile_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  };
}

function mapProject(row: ProjectRow): TenantProject {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCurrentProfileId(): Promise<string> {
  const { data, error } = await supabase.rpc("wama_current_profile_id");

  if (error) {
    throw new Error(error.message || "No fue posible identificar al usuario actual.");
  }

  if (typeof data !== "string") {
    throw new Error("El usuario actual todavía no tiene un perfil WAMA.");
  }

  return data;
}

export async function getMyTenants(): Promise<TenantWithMembership[]> {
  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
    .from("wama_tenant_memberships")
    .select(
      `
        id,
        tenant_id,
        profile_id,
        role,
        status,
        joined_at,
        wama_tenants!inner (
          id,
          code,
          name,
          slug,
          logo_url,
          website,
          country_code,
          timezone,
          status,
          trial_ends_at,
          onboarding_completed_at,
          created_at,
          updated_at
        )
      `,
    )
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "No fue posible cargar las empresas.");
  }

  return ((data ?? []) as unknown as MembershipRow[]).flatMap((row) => {
    const tenantRow = Array.isArray(row.wama_tenants)
      ? row.wama_tenants[0]
      : row.wama_tenants;

    if (!tenantRow) return [];

    return [
      {
        ...mapTenant(tenantRow),
        membership: mapMembership(row),
      },
    ];
  });
}

export async function getTenantById(tenantId: string): Promise<Tenant> {
  const { data, error } = await supabase
    .from("wama_tenants")
    .select(
      "id, code, name, slug, logo_url, website, country_code, timezone, status, trial_ends_at, onboarding_completed_at, created_at, updated_at",
    )
    .eq("id", tenantId)
    .single();

  if (error) {
    throw new Error(error.message || "No fue posible cargar la empresa.");
  }

  return mapTenant(data as TenantRow);
}

export async function getTenantBySlug(slug: string): Promise<Tenant> {
  const normalizedSlug = slug.trim().toLowerCase();

  const { data, error } = await supabase
    .from("wama_tenants")
    .select(
      "id, code, name, slug, logo_url, website, country_code, timezone, status, trial_ends_at, onboarding_completed_at, created_at, updated_at",
    )
    .eq("slug", normalizedSlug)
    .single();

  if (error) {
    throw new Error(error.message || "No fue posible cargar la empresa.");
  }

  return mapTenant(data as TenantRow);
}

export async function updateTenant(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<Tenant> {
  const payload: Record<string, string | null> = {};

  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.logoUrl !== undefined) payload.logo_url = input.logoUrl;
  if (input.website !== undefined) payload.website = input.website;
  if (input.countryCode !== undefined) {
    payload.country_code = input.countryCode.trim().toUpperCase();
  }
  if (input.timezone !== undefined) payload.timezone = input.timezone.trim();
  if (input.onboardingCompleted !== undefined) {
    payload.onboarding_completed_at = input.onboardingCompleted
      ? new Date().toISOString()
      : null;
  }

  if (Object.keys(payload).length === 0) {
    return getTenantById(tenantId);
  }

  const { data, error } = await supabase
    .from("wama_tenants")
    .update(payload)
    .eq("id", tenantId)
    .select(
      "id, code, name, slug, logo_url, website, country_code, timezone, status, trial_ends_at, onboarding_completed_at, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(error.message || "No fue posible actualizar la empresa.");
  }

  return mapTenant(data as TenantRow);
}

export async function getTenantProjects(
  tenantId: string,
): Promise<TenantProject[]> {
  const { data, error } = await supabase
    .from("wama_projects")
    .select(
      "id, tenant_id, code, name, description, status, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "No fue posible cargar los proyectos.");
  }

  return ((data ?? []) as ProjectRow[]).map(mapProject);
}

export async function createTenantProject(
  input: CreateProjectInput,
): Promise<TenantProject> {
  const profileId = await getCurrentProfileId();

  const { data, error } = await supabase
    .from("wama_projects")
    .insert({
      tenant_id: input.tenantId,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      created_by: profileId,
    })
    .select(
      "id, tenant_id, code, name, description, status, created_at, updated_at",
    )
    .single();

  if (error) {
    throw new Error(error.message || "No fue posible crear el proyecto.");
  }

  return mapProject(data as ProjectRow);
}

export async function archiveTenantProject(
  tenantId: string,
  projectId: string,
): Promise<void> {
  const { error } = await supabase
    .from("wama_projects")
    .update({ status: "archived" })
    .eq("tenant_id", tenantId)
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message || "No fue posible archivar el proyecto.");
  }
}

export function isTenantOwnerOrAdmin(
  tenant: TenantWithMembership,
): boolean {
  return tenant.membership.role === "owner" || tenant.membership.role === "admin";
}

export function isTenantAvailable(tenant: Tenant): boolean {
  return tenant.status === "trial" || tenant.status === "active";
}
