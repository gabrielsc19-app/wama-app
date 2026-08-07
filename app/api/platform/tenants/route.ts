import { NextResponse } from "next/server";
import { getWamaAdmin } from "../../../../src/lib/server/wamaAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request) {
  const expected = process.env.WAMA_OWNER_CONTROL_SECRET;
  const supplied = request.headers.get("x-wama-owner-secret");
  if (!expected) throw new Error("Falta configurar WAMA_OWNER_CONTROL_SECRET.");
  if (!supplied || supplied !== expected) throw new Error("UNAUTHORIZED");
}

export async function GET(request: Request) {
  try {
    authorize(request);
    const admin = getWamaAdmin();

    const { data: tenants, error } = await admin
      .from("wama_tenants")
      .select("id,name,slug,code,status,billing_status,billing_period,trial_ends_at,paid_until,suspended_at,suspension_reason,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const tenantIds = (tenants ?? []).map((tenant) => tenant.id);
    const [{ data: memberships }, { data: licenses }] = await Promise.all([
      tenantIds.length
        ? admin.from("wama_tenant_memberships").select("tenant_id,status").in("tenant_id", tenantIds)
        : Promise.resolve({ data: [] as Array<{ tenant_id: string; status: string }> }),
      tenantIds.length
        ? admin
            .from("wama_tenant_module_licenses")
            .select("id,tenant_id,status,included_seats,extra_seat_blocks,extra_block_size,unit_price_usd,extra_block_price_usd,renews_at,wama_module_catalog(module_key,name,monthly_price_usd,extra_block_price_usd)")
            .in("tenant_id", tenantIds)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    const result = (tenants ?? []).map((tenant) => ({
      ...tenant,
      userCount: (memberships ?? []).filter((item) => item.tenant_id === tenant.id && item.status !== "disabled").length,
      licenses: (licenses ?? []).filter((item: any) => item.tenant_id === tenant.id).map((item: any) => ({
        id: item.id,
        status: item.status,
        includedSeats: item.included_seats,
        extraSeatBlocks: item.extra_seat_blocks,
        extraBlockSize: item.extra_block_size,
        capacity: item.included_seats + item.extra_seat_blocks * item.extra_block_size,
        unitPriceUsd: Number(item.unit_price_usd ?? item.wama_module_catalog?.monthly_price_usd ?? (item.wama_module_catalog?.module_key === "expense" ? 20 : 10)),
        extraBlockPriceUsd: Number(item.extra_block_price_usd ?? item.wama_module_catalog?.extra_block_price_usd ?? (item.wama_module_catalog?.module_key === "expense" ? 20 : 10)),
        monthlyTotalUsd: Number(item.unit_price_usd ?? item.wama_module_catalog?.monthly_price_usd ?? (item.wama_module_catalog?.module_key === "expense" ? 20 : 10)) + item.extra_seat_blocks * Number(item.extra_block_price_usd ?? item.wama_module_catalog?.extra_block_price_usd ?? (item.wama_module_catalog?.module_key === "expense" ? 20 : 10)),
        renewsAt: item.renews_at,
        moduleKey: item.wama_module_catalog?.module_key,
        moduleName: item.wama_module_catalog?.name,
      })),
    }));

    return NextResponse.json({ tenants: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Acceso no autorizado." : message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

type UpdateBody = {
  tenantId?: string;
  action?: "activate_tenant" | "suspend_tenant" | "mark_paid" | "mark_past_due" | "update_license";
  reason?: string;
  paidUntil?: string | null;
  licenseId?: string;
  licenseStatus?: "trial" | "active" | "suspended" | "cancelled";
  extraSeatBlocks?: number;
};

export async function PATCH(request: Request) {
  try {
    authorize(request);
    const body = (await request.json()) as UpdateBody;
    if (!body.tenantId || !body.action) throw new Error("Faltan tenantId o action.");

    const admin = getWamaAdmin();
    const now = new Date().toISOString();
    let metadata: Record<string, unknown> = {};

    if (body.action === "activate_tenant") {
      const { error } = await admin.from("wama_tenants").update({ status: "active", billing_status: "paid", suspended_at: null, suspension_reason: null }).eq("id", body.tenantId);
      if (error) throw error;
      await admin.from("wama_tenant_module_licenses").update({ status: "active" }).eq("tenant_id", body.tenantId).eq("status", "suspended");
    }

    if (body.action === "suspend_tenant") {
      const reason = body.reason?.trim() || "Suscripción pendiente de pago";
      const { error } = await admin.from("wama_tenants").update({ status: "suspended", billing_status: "suspended", suspended_at: now, suspension_reason: reason }).eq("id", body.tenantId);
      if (error) throw error;
      await admin.from("wama_tenant_module_licenses").update({ status: "suspended" }).eq("tenant_id", body.tenantId).in("status", ["trial", "active"]);
      metadata = { reason };
    }

    if (body.action === "mark_paid") {
      if (!body.paidUntil) throw new Error("Indica la fecha pagada hasta.");
      const { error } = await admin.from("wama_tenants").update({ status: "active", billing_status: "paid", paid_until: body.paidUntil, suspended_at: null, suspension_reason: null }).eq("id", body.tenantId);
      if (error) throw error;
      const { error: licenseError } = await admin.from("wama_tenant_module_licenses").update({ status: "active", renews_at: body.paidUntil }).eq("tenant_id", body.tenantId).in("status", ["trial", "suspended", "pending"]);
      if (licenseError) throw licenseError;
      metadata = { paid_until: body.paidUntil };
    }

    if (body.action === "mark_past_due") {
      const reason = body.reason?.trim() || "Pago vencido";
      const { error } = await admin.from("wama_tenants").update({ billing_status: "past_due", suspension_reason: reason }).eq("id", body.tenantId);
      if (error) throw error;
      metadata = { reason };
    }

    if (body.action === "update_license") {
      if (!body.licenseId) throw new Error("Falta licenseId.");
      const update: Record<string, unknown> = {};
      if (body.licenseStatus) update.status = body.licenseStatus;
      if (Number.isInteger(body.extraSeatBlocks) && Number(body.extraSeatBlocks) >= 0) update.extra_seat_blocks = body.extraSeatBlocks;
      if (!Object.keys(update).length) throw new Error("No hay cambios de licencia.");
      const { error } = await admin.from("wama_tenant_module_licenses").update(update).eq("id", body.licenseId).eq("tenant_id", body.tenantId);
      if (error) throw error;
      metadata = { license_id: body.licenseId, ...update };
    }

    await admin.from("wama_platform_admin_logs").insert({ tenant_id: body.tenantId, action: body.action, reason: body.reason || null, metadata });
    return NextResponse.json({ ok: true, message: "Cambio guardado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Acceso no autorizado." : message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
