import { isTenantAdmin } from "./wamaAdmin";
import { moduleAccessError, requireModuleAccess } from "./moduleAccess";

export const OPERATIONS_ADMIN_ROLES = ["module_admin", "operations_admin"];
export const OPERATIONS_COORDINATOR_ROLES = [...OPERATIONS_ADMIN_ROLES, "operations_coordinator"];
export const OPERATIONS_WORK_ROLES = [...OPERATIONS_COORDINATOR_ROLES, "operations_operator"];

export async function getOperationsContext(request: Request) {
  const context = await requireModuleAccess(request, "operations");
  const { membership, moduleRole } = context;
  return {
    ...context,
    canAdmin: isTenantAdmin(membership.role) || OPERATIONS_ADMIN_ROLES.includes(moduleRole),
    canCoordinate: isTenantAdmin(membership.role) || OPERATIONS_COORDINATOR_ROLES.includes(moduleRole),
    canWork: isTenantAdmin(membership.role) || OPERATIONS_WORK_ROLES.includes(moduleRole),
    canReport: true,
  };
}

export function operationsError(error: unknown) {
  return moduleAccessError(error, "Operations Hub");
}
