import { getMyTenants, getTenantProjects } from "../tenant";
import { getMyLicensingSummary } from "../licensing/licensingService";
import type { LicensingSummaryRow } from "../licensing/types";
import type { TenantProject, TenantWithMembership } from "../tenant/TenantTypes";

export type EnterprisePortalData = {
  tenant: TenantWithMembership;
  licenses: LicensingSummaryRow[];
  projects: TenantProject[];
  source: "supabase";
};

export async function loadEnterprisePortalData(): Promise<EnterprisePortalData> {
  const tenants = await getMyTenants();
  const tenant = tenants[0];
  if (!tenant) throw new Error("Tu usuario aún no tiene una empresa asociada.");

  const [licenses, projects] = await Promise.all([
    getMyLicensingSummary(),
    getTenantProjects(tenant.id),
  ]);

  return { tenant, licenses, projects, source: "supabase" };
}
