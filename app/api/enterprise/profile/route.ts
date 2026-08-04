import { NextResponse } from "next/server";
import {
  getUserTenantContext,
  isTenantAdmin,
  requireWamaUser,
} from "../../../../src/lib/server/wamaAdmin";

type ProfileUpdateBody = {
  tenantId?: string;
  name?: string;
  website?: string | null;
  logoUrl?: string | null;
};

export async function PATCH(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, membership } = await getUserTenantContext(user.id);

    if (!isTenantAdmin(membership.role)) {
      return NextResponse.json(
        { error: "Solo el propietario o un administrador puede modificar la empresa." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as ProfileUpdateBody;
    if (!body.tenantId || body.tenantId !== membership.tenant_id) {
      return NextResponse.json({ error: "La empresa indicada no corresponde a tu cuenta." }, { status: 403 });
    }

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "El nombre de la empresa es obligatorio." }, { status: 400 });
    }

    const { error } = await admin
      .from("wama_tenants")
      .update({
        name,
        website: body.website?.trim() || null,
        logo_url: body.logoUrl || null,
      })
      .eq("id", membership.tenant_id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible guardar los cambios.";
    return NextResponse.json(
      { error: message === "UNAUTHORIZED" ? "Tu sesión terminó. Vuelve a ingresar." : message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
