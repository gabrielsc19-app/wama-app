import { getUserTenantContext, isTenantAdmin, requireWamaUser } from "./wamaAdmin";

export type CommercialModuleKey = "sales" | "expense" | "operations";

export async function requireModuleAccess(request: Request, moduleKey: CommercialModuleKey) {
  const user = await requireWamaUser(request);
  const context = await getUserTenantContext(user.id);
  const { admin, membership, profile } = context;

  const { data: moduleRow, error: moduleError } = await admin
    .from("wama_module_catalog")
    .select("id,module_key,name")
    .eq("module_key", moduleKey)
    .eq("is_active", true)
    .maybeSingle();
  if (moduleError) { console.error("WAMA module catalog error", moduleError); throw new Error("MODULE_DATA_ERROR"); }
  if (!moduleRow) throw new Error("MODULE_INACTIVE");

  const { data: license, error: licenseError } = await admin
    .from("wama_tenant_module_licenses")
    .select("id,status,renews_at,included_seats,extra_seat_blocks,extra_block_size,unit_price_usd,extra_block_price_usd")
    .eq("tenant_id", membership.tenant_id)
    .eq("module_id", moduleRow.id)
    .maybeSingle();
  if (licenseError) { console.error("WAMA module license error", licenseError); throw new Error("MODULE_DATA_ERROR"); }
  if (!license) throw new Error("MODULE_INACTIVE");

  if (license.status === "trial" && license.renews_at) {
    const expiresAt = new Date(license.renews_at).getTime();
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) throw new Error("MODULE_TRIAL_EXPIRED");
  }
  if (!["trial", "active"].includes(String(license.status))) throw new Error("MODULE_INACTIVE");

  let { data: assignment, error: assignmentError } = await admin
    .from("wama_module_user_assignments")
    .select("id,module_role,status")
    .eq("tenant_module_license_id", license.id)
    .eq("profile_id", profile.id)
    .eq("status", "active")
    .maybeSingle();

  if (membership.role === "owner" && (assignmentError || !assignment)) {
    const { data: repaired, error: repairError } = await admin
      .from("wama_module_user_assignments")
      .upsert(
        {
          tenant_module_license_id: license.id,
          profile_id: profile.id,
          assigned_by: profile.id,
          module_role: "module_admin",
          status: "active",
        },
        { onConflict: "tenant_module_license_id,profile_id" },
      )
      .select("id,module_role,status")
      .single();
    if (repairError || !repaired) throw new Error("MODULE_OWNER_REPAIR_FAILED");
    assignment = repaired;
    assignmentError = null;
  }

  if (assignmentError || !assignment) throw new Error("MODULE_FORBIDDEN");

  const moduleRole = membership.role === "owner" ? "module_admin" : assignment.module_role || "member";
  return {
    ...context,
    module: moduleRow,
    license,
    assignment,
    moduleRole,
    canAdmin: isTenantAdmin(membership.role) || moduleRole === "module_admin",
    tenantId: membership.tenant_id,
  };
}

export function moduleAccessError(error: unknown, moduleName = "este módulo") {
  const message = error instanceof Error ? error.message : "No fue posible completar la solicitud.";
  if (message === "UNAUTHORIZED") return { message: "Sesión caducada. Vuelve a iniciar sesión.", status: 401 };
  if (message === "MODULE_TRIAL_EXPIRED") return { message: `La prueba de ${moduleName} terminó. Activa la licencia para continuar.`, status: 402 };
  if (message === "MODULE_INACTIVE") return { message: `${moduleName} no está activo para esta empresa.`, status: 403 };
  if (message === "MODULE_FORBIDDEN") return { message: `No tienes una licencia activa de ${moduleName}.`, status: 403 };
  if (message === "MODULE_OWNER_REPAIR_FAILED") return { message: `${moduleName} está activo, pero no fue posible sincronizar el acceso del owner.`, status: 500 };
  if (message === "MODULE_DATA_ERROR") return { message: `No fue posible leer la licencia de ${moduleName}. Revisa la configuración del módulo.`, status: 500 };
  return { message, status: 500 };
}
