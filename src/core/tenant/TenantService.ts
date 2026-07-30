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
  country_code: string;
  timezone: string;
  status: Tenant["status"];
  trial_ends_at: string | null;
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


type PortalTenantRpcRow = {
  membership_id: string;
  tenant_id: string;
  profile_id: string;
  membership_role: TenantMembership["role"];
  membership_status: TenantMembership["status"];
  joined_at: string;
  tenant_code: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_logo_url: string | null;
  tenant_country_code: string;
  tenant_timezone: string;
  tenant_status: Tenant["status"];
  tenant_trial_ends_at: string | null;
  tenant_created_at: string;
  tenant_updated_at: string;
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
    countryCode: row.country_code,
    timezone: row.timezone,
    status: row.status,
    trialEndsAt: row.trial_ends_at,
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
  const { data, error } = await supabase.rpc("wama_my_portal_tenants");

  if (error) {
    throw new Error(error.message || "No fue posible cargar las empresas.");
  }

  return ((data ?? []) as PortalTenantRpcRow[]).map((row) => ({
    id: row.tenant_id,
    code: row.tenant_code,
    name: row.tenant_name,
    slug: row.tenant_slug,
    logoUrl: row.tenant_logo_url,
    countryCode: row.tenant_country_code,
    timezone: row.tenant_timezone,
    status: row.tenant_status,
    trialEndsAt: row.tenant_trial_ends_at,
    createdAt: row.tenant_created_at,
    updatedAt: row.tenant_updated_at,
    membership: {
      id: row.membership_id,
      tenantId: row.tenant_id,
      profileId: row.profile_id,
      role: row.membership_role,
      status: row.membership_status,
      joinedAt: row.joined_at,
    },
  }));
}

export async function getTenantById(tenantId: string): Promise<Tenant> {
  const { data, error } = await supabase
    .from("wama_tenants")
    .select(
      "id, code, name, slug, logo_url, country_code, timezone, status, trial_ends_at, created_at, updated_at",
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
      "id, code, name, slug, logo_url, country_code, timezone, status, trial_ends_at, created_at, updated_at",
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
  if (input.countryCode !== undefined) {
    payload.country_code = input.countryCode.trim().toUpperCase();
  }
  if (input.timezone !== undefined) payload.timezone = input.timezone.trim();

  if (Object.keys(payload).length === 0) {
    return getTenantById(tenantId);
  }

  const { data, error } = await supabase
    .from("wama_tenants")
    .update(payload)
    .eq("id", tenantId)
    .select(
      "id, code, name, slug, logo_url, country_code, timezone, status, trial_ends_at, created_at, updated_at",
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
