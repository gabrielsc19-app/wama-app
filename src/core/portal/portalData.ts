import { getMyTenants, getTenantProjects } from "../tenant";
import { getMyLicensingSummary } from "../licensing/licensingService";
import type { LicensingSummaryRow } from "../licensing/types";
import type { TenantProject, TenantWithMembership } from "../tenant/TenantTypes";

export type EnterprisePortalData = {
  tenant: TenantWithMembership;
  licenses: LicensingSummaryRow[];
  projects: TenantProject[];
  source: "supabase" | "demo";
};

const demoTenant: TenantWithMembership = {
  id: "demo-tenant",
  code: "WM-000001",
  name: "Empresa Demo SpA",
  slug: "empresa-demo",
  logoUrl: null,
  countryCode: "CL",
  timezone: "America/Santiago",
  status: "trial",
  trialEndsAt: "2026-08-11T23:59:59.000Z",
  createdAt: "2026-07-28T00:00:00.000Z",
  updatedAt: "2026-07-28T00:00:00.000Z",
  membership: {
    id: "demo-membership",
    tenantId: "demo-tenant",
    profileId: "demo-profile",
    role: "owner",
    status: "active",
    joinedAt: "2026-07-28T00:00:00.000Z",
  },
};

const demoLicenses: LicensingSummaryRow[] = [
  {
    tenant_id: "demo-tenant",
    tenant_name: "Empresa Demo SpA",
    tenant_code: "WM-000001",
    module_key: "expense",
    module_name: "Expense Hub",
    license_id: "demo-license-expense",
    license_status: "trial",
    included_seats: 10,
    extra_seat_blocks: 0,
    seat_capacity: 10,
    used_seats: 8,
    available_seats: 2,
    monthly_total_usd: 10,
  },
  {
    tenant_id: "demo-tenant",
    tenant_name: "Empresa Demo SpA",
    tenant_code: "WM-000001",
    module_key: "sales",
    module_name: "Sales Hub",
    license_id: "demo-license-sales",
    license_status: "trial",
    included_seats: 10,
    extra_seat_blocks: 0,
    seat_capacity: 10,
    used_seats: 4,
    available_seats: 6,
    monthly_total_usd: 10,
  },
  {
    tenant_id: "demo-tenant",
    tenant_name: "Empresa Demo SpA",
    tenant_code: "WM-000001",
    module_key: "operations",
    module_name: "Operations Hub",
    license_id: "demo-license-operations",
    license_status: "trial",
    included_seats: 10,
    extra_seat_blocks: 1,
    seat_capacity: 20,
    used_seats: 15,
    available_seats: 5,
    monthly_total_usd: 20,
  },
];

const demoProjects: TenantProject[] = [
  {
    id: "demo-project-1",
    tenantId: "demo-tenant",
    code: "PR-001",
    name: "Implementación Casa Matriz",
    description: "Puesta en marcha integral de WAMA.",
    status: "active",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
  },
  {
    id: "demo-project-2",
    tenantId: "demo-tenant",
    code: "PR-002",
    name: "Operación Sucursal Norte",
    description: "Seguimiento operativo y control de gastos.",
    status: "active",
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
  },
];

export async function loadEnterprisePortalData(): Promise<EnterprisePortalData> {
  try {
    const tenants = await getMyTenants();
    const tenant = tenants[0];
    if (!tenant) throw new Error("No hay una empresa asociada al usuario.");

    const [licenses, projects] = await Promise.all([
      getMyLicensingSummary(),
      getTenantProjects(tenant.id),
    ]);

    return { tenant, licenses, projects, source: "supabase" };
  } catch {
    return {
      tenant: demoTenant,
      licenses: demoLicenses,
      projects: demoProjects,
      source: "demo",
    };
  }
}
