export type WamaModuleKey =
  | "expense"
  | "operations"
  | "sales"
  | "finance"
  | "resource"
  | "hr"
  | "maintenance"
  | "analytics"
  | "ai";

export type LicenseStatus =
  | "pending"
  | "trial"
  | "active"
  | "suspended"
  | "cancelled";

export type LicensingSummaryRow = {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  module_key: WamaModuleKey;
  module_name: string;
  license_id: string;
  license_status: LicenseStatus;
  included_seats: number;
  extra_seat_blocks: number;
  seat_capacity: number;
  used_seats: number;
  available_seats: number;
  monthly_total_usd: number;
  starts_at: string;
  renews_at: string | null;
  trial_days_remaining: number;
};

export type TenantProvisionInput = {
  companyName: string;
  companySlug: string;
  administratorName?: string;
};
