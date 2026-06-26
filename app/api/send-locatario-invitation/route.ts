import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type AnySupabaseClient = any;

function getAdminClient(): AnySupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
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

async function findAuthUserByEmail(supabaseAdmin: AnySupabaseClient, email: string) {
  const normalizedEmail = normalizeEmail(email);

  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`No se pudo listar usuarios Auth: ${error.message}`);
    }

    const users = data?.users || [];
    const found = users.find(
      (user: any) => normalizeEmail(user.email) === normalizedEmail
    );

    if (found) return found;

    if (users.length < perPage) break;

    page += 1;
  }

  return null;
}

function buildEmailHtml({
  localName,
  recipientName,
  recipientEmail,
  password,
  appUrl,
}: {
  localName: string;
  recipientName: string;
  recipientEmail: string;
  password: string;
  appUrl: string;
}) {
  return `
  <div style="margin:0;padding:0;background:#eef4fa;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
      <div style="background:linear-gradient(90deg,#0f172a,#075985);padding:28px;border-radius:24px 24px 0 0;color:white;">
        <p style="margin:0;font-size:15px;opacity:.9;">Report. Assign. Resolve.</p>
        <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;">Bienvenido/a a FixLoop | Pumay</h1>
      </div>

      <div style="background:white;padding:28px;border:1px solid #dbeafe;border-top:0;border-radius:0 0 24px 24px;">
        <p style="font-size:17px;margin:0 0 16px;">Hola ${recipientName},</p>

        <p style="font-size:16px;line-height:1.5;margin:0 0 18px;">
          Tu acceso como contacto de local fue creado correctamente.
        </p>

        <div style="border:1px solid #cbd5e1;background:#f8fafc;border-radius:18px;padding:18px;margin:20px 0;">
          <p style="margin:0 0 10px;"><strong>Local:</strong> ${localName}</p>
          <p style="margin:0 0 10px;"><strong>Link de acceso:</strong> <a href="${appUrl}" style="color:#0369a1;">${appUrl}</a></p>
          <p style="margin:0 0 10px;"><strong>Usuario:</strong> ${recipientEmail}</p>
          <p style="margin:0 0 10px;"><strong>Contraseña temporal:</strong> ${password}</p>
          <p style="margin:0;"><strong>Rol:</strong> Locatario / Contacto de local</p>
        </div>

        <div style="border:1px solid #86efac;background:#ecfdf5;border-radius:18px;padding:16px;margin-top:20px;">
          <p style="margin:0;font-size:14px;line-height:1.5;color:#065f46;">
            <strong>Importante:</strong> ingresa con el correo y contraseña temporal indicados. Luego podrás cambiar tu contraseña desde recuperación de contraseña si lo necesitas.
          </p>
        </div>

        <div style="margin-top:24px;">
          <a href="${appUrl}" style="display:inline-block;background:#0f172a;color:white;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:bold;">
            Ingresar a FixLoop
          </a>
        </div>
      </div>
    </div>
  </div>`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const organizationId = Number(body.organizationId || 1);
    const contactId = Number(body.contactId || 0);
    const locationId = Number(body.locationId || 0);

    const localName = cleanText(body.localName, "Local Pumay");
    const recipientName = cleanText(body.recipientName, "Locatario/a");
    const recipientEmail = normalizeEmail(body.recipientEmail);
    const password = cleanText(body.password, "Pumay2026!");

    const appUrl =
      cleanText(process.env.NEXT_PUBLIC_APP_URL) ||
      "https://fixloop-pumay.vercel.app";

    if (!recipientEmail) {
      return NextResponse.json(
        { ok: false, error: "Falta el correo del locatario." },
        { status: 400 }
      );
    }

    if (!locationId && !contactId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta locationId o contactId para asociar el acceso al local.",
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    let finalLocationId = locationId;

    if (!finalLocationId && contactId) {
      const { data: contactLookup, error: contactLookupError } =
        await supabaseAdmin
          .from("local_user_access")
          .select("location_id")
          .eq("id", contactId)
          .eq("organization_id", organizationId)
          .maybeSingle();

      if (contactLookupError || !contactLookup?.location_id) {
        return NextResponse.json(
          {
            ok: false,
            error:
              contactLookupError?.message ||
              "No se pudo obtener el local asociado al contacto.",
          },
          { status: 400 }
        );
      }

      finalLocationId = Number(contactLookup.location_id);
    }

    const { data: locationData, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("*")
      .eq("id", finalLocationId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (locationError || !locationData) {
      return NextResponse.json(
        {
          ok: false,
          error: locationError?.message || "No se encontró el local asociado.",
        },
        { status: 404 }
      );
    }

    const existingAuthUser = await findAuthUserByEmail(
      supabaseAdmin,
      recipientEmail
    );

    let authUserId: string | null = null;

    if (existingAuthUser?.id) {
      const { data: updatedAuth, error: updateAuthError } =
        await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
          email: recipientEmail,
          password,
          email_confirm: true,
          user_metadata: {
            name: recipientName,
            role: "locatario",
            organization_id: organizationId,
            location_id: finalLocationId,
            local_name: localName,
          },
        });

      if (updateAuthError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo actualizar usuario Auth: ${updateAuthError.message}`,
          },
          { status: 500 }
        );
      }

      authUserId = updatedAuth?.user?.id || existingAuthUser.id;
    } else {
      const { data: createdAuth, error: createAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email: recipientEmail,
          password,
          email_confirm: true,
          user_metadata: {
            name: recipientName,
            role: "locatario",
            organization_id: organizationId,
            location_id: finalLocationId,
            local_name: localName,
          },
        });

      if (createAuthError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo crear usuario Auth: ${createAuthError.message}`,
          },
          { status: 500 }
        );
      }

      authUserId = createdAuth?.user?.id || null;
    }

    const userPayload = {
      name: recipientName,
      email: recipientEmail,
      phone: null,
      role: "locatario",
      location_id: finalLocationId,
      active: true,
      organization_id: organizationId,
      must_change_password: false,
    };

    const { data: existingProfile } = await supabaseAdmin
      .from("users_pumay")
      .select("id,email")
      .eq("organization_id", organizationId)
      .eq("email", recipientEmail)
      .maybeSingle();

    if (existingProfile?.id) {
      const { error: updateProfileError } = await supabaseAdmin
        .from("users_pumay")
        .update(userPayload)
        .eq("id", existingProfile.id)
        .eq("organization_id", organizationId);

      if (updateProfileError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo actualizar users_pumay: ${updateProfileError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      const { error: insertProfileError } = await supabaseAdmin
        .from("users_pumay")
        .insert(userPayload);

      if (insertProfileError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo crear users_pumay: ${insertProfileError.message}`,
          },
          { status: 500 }
        );
      }
    }

    const accessUpdatePayload = {
      organization_id: organizationId,
      location_id: finalLocationId,
      local_code: locationData.local_code || null,
      local_name: locationData.name || localName,
      user_email: recipientEmail,
      contact_name: recipientName,
      user_role_in_local: cleanText(body.userRoleInLocal, "Contacto local"),
      active: true,
      can_report: true,
      receives_notifications: true,
      can_respond_pumay: true,
      can_respond_pumay_cases: true,
      invitation_sent: true,
      invitation_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (contactId) {
      const { error: updateAccessError } = await supabaseAdmin
        .from("local_user_access")
        .update(accessUpdatePayload)
        .eq("id", contactId)
        .eq("organization_id", organizationId);

      if (updateAccessError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo actualizar local_user_access: ${updateAccessError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      const { error: upsertAccessError } = await supabaseAdmin
        .from("local_user_access")
        .upsert(accessUpdatePayload, {
          onConflict: "organization_id,location_id,user_email",
        });

      if (upsertAccessError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo crear local_user_access: ${upsertAccessError.message}`,
          },
          { status: 500 }
        );
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      cleanText(process.env.RESEND_FROM_EMAIL) ||
      "FixLoop Pumay <no-reply@send.pumay.cl>";

    if (!resendApiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El acceso fue creado, pero falta RESEND_API_KEY para enviar el correo.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Acceso FixLoop | ${localName}`,
      html: buildEmailHtml({
        localName,
        recipientName,
        recipientEmail,
        password,
        appUrl,
      }),
    });

    if (emailError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            typeof emailError === "string"
              ? emailError
              : "El acceso fue creado, pero no se pudo enviar el correo.",
          authUserId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      authUserId,
      email: recipientEmail,
      localName,
      password,
    });
  } catch (error) {
    console.error("send-locatario-invitation error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear o enviar el acceso al locatario.",
      },
      { status: 500 }
    );
  }
}