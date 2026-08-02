import { supabase } from "../../../app/lib/supabase";
import type {
  LicensingSummaryRow,
  TenantProvisionInput,
} from "./types";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function provisionTenant(
  input: TenantProvisionInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("wama_provision_tenant", {
    company_name: input.companyName.trim(),
    company_slug: input.companySlug.trim().toLowerCase(),
    administrator_name: input.administratorName?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "No fue posible crear la empresa.");
  }

  if (typeof data !== "string") {
    throw new Error("Supabase no devolvió el identificador de la empresa.");
  }

  return data;
}

export async function getMyLicensingSummary(): Promise<LicensingSummaryRow[]> {
  const { data, error } = await supabase.rpc("wama_my_licensing_summary");

  if (error) {
    throw new Error(error.message || "No fue posible cargar las licencias.");
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    tenant_id: String(row.tenant_id),
    tenant_name: String(row.tenant_name),
    tenant_code: String(row.tenant_code),
    module_key: row.module_key as LicensingSummaryRow["module_key"],
    module_name: String(row.module_name),
    license_id: String(row.license_id),
    license_status: row.license_status as LicensingSummaryRow["license_status"],
    included_seats: toNumber(row.included_seats),
    extra_seat_blocks: toNumber(row.extra_seat_blocks),
    seat_capacity: toNumber(row.seat_capacity),
    used_seats: toNumber(row.used_seats),
    available_seats: toNumber(row.available_seats),
    monthly_total_usd: toNumber(row.monthly_total_usd),
    starts_at: String(row.starts_at),
    renews_at: row.renews_at ? String(row.renews_at) : null,
    trial_days_remaining: toNumber(row.trial_days_remaining),
  }));
}

export async function assignUserToModule(
  licenseId: string,
  profileId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("wama_assign_user_to_module", {
    target_license_id: licenseId,
    target_profile_id: profileId,
  });

  if (error) {
    throw new Error(error.message || "No fue posible asignar el usuario.");
  }

  if (typeof data !== "string") {
    throw new Error("No se recibió el identificador de la asignación.");
  }

  return data;
}

export async function removeUserFromModule(
  licenseId: string,
  profileId: string,
): Promise<void> {
  const { error } = await supabase.rpc("wama_remove_user_from_module", {
    target_license_id: licenseId,
    target_profile_id: profileId,
  });

  if (error) {
    throw new Error(error.message || "No fue posible quitar el usuario.");
  }
}
