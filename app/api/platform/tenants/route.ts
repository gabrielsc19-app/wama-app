import { NextResponse } from "next/server";
import { getWamaAdmin } from "../../../../src/lib/server/wamaAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isExpenseModule(
  moduleKey?: string | null,
  moduleName?: string | null,
) {
  const value = `${moduleKey ?? ""} ${moduleName ?? ""}`.toLowerCase();
  return (
    value.includes("expense") ||
    value.includes("rendici") ||
    value.includes("gasto")
  );
}

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
      .select(
        "id,name,slug,code,status,billing_status,billing_period,trial_ends_at,paid_until,suspended_at,suspension_reason,created_at,updated_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;

    const tenantIds = (tenants ?? []).map((tenant) => tenant.id);
    const [{ data: memberships }, { data: licenses }, { data: payments }] =
      await Promise.all([
        tenantIds.length
          ? admin
              .from("wama_tenant_memberships")
              .select("tenant_id,status")
              .in("tenant_id", tenantIds)
          : Promise.resolve({
              data: [] as Array<{ tenant_id: string; status: string }>,
            }),
        tenantIds.length
          ? admin
              .from("wama_tenant_module_licenses")
              .select(
                "id,tenant_id,status,included_seats,extra_seat_blocks,extra_block_size,unit_price_usd,extra_block_price_usd,renews_at,wama_module_catalog(module_key,name,monthly_price_usd,extra_block_price_usd)",
              )
              .in("tenant_id", tenantIds)
          : Promise.resolve({ data: [] as unknown[] }),
        tenantIds.length
          ? admin
              .from("wama_payment_records")
              .select(
                "id,tenant_id,amount_usd,paid_at,period_start,period_end,payment_method,reference,notes,created_at",
              )
              .in("tenant_id", tenantIds)
              .order("paid_at", { ascending: false })
          : Promise.resolve({ data: [] as unknown[] }),
      ]);

    const result = (tenants ?? []).map((tenant) => ({
      ...tenant,
      userCount: (memberships ?? []).filter(
        (item) => item.tenant_id === tenant.id && item.status !== "disabled",
      ).length,
      licenses: (licenses ?? [])
        .filter((item: any) => item.tenant_id === tenant.id)
        .map((item: any) => {
          const officialPrice = 10;
          return {
            id: item.id,
            status: item.status,
            includedSeats: item.included_seats,
            extraSeatBlocks: item.extra_seat_blocks,
            extraBlockSize: item.extra_block_size,
            capacity:
              item.included_seats +
              item.extra_seat_blocks * item.extra_block_size,
            unitPriceUsd: officialPrice,
            extraBlockPriceUsd: officialPrice * item.extra_block_size,
            monthlyTotalUsd:
              (item.included_seats + item.extra_seat_blocks * item.extra_block_size) * officialPrice,
            renewsAt: item.renews_at,
            moduleKey: item.wama_module_catalog?.module_key,
            moduleName: item.wama_module_catalog?.name,
          };
        }),
      payments: (payments ?? [])
        .filter((item: any) => item.tenant_id === tenant.id)
        .map((item: any) => ({
          id: item.id,
          amountUsd: Number(item.amount_usd),
          paidAt: item.paid_at,
          periodStart: item.period_start,
          periodEnd: item.period_end,
          paymentMethod: item.payment_method,
          reference: item.reference,
          notes: item.notes,
        })),
    }));

    return NextResponse.json({ tenants: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json(
      { error: message === "UNAUTHORIZED" ? "Acceso no autorizado." : message },
      { status: message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}

type UpdateBody = {
  tenantId?: string;
  action?:
    | "activate_tenant"
    | "suspend_tenant"
    | "extend_trial"
    | "mark_paid"
    | "mark_past_due"
    | "update_license";
  reason?: string;
  paidUntil?: string | null;
  licenseId?: string;
  licenseStatus?: "trial" | "active" | "suspended" | "cancelled";
  extraSeatBlocks?: number;
  trialEndsAt?: string | null;
  amountUsd?: number;
  paidAt?: string;
  periodStart?: string;
  periodEnd?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
};

export async function PATCH(request: Request) {
  try {
    authorize(request);
    const body = (await request.json()) as UpdateBody;
    if (!body.tenantId || !body.action)
      throw new Error("Faltan tenantId o action.");

    const admin = getWamaAdmin();
    const now = new Date().toISOString();
    let metadata: Record<string, unknown> = {};

    if (body.action === "activate_tenant") {
      const { error } = await admin
        .from("wama_tenants")
        .update({
          status: "active",
          suspended_at: null,
          suspension_reason: null,
        })
        .eq("id", body.tenantId);
      if (error) throw error;
      await admin
        .from("wama_tenant_module_licenses")
        .update({ status: "active" })
        .eq("tenant_id", body.tenantId)
        .eq("status", "suspended");
    }

    if (body.action === "suspend_tenant") {
      const reason = body.reason?.trim() || "Suscripción pendiente de pago";
      const { error } = await admin
        .from("wama_tenants")
        .update({
          status: "suspended",
          billing_status: "suspended",
          suspended_at: now,
          suspension_reason: reason,
        })
        .eq("id", body.tenantId);
      if (error) throw error;
      await admin
        .from("wama_tenant_module_licenses")
        .update({ status: "suspended" })
        .eq("tenant_id", body.tenantId)
        .in("status", ["trial", "active"]);
      metadata = { reason };
    }

    if (body.action === "extend_trial") {
      if (!body.trialEndsAt)
        throw new Error(
          "No se pudo calcular el nuevo vencimiento de la prueba.",
        );
      const { error } = await admin
        .from("wama_tenants")
        .update({
          status: "trial",
          billing_status: "trial",
          trial_ends_at: body.trialEndsAt,
          paid_until: null,
          suspended_at: null,
          suspension_reason: null,
        })
        .eq("id", body.tenantId);
      if (error) throw error;
      const { error: licenseError } = await admin
        .from("wama_tenant_module_licenses")
        .update({ status: "trial", renews_at: body.trialEndsAt })
        .eq("tenant_id", body.tenantId)
        .in("status", ["trial", "suspended", "pending"]);
      if (licenseError) throw licenseError;
      metadata = { trial_ends_at: body.trialEndsAt, extension_days: 15 };
    }

    if (body.action === "mark_paid") {
      if (
        !body.paidUntil ||
        !body.paidAt ||
        !body.periodStart ||
        !body.periodEnd
      )
        throw new Error("Completa las fechas del pago y del periodo cubierto.");
      if (!body.amountUsd || body.amountUsd <= 0)
        throw new Error("Ingresa un monto de pago válido.");
      if (!body.paymentMethod?.trim())
        throw new Error("Selecciona el medio de pago.");
      const { error: paymentError } = await admin
        .from("wama_payment_records")
        .insert({
          tenant_id: body.tenantId,
          amount_usd: body.amountUsd,
          paid_at: body.paidAt,
          period_start: body.periodStart,
          period_end: body.periodEnd,
          payment_method: body.paymentMethod.trim(),
          reference: body.reference?.trim() || null,
          notes: body.notes?.trim() || null,
        });
      if (paymentError) throw paymentError;
      const { error } = await admin
        .from("wama_tenants")
        .update({
          status: "active",
          billing_status: "paid",
          paid_until: body.paidUntil,
          suspended_at: null,
          suspension_reason: null,
        })
        .eq("id", body.tenantId);
      if (error) throw error;
      const { error: licenseError } = await admin
        .from("wama_tenant_module_licenses")
        .update({ status: "active", renews_at: body.paidUntil })
        .eq("tenant_id", body.tenantId)
        .in("status", ["trial", "suspended", "pending"]);
      if (licenseError) throw licenseError;
      metadata = {
        amount_usd: body.amountUsd,
        paid_at: body.paidAt,
        period_start: body.periodStart,
        period_end: body.periodEnd,
        payment_method: body.paymentMethod,
        reference: body.reference || null,
        paid_until: body.paidUntil,
      };
    }

    if (body.action === "mark_past_due") {
      const reason = body.reason?.trim() || "Pago vencido";
      const { error } = await admin
        .from("wama_tenants")
        .update({ billing_status: "past_due", suspension_reason: reason })
        .eq("id", body.tenantId);
      if (error) throw error;
      metadata = { reason };
    }

    if (body.action === "update_license") {
      if (!body.licenseId) throw new Error("Falta licenseId.");
      const update: Record<string, unknown> = {};
      if (body.licenseStatus) update.status = body.licenseStatus;
      if (
        Number.isInteger(body.extraSeatBlocks) &&
        Number(body.extraSeatBlocks) >= 0
      )
        update.extra_seat_blocks = body.extraSeatBlocks;
      if (!Object.keys(update).length)
        throw new Error("No hay cambios de licencia.");
      const { error } = await admin
        .from("wama_tenant_module_licenses")
        .update(update)
        .eq("id", body.licenseId)
        .eq("tenant_id", body.tenantId);
      if (error) throw error;
      metadata = { license_id: body.licenseId, ...update };
    }

    await admin.from("wama_platform_admin_logs").insert({
      tenant_id: body.tenantId,
      action: body.action,
      reason: body.reason || null,
      metadata,
    });
    return NextResponse.json({
      ok: true,
      message: "Cambio guardado correctamente.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json(
      { error: message === "UNAUTHORIZED" ? "Acceso no autorizado." : message },
      { status: message === "UNAUTHORIZED" ? 401 : 400 },
    );
  }
}
