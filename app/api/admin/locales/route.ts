import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AnySupabaseClient = any;

type ContactRow = {
  id?: number;
  organization_id?: number;
  location_id?: number | null;
  local_code?: string | null;
  local_name?: string | null;
  user_email?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  user_role_in_local?: string | null;
  can_report?: boolean | null;
  receives_notifications?: boolean | null;
  can_respond_pumay?: boolean | null;
  is_primary_contact?: boolean | null;
  active?: boolean | null;
  data_status?: string | null;
  notes?: string | null;
};

type LocationRow = {
  id?: number;
  organization_id?: number;
  local_code?: string | null;
  name?: string | null;
  floor?: string | null;
  sector?: string | null;
  location_type?: string | null;
  active?: boolean | null;
  notes?: string | null;
};

function getAdminClient(): AnySupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as AnySupabaseClient;
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function normalizeRole(value: unknown) {
  return cleanText(value, "Contacto local");
}

function contactIsIncomplete(contact: ContactRow) {
  return (
    !cleanText(contact?.user_email) ||
    !cleanText(contact?.contact_name) ||
    !cleanText(contact?.contact_phone)
  );
}

function locationDataStatus(location: LocationRow, contacts: ContactRow[]) {
  if (location?.active === false) return "Desactivado";

  const hasLocationData =
    cleanText(location?.local_code) &&
    cleanText(location?.name) &&
    cleanText(location?.floor) &&
    cleanText(location?.sector);

  if (!hasLocationData) return "Incompleto";
  if (!contacts.length) return "Incompleto";
  if (contacts.some(contactIsIncomplete)) return "Incompleto";

  return "Completo";
}

