import { getUserTenantContext, isTenantAdmin, requireWamaUser } from "./wamaAdmin";

export const OPERATIONS_ADMIN_ROLES = ["module_admin", "operations_admin"];
export const OPERATIONS_COORDINATOR_ROLES = [...OPERATIONS_ADMIN_ROLES, "operations_coordinator"];
export const OPERATIONS_WORK_ROLES = [...OPERATIONS_COORDINATOR_ROLES, "operations_operator"];

export async function getOperationsContext(request: Request) {
  const user = await requireWamaUser(request);
  const context = await getUserTenantContext(user.id);
  const { admin, membership, profile } = context;

  const { data: operationsModule, error: moduleError } = await admin
    .from("wama_module_catalog")
    .select("id,module_key,name")
    .eq("module_key", "operations")
    .maybeSingle();
  if (moduleError || !operationsModule) throw new Error("OPERATIONS_INACTIVE");

  const { data: license, error: licenseError } = await admin
    .from("wama_tenant_module_licenses")
    .select("id,status,renews_at,included_seats,extra_seat_blocks,extra_block_size")
    .eq("tenant_id", membership.tenant_id)
    .eq("module_id", operationsModule.id)
    .in("status", ["trial", "active"])
    .maybeSingle();
  if (licenseError || !license) throw new Error("OPERATIONS_INACTIVE");

  let { data: assignment, error: assignmentError } = await admin
    .from("wama_module_user_assignments")
    .select("id,module_role,status")
    .eq("tenant_module_license_id", license.id)
    .eq("profile_id", profile.id)
    .eq("status", "active")
    .maybeSingle();

  // El owner siempre debe ocupar el primer cupo de cada módulo activo.
  // Reparamos aquí cualquier trial antiguo cuya asignación haya quedado
  // vinculada a otro perfil o sin el rol administrativo del módulo.
  if (membership.role === "owner" && (assignmentError || !assignment)) {
    const { data: repairedAssignment, error: repairError } = await admin
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

    if (repairError || !repairedAssignment) throw new Error("OPERATIONS_OWNER_REPAIR_FAILED");
    assignment = repairedAssignment;
    assignmentError = null;
  }

  if (assignmentError || !assignment) throw new Error("OPERATIONS_FORBIDDEN");

  const moduleRole = membership.role === "owner" ? "module_admin" : assignment.module_role;
  return {
    ...context,
    license,
    assignment,
    moduleRole,
    canAdmin: isTenantAdmin(membership.role) || OPERATIONS_ADMIN_ROLES.includes(moduleRole),
    canCoordinate: isTenantAdmin(membership.role) || OPERATIONS_COORDINATOR_ROLES.includes(moduleRole),
    canWork: isTenantAdmin(membership.role) || OPERATIONS_WORK_ROLES.includes(moduleRole),
    canReport: true,
    tenantId: membership.tenant_id,
  };
}

export function operationsError(error: unknown) {
  const message = error instanceof Error ? error.message : "No fue posible completar la solicitud.";
  if (message === "UNAUTHORIZED") return { message: "Sesión caducada. Vuelve a iniciar sesión.", status: 401 };
  if (message === "OPERATIONS_INACTIVE") return { message: "Operations Hub no está activo para esta empresa.", status: 403 };
  if (message === "OPERATIONS_FORBIDDEN") return { message: "No tienes una licencia activa de Operations Hub.", status: 403 };
  if (message === "OPERATIONS_OWNER_REPAIR_FAILED") return { message: "Operations Hub está activo, pero no fue posible sincronizar el acceso del owner.", status: 500 };
  return { message, status: 500 };
}
