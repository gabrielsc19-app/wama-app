import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
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
  });
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
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

function normalizeDataStatus(contact: any, active: boolean) {
  if (!active) return "Desactivado";

  const contactName = cleanText(contact?.contact_name);
  const contactEmail = cleanText(contact?.user_email);
  const contactPhone = cleanText(contact?.contact_phone);

  if (contactName && contactEmail && contactPhone) return "Completo";

  return contact?.data_status && contact.data_status !== "Desactivado"
    ? contact.data_status
    : "Falta información";
}

function appendNote(existingNote: unknown, newNote: string) {
  const current = cleanText(existingNote);

  if (!current) return newNote;

  return `${current} | ${newNote}`;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await context.params;
    const contactId = Number(id);

    if (!contactId) {
      return NextResponse.json(
        { ok: false, error: "ID de contacto inválido." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = Number(searchParams.get("organizationId") || 1);
    const permanent = searchParams.get("permanent") === "true";

    const { data: contactBefore, error: contactBeforeError } =
      await supabaseAdmin
        .from("local_user_access")
        .select("*")
        .eq("id", contactId)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (contactBeforeError || !contactBefore) {
      return NextResponse.json(
        {
          ok: false,
          error: contactBeforeError?.message || "No se encontró el contacto.",
          details: contactBeforeError,
        },
        { status: 404 }
      );
    }

    if (permanent) {
      const { error: deleteError } = await supabaseAdmin
        .from("local_user_access")
        .delete()
        .eq("id", contactId)
        .eq("organization_id", organizationId);

      if (deleteError) {
        return NextResponse.json(
          {
            ok: false,
            error: deleteError.message,
            details: deleteError,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        deleted: true,
        contactId,
      });
    }

    const { data: contact, error } = await supabaseAdmin
      .from("local_user_access")
      .update({
        active: false,
        receives_notifications: false,
        can_respond_pumay: false,
        can_report: false,
        is_primary_contact: false,
        data_status: "Desactivado",
        notes: appendNote(
          contactBefore.notes,
          "Contacto desactivado desde panel super_admin."
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      deleted: false,
      contact,
    });
  } catch (error) {
    console.error("DELETE admin contact error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo desactivar o eliminar el contacto.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await context.params;
    const contactId = Number(id);

    if (!contactId) {
      return NextResponse.json(
        { ok: false, error: "ID de contacto inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const organizationId = Number(body.organizationId || 1);

    const { data: contactBefore, error: contactBeforeError } =
      await supabaseAdmin
        .from("local_user_access")
        .select("*")
        .eq("id", contactId)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (contactBeforeError || !contactBefore) {
      return NextResponse.json(
        {
          ok: false,
          error: contactBeforeError?.message || "No se encontró el contacto.",
          details: contactBeforeError,
        },
        { status: 404 }
      );
    }

    const active = boolValue(body.active, contactBefore.active ?? true);

    if (active && body.isPrimaryContact === true) {
      await supabaseAdmin
        .from("local_user_access")
        .update({
          is_primary_contact: false,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("location_id", contactBefore.location_id);
    }

    const updatePayload = active
      ? {
          active: true,
          receives_notifications: boolValue(
            body.receivesNotifications,
            contactBefore.receives_notifications ?? true
          ),
          can_respond_pumay: boolValue(
            body.canRespondPumay,
            contactBefore.can_respond_pumay ?? true
          ),
          can_report: boolValue(body.canReport, contactBefore.can_report ?? true),
          is_primary_contact: boolValue(
            body.isPrimaryContact,
            contactBefore.is_primary_contact ?? false
          ),
          data_status: normalizeDataStatus(contactBefore, true),
          notes: appendNote(
            contactBefore.notes,
            "Contacto reactivado desde panel super_admin."
          ),
          updated_at: new Date().toISOString(),
        }
      : {
          active: false,
          receives_notifications: false,
          can_respond_pumay: false,
          can_report: false,
          is_primary_contact: false,
          data_status: "Desactivado",
          notes: appendNote(
            contactBefore.notes,
            "Contacto desactivado desde panel super_admin."
          ),
          updated_at: new Date().toISOString(),
        };

    const { data: contact, error } = await supabaseAdmin
      .from("local_user_access")
      .update(updatePayload)
      .eq("id", contactId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      contact,
    });
  } catch (error) {
    console.error("PATCH admin contact error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el contacto.",
      },
      { status: 500 }
    );
  }
}