async function getNextLocalCode(
  supabaseAdmin: AnySupabaseClient,
  organizationId: number
) {
  const { data, error } = await supabaseAdmin
    .from("locations")
    .select("local_code")
    .eq("organization_id", organizationId)
    .like("local_code", "L%")
    .order("local_code", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as Array<{ local_code: string | null }>;
  const lastCode = cleanText(rows[0]?.local_code);
  const lastNumber = Number(lastCode.replace(/\D/g, "")) || 0;
  const nextNumber = lastNumber + 1;

  return `L${String(nextNumber).padStart(3, "0")}`;
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);

    const organizationId = Number(searchParams.get("organizationId") || 1);
    const search = cleanText(searchParams.get("search")).toLowerCase();
    const status = cleanText(searchParams.get("status"), "all");
    const active = cleanText(searchParams.get("active"), "all");

    let locationsQuery = supabaseAdmin
      .from("locations")
      .select("*")
      .eq("organization_id", organizationId)
      .order("local_code", { ascending: true })
      .order("id", { ascending: true });

    const { data: locationsData, error: locationsError } = await locationsQuery;

    if (locationsError) {
      return NextResponse.json(
        { ok: false, error: locationsError.message, details: locationsError },
        { status: 500 }
      );
    }

    const { data: contactsData, error: contactsError } = await supabaseAdmin
      .from("local_user_access")
      .select("*")
      .eq("organization_id", organizationId)
      .order("local_code", { ascending: true })
      .order("id", { ascending: true });

    if (contactsError) {
      return NextResponse.json(
        { ok: false, error: contactsError.message, details: contactsError },
        { status: 500 }
      );
    }

    const contacts = (contactsData || []) as ContactRow[];
    const contactsByLocationId = new Map<number, ContactRow[]>();
    const contactsByLocalCode = new Map<string, ContactRow[]>();

    for (const contact of contacts) {
      const locationId = Number(contact.location_id || 0);
      const localCode = cleanText(contact.local_code);

      if (locationId) {
        const current = contactsByLocationId.get(locationId) || [];
        current.push(contact);
        contactsByLocationId.set(locationId, current);
      }

      if (localCode) {
        const current = contactsByLocalCode.get(localCode) || [];
        current.push(contact);
        contactsByLocalCode.set(localCode, current);
      }
    }

    let locations = ((locationsData || []) as LocationRow[]).map((location) => {
      const localCode = cleanText(location.local_code);
      const locationId = Number(location.id || 0);

      const locationContacts =
        contactsByLocationId.get(locationId) ||
        contactsByLocalCode.get(localCode) ||
        [];

      const activeContacts = locationContacts.filter((contact) => contact.active !== false);
      const primaryContact =
        activeContacts.find((contact) => contact.is_primary_contact) ||
        activeContacts[0] ||
        locationContacts[0] ||
        null;

      const incompleteContacts = locationContacts.filter(contactIsIncomplete).length;
      const dataStatus = locationDataStatus(location, locationContacts);

      return {
        id: location.id,
        organization_id: location.organization_id,
        local_code: localCode,
        name: cleanText(location.name),
        local_name: cleanText(location.name),
        floor: location.floor ?? null,
        sector: location.sector ?? null,
        location_type: location.location_type ?? "Local",
        active: location.active !== false,
        notes: location.notes ?? null,
        contacts: locationContacts,
        contacts_count: locationContacts.length,
        incomplete_contacts: incompleteContacts,
        primary_contact: primaryContact,
        data_status: dataStatus,
      };
    });

    if (search) {
      locations = locations.filter((location) => {
        const contactText = (location.contacts || [])
          .map((contact: ContactRow) =>
            [
              contact.user_email,
              contact.contact_name,
              contact.contact_phone,
              contact.local_name,
            ].join(" ")
          )
          .join(" ");

        const haystack = [
          location.local_code,
          location.local_name,
          location.name,
          location.floor,
          location.sector,
          contactText,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    if (status === "complete") {
      locations = locations.filter((location) => location.data_status === "Completo");
    }

    if (status === "incomplete") {
      locations = locations.filter((location) => location.data_status !== "Completo");
    }

    const summaryBaseLocations = [...locations];

    const summary = {
      totalLocations: summaryBaseLocations.length,
      activeLocations: summaryBaseLocations.filter((location) => location.active).length,
      inactiveLocations: summaryBaseLocations.filter((location) => !location.active).length,
      incompleteLocations: summaryBaseLocations.filter((location) => location.data_status !== "Completo").length,
      totalContacts: summaryBaseLocations.reduce(
        (sum, location) => sum + Number(location.contacts_count || 0),
        0
      ),
      incompleteContacts: summaryBaseLocations.reduce(
        (sum, location) => sum + Number(location.incomplete_contacts || 0),
        0
      ),
    };

    if (active === "active") {
      locations = locations.filter((location) => location.active);
    }

    if (active === "inactive") {
      locations = locations.filter((location) => !location.active);
    }

    return NextResponse.json({
      ok: true,
      locations,
      summary,
    });
  } catch (error) {
    console.error("GET admin locales error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los locales.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();

    const organizationId = Number(body.organizationId || 1);
    const localCode =
      cleanText(body.localCode) || (await getNextLocalCode(supabaseAdmin, organizationId));
    const localName = cleanText(body.localName);

    if (!localName) {
      return NextResponse.json(
        { ok: false, error: "El nombre del local es obligatorio." },
        { status: 400 }
      );
    }

    const floor = cleanText(body.floor);
    const sector = cleanText(body.sector);
    const active = body.active === undefined ? true : Boolean(body.active);

    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .insert({
        organization_id: organizationId,
        local_code: localCode,
        name: localName,
        floor: floor || null,
        sector: sector || null,
        active,
      })
      .select("*")
      .single();

    if (locationError) {
      return NextResponse.json(
        { ok: false, error: locationError.message, details: locationError },
        { status: 500 }
      );
    }

    const contactEmail = normalizeEmail(body.contactEmail);
    let contact: ContactRow | null = null;

    if (contactEmail) {
      const contactPayload = {
        organization_id: organizationId,
        location_id: location.id,
        local_code: localCode,
        local_name: localName,
        user_email: contactEmail,
        contact_name: cleanText(body.contactName) || null,
        contact_phone: cleanText(body.contactPhone) || null,
        user_role_in_local: normalizeRole(body.userRoleInLocal),
        can_report: body.canReport === undefined ? true : Boolean(body.canReport),
        receives_notifications:
          body.receivesNotifications === undefined
            ? true
            : Boolean(body.receivesNotifications),
        can_respond_pumay:
          body.canRespondPumay === undefined
            ? true
            : Boolean(body.canRespondPumay),
        is_primary_contact:
          body.isPrimaryContact === undefined
            ? true
            : Boolean(body.isPrimaryContact),
        active: true,
        data_status:
          cleanText(body.contactName) && cleanText(body.contactPhone)
            ? "Completo"
            : "Falta información",
        notes: cleanText(body.notes) || null,
      };

      const { data: contactData, error: contactError } = await supabaseAdmin
        .from("local_user_access")
        .insert(contactPayload)
        .select("*")
        .single();

      if (contactError) {
        return NextResponse.json(
          {
            ok: false,
            error: contactError.message,
            details: contactError,
            location,
          },
          { status: 500 }
        );
      }

      contact = contactData as ContactRow;
    }

    return NextResponse.json({
      ok: true,
      location,
      contact,
    });
  } catch (error) {
    console.error("POST admin locales error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el local.",
      },
      { status: 500 }
    );
  }
}
