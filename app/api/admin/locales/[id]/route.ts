import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AnySupabaseClient = any;

type UpdatePayload = {
  organizationId?: number | string;
  localCode?: string | null;
  localName?: string | null;
  floor?: string | null;
  sector?: string | null;
  locationType?: string | null;
  active?: boolean | string | number | null;
  notes?: string | null;

  contactId?: number | string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  userRoleInLocal?: string | null;
  canReport?: boolean | string | number | null;
  receivesNotifications?: boolean | string | number | null;
  canRespondPumay?: boolean | string | number | null;
  isPrimaryContact?: boolean | string | number | null;
};

function getAdminClient(): AnySupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as AnySupabaseClient;
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function boolValue(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "si", "sí"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;

  return fallback;
}

function calcDataStatus(payload: {
  localName?: string | null;
  floor?: string | null;
  sector?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}) {
  const missing: string[] = [];

  if (!cleanText(payload.localName)) missing.push("local");
  if (!cleanText(payload.floor) && !cleanText(payload.sector)) {
    missing.push("piso/sector");
  }
  if (!cleanText(payload.contactName)) missing.push("contacto");
  if (!cleanText(payload.contactEmail)) missing.push("correo");
  if (!cleanText(payload.contactPhone)) missing.push("teléfono");

  if (missing.length === 0) return "Completo";

  return `Falta ${missing.join(", ")}`;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await context.params;
    const locationId = Number(id);
    const body = (await request.json()) as UpdatePayload;

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "ID de local inválido." },
        { status: 400 }
      );
    }

    const organizationId = Number(body.organizationId || 1);

    const { data: locationBefore, error: locationBeforeError } =
      await supabaseAdmin
        .from("locations")
        .select("*")
        .eq("id", locationId)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (locationBeforeError || !locationBefore) {
      return NextResponse.json(
        {
          ok: false,
          error: locationBeforeError?.message || "No se encontró el local.",
          details: locationBeforeError,
        },
        { status: 404 }
      );
    }

    const localCode = cleanText(
      body.localCode,
      locationBefore.local_code || ""
    );

    const localName = cleanText(
      body.localName,
      locationBefore.name || locationBefore.local_name || ""
    );

    const floor = cleanText(body.floor, locationBefore.floor || "");
    const sector = cleanText(body.sector, locationBefore.sector || "");
    const locationType = cleanText(
      body.locationType,
      locationBefore.location_type || "Local"
    );

    const active = boolValue(body.active, locationBefore.active ?? true);
    const notes = body.notes === undefined ? cleanText(locationBefore.notes || "") : cleanText(body.notes);

    if (!localName) {
      return NextResponse.json(
        { ok: false, error: "El nombre del local es obligatorio." },
        { status: 400 }
      );
    }

    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .update({
        local_code: localCode || null,
        name: localName,
        floor: floor || null,
        sector: sector || null,
        location_type: locationType,
        active,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", locationId)
      .eq("organization_id", organizationId)
      .select("*")
      .single();

    if (locationError) {
      return NextResponse.json(
        {
          ok: false,
          error: locationError.message,
          details: locationError,
        },
        { status: 500 }
      );
    }

    let contact = null;

    const contactId = Number(body.contactId || 0);
    const contactEmail = normalizeEmail(body.contactEmail);
    const contactName = cleanText(body.contactName);
    const contactPhone = cleanText(body.contactPhone);
    const userRoleInLocal = cleanText(body.userRoleInLocal, "Contacto local");

    const shouldHandleContact =
      Boolean(contactId) ||
      Boolean(contactEmail) ||
      Boolean(contactName) ||
      Boolean(contactPhone);

    if (shouldHandleContact) {
      if (!contactEmail) {
        return NextResponse.json(
          {
            ok: false,
            error: "El correo del contacto es obligatorio.",
          },
          { status: 400 }
        );
      }

      const isPrimaryContact = boolValue(body.isPrimaryContact, false);

      if (isPrimaryContact) {
        await supabaseAdmin
          .from("local_user_access")
          .update({
            is_primary_contact: false,
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", organizationId)
          .eq("location_id", locationId);
      }

      const contactPayload = {
        organization_id: organizationId,
        location_id: locationId,
        local_code: localCode || location.local_code || null,
        local_name: localName,
        user_email: contactEmail,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        user_role_in_local: userRoleInLocal,
        can_report: boolValue(body.canReport, true),
        receives_notifications: boolValue(body.receivesNotifications, true),
        can_respond_pumay: boolValue(body.canRespondPumay, true),
        is_primary_contact: isPrimaryContact,
        active: true,
        data_status: calcDataStatus({
          localName,
          floor,
          sector,
          contactName,
          contactEmail,
          contactPhone,
        }),
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      if (contactId) {
        const { data: contactData, error: contactError } = await supabaseAdmin
          .from("local_user_access")
          .update(contactPayload)
          .eq("id", contactId)
          .eq("organization_id", organizationId)
          .select("*")
          .single();

        if (contactError) {
          return NextResponse.json(
            {
              ok: false,
              error: contactError.message,
              details: contactError,
              contactPayload,
            },
            { status: 500 }
          );
        }

        contact = contactData;
      } else {
        const { data: contactData, error: contactError } = await supabaseAdmin
          .from("local_user_access")
          .insert({
            ...contactPayload,
            created_at: new Date().toISOString(),
          })
          .select("*")
          .single();

        if (contactError) {
          return NextResponse.json(
            {
              ok: false,
              error: contactError.message,
              details: contactError,
              contactPayload,
            },
            { status: 500 }
          );
        }

        contact = contactData;
      }
    }

    return NextResponse.json({
      ok: true,
      location,
      contact,
    });
  } catch (error) {
    console.error("PATCH admin local detail error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el local.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await context.params;
    const locationId = Number(id);

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "ID de local inválido." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = Number(searchParams.get("organizationId") || 1);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      const userEmail = normalizeEmail(searchParams.get("userEmail"));
      const userRole = cleanText(searchParams.get("userRole")).toLowerCase();

      if (!userEmail) {
        return NextResponse.json(
          { ok: false, error: "Falta userEmail para validar el owner." },
          { status: 400 }
        );
      }

      if (userRole !== "owner") {
        return NextResponse.json(
          { ok: false, error: "Solo usuarios owner pueden eliminar locales definitivamente." },
          { status: 403 }
        );
      }

      const { data: ownerProfile, error: ownerError } = await supabaseAdmin
        .from("users_pumay")
        .select("id,name,email,role,active,organization_id")
        .eq("organization_id", organizationId)
        .eq("email", userEmail)
        .eq("active", true)
        .maybeSingle();

      if (ownerError || !ownerProfile) {
        return NextResponse.json(
          {
            ok: false,
            error:
              ownerError?.message ||
              "No se encontró usuario owner activo para autorizar la eliminación.",
          },
          { status: 403 }
        );
      }

      if (cleanText(ownerProfile.role).toLowerCase() !== "owner") {
        return NextResponse.json(
          { ok: false, error: "El usuario autenticado no tiene rol owner." },
          { status: 403 }
        );
      }

      const { data: locationBefore, error: locationBeforeError } =
        await supabaseAdmin
          .from("locations")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("id", locationId)
          .maybeSingle();

      if (locationBeforeError || !locationBefore) {
        return NextResponse.json(
          {
            ok: false,
            error: locationBeforeError?.message || "No se encontró el local.",
          },
          { status: 404 }
        );
      }

      if (locationBefore.active === true) {
        return NextResponse.json(
          {
            ok: false,
            error: "Primero debes desactivar el local antes de eliminarlo definitivamente.",
          },
          { status: 400 }
        );
      }

      /*
        Antes de borrar el local, liberamos referencias directas desde incidents.
        No eliminamos casos históricos; solo dejamos location_id en null para evitar
        restricciones FK y conservar título, local_code/location_name y trazabilidad.
      */
      const { error: incidentsDetachError } = await supabaseAdmin
        .from("incidents")
        .update({
          location_id: null,
        })
        .eq("organization_id", organizationId)
        .eq("location_id", locationId);

      if (incidentsDetachError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudieron liberar casos asociados al local: ${incidentsDetachError.message}`,
            details: incidentsDetachError,
          },
          { status: 500 }
        );
      }

      const { error: contactsDeleteError } = await supabaseAdmin
        .from("local_user_access")
        .delete()
        .eq("organization_id", organizationId)
        .eq("location_id", locationId);

      if (contactsDeleteError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudieron eliminar los contactos asociados: ${contactsDeleteError.message}`,
            details: contactsDeleteError,
          },
          { status: 500 }
        );
      }

      const { error: locationDeleteError } = await supabaseAdmin
        .from("locations")
        .delete()
        .eq("organization_id", organizationId)
        .eq("id", locationId);

      if (locationDeleteError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo eliminar definitivamente el local: ${locationDeleteError.message}`,
            details: locationDeleteError,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        deleted: true,
        locationId,
      });
    }

    const { error: contactsError } = await supabaseAdmin
      .from("local_user_access")
      .update({
        active: false,
        receives_notifications: false,
        can_respond_pumay: false,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("location_id", locationId);

    if (contactsError) {
      return NextResponse.json(
        {
          ok: false,
          error: contactsError.message,
          details: contactsError,
        },
        { status: 500 }
      );
    }

    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("id", locationId)
      .select("*")
      .single();

    if (locationError) {
      return NextResponse.json(
        {
          ok: false,
          error: locationError.message,
          details: locationError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      location,
    });
  } catch (error) {
    console.error("DELETE admin local detail error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo desactivar el local.",
      },
      { status: 500 }
    );
  }
}