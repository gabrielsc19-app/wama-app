import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeRole(role?: string | null) {
  const value = normalizeText(role);

  if (value.includes("owner")) return "owner";
  if (value.includes("super")) return "super_admin";
  if (value.includes("mantencion") || value.includes("mantenimiento")) return "mantencion";
  if (value.includes("seguridad")) return "seguridad";
  if (value.includes("aseo")) return "aseo";
  if (value.includes("operacion")) return "operaciones";
  if (value.includes("comercial")) return "comercial";
  if (value === "locatario_admin") return "locatario_admin";
  if (value === "locatario") return "locatario";

  return value;
}

function isLocalRole(role?: string | null) {
  const value = normalizeRole(role);
  return value === "locatario" || value === "locatario_admin";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const organizationId = Number(body.organizationId || body.organization_id || 1);
    const userEmail = String(body.userEmail || body.user_email || "")
      .toLowerCase()
      .trim();

    const role = normalizeRole(body.role);
    const locationIdRaw = body.locationId || body.location_id || null;

    const locationId =
      locationIdRaw === null || locationIdRaw === undefined || locationIdRaw === ""
        ? null
        : Number(locationIdRaw);

    if (!organizationId || Number.isNaN(organizationId)) {
      return NextResponse.json(
        { ok: false, error: "organizationId inválido" },
        { status: 400 },
      );
    }

    if (!userEmail && !role && !locationId) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos para calcular pendientes" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    let commercialUnread = 0;

    if (role === "comercial") {
      const { data: publications, error: publicationsError } = await supabase
        .from("commercial_publications")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("status", "sent")
        .eq("archived", false);

      if (publicationsError) {
        throw publicationsError;
      }

      const publicationIds = (publications || [])
        .map((item: { id?: number | null }) => item.id)
        .filter((id): id is number => typeof id === "number");

      if (publicationIds.length > 0) {
        const { data: unreadRecipients, error: unreadRecipientsError } = await supabase
          .from("commercial_publication_recipients")
          .select("publication_id")
          .eq("organization_id", organizationId)
          .is("read_at", null)
          .in("publication_id", publicationIds);

        if (unreadRecipientsError) {
          throw unreadRecipientsError;
        }

        commercialUnread = new Set(
          (unreadRecipients || [])
            .map((item: { publication_id?: number | null }) => item.publication_id)
            .filter((id): id is number => typeof id === "number"),
        ).size;
      }
    } else {
      const recipientFilters: string[] = [];

      if (isLocalRole(role) && locationId) {
        recipientFilters.push(`location_id.eq.${locationId}`);
      }

      if (userEmail) {
        recipientFilters.push(`recipient_email.eq.${userEmail}`);
      }

      if (recipientFilters.length > 0) {
        const { data: recipients, error: recipientsError } = await supabase
          .from("commercial_publication_recipients")
          .select("id,publication_id,read_at")
          .eq("organization_id", organizationId)
          .or(recipientFilters.join(","));

        if (recipientsError) {
          throw recipientsError;
        }

        const publicationIds = Array.from(
          new Set(
            (recipients || [])
              .map((item: { publication_id?: number | null }) => item.publication_id)
              .filter((id): id is number => typeof id === "number"),
          ),
        );

        if (publicationIds.length > 0) {
          const { data: activePublications, error: activePublicationsError } =
            await supabase
              .from("commercial_publications")
              .select("id")
              .eq("organization_id", organizationId)
              .eq("status", "sent")
              .eq("archived", false)
              .in("id", publicationIds);

          if (activePublicationsError) {
            throw activePublicationsError;
          }

          const activePublicationIds = (activePublications || [])
            .map((item: { id?: number | null }) => item.id)
            .filter((id): id is number => typeof id === "number");

          const { data: reads, error: readsError } = await supabase
            .from("commercial_publication_reads")
            .select("publication_id")
            .in("publication_id", activePublicationIds)
            .eq("user_email", userEmail);

          if (readsError) {
            throw readsError;
          }

          const readFromNewTable = new Set(
            (reads || [])
              .map((item: { publication_id?: number | null }) => item.publication_id)
              .filter((id): id is number => typeof id === "number"),
          );

          const readFromRecipients = new Set(
            (recipients || [])
              .filter((item: { read_at?: string | null }) => item.read_at)
              .map((item: { publication_id?: number | null }) => item.publication_id)
              .filter((id): id is number => typeof id === "number"),
          );

          commercialUnread = activePublicationIds.filter(
            (publicationId) =>
              !readFromNewTable.has(publicationId) &&
              !readFromRecipients.has(publicationId),
          ).length;
        }
      }
    }

    const incidentPending = 0;
    const urgentPending = 0;
    const checklistPending = 0;

    const count =
      commercialUnread + incidentPending + urgentPending + checklistPending;

    return NextResponse.json({
      ok: true,
      count,
      details: {
        commercialUnread,
        incidentPending,
        urgentPending,
        checklistPending,
      },
    });
  } catch (error) {
    console.error("Error calculating pending count:", error);

    return NextResponse.json(
      { ok: false, error: "Error interno al calcular pendientes" },
      { status: 500 },
    );
  }
}