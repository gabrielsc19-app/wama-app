import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

type PushSubscriptionRow = {
  id: string;
  user_email: string | null;
  organization_id: number;
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
};

type RecipientRow = {
  publication_id?: number | null;
  read_at?: string | null;
};

type PublicationRow = {
  id?: number | null;
};

type ReadRow = {
  publication_id?: number | null;
};

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getVapidKeys() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    "";

  const privateKey =
    process.env.VAPID_PRIVATE_KEY ||
    process.env.WEB_PUSH_PRIVATE_KEY ||
    "";

  const subject =
    process.env.VAPID_SUBJECT ||
    process.env.WEB_PUSH_SUBJECT ||
    "mailto:contacto@pumay.cl";

  return { publicKey, privateKey, subject };
}

async function getLocalContactEmails(
  supabaseAdmin: any,
  organizationId: number,
  email?: string,
  localCode?: string,
  localName?: string,
) {
  const directEmail = normalizeEmail(email);
  if (directEmail) return [directEmail];

  let query = supabaseAdmin
    .from("local_user_access")
    .select("user_email, local_code, local_name, active, organization_id")
    .eq("organization_id", organizationId)
    .eq("active", true);

  const code = String(localCode || "").trim();
  const name = String(localName || "").trim();

  if (code) {
    query = query.eq("local_code", code);
  } else if (name) {
    query = query.ilike("local_name", `%${name}%`);
  } else {
    return [];
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error buscando contacto local para notificación:", error);
    return [];
  }

  return Array.from(
    new Set(
      (data || [])
        .map((row: { user_email?: string | null }) => normalizeEmail(row.user_email))
        .filter(Boolean),
    ),
  );
}

async function getCommercialUnreadCountForEmail(
  supabaseAdmin: any,
  organizationId: number,
  userEmail: string,
) {
  const email = normalizeEmail(userEmail);

  if (!email) return 0;

  const { data: recipientsData, error: recipientsError } = await supabaseAdmin
    .from("commercial_publication_recipients")
    .select("publication_id,read_at")
    .eq("organization_id", organizationId)
    .eq("recipient_email", email);

  if (recipientsError || !recipientsData || recipientsData.length === 0) {
    if (recipientsError) {
      console.error("Error calculando comunicaciones pendientes:", recipientsError);
    }

    return 0;
  }

  const recipients = recipientsData as RecipientRow[];

  const publicationIds = Array.from(
    new Set<number>(
      recipients
        .map((item) => item.publication_id)
        .filter(
          (id: number | null | undefined): id is number =>
            typeof id === "number",
        ),
    ),
  );

  if (publicationIds.length === 0) return 0;

  const { data: activePublicationsData, error: activePublicationsError } =
    await supabaseAdmin
      .from("commercial_publications")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("status", "sent")
      .eq("archived", false)
      .in("id", publicationIds);

  if (activePublicationsError || !activePublicationsData) {
    if (activePublicationsError) {
      console.error("Error consultando publicaciones activas:", activePublicationsError);
    }

    return 0;
  }

  const activePublications = activePublicationsData as PublicationRow[];

  const activePublicationIds = activePublications
    .map((item) => item.id)
    .filter(
      (id: number | null | undefined): id is number =>
        typeof id === "number",
    );

  if (activePublicationIds.length === 0) return 0;

  const { data: readsData, error: readsError } = await supabaseAdmin
    .from("commercial_publication_reads")
    .select("publication_id")
    .in("publication_id", activePublicationIds)
    .eq("user_email", email);

  if (readsError) {
    console.error("Error consultando lecturas comerciales:", readsError);
  }

  const reads = (readsData || []) as ReadRow[];

  const readFromNewTable = new Set(
    reads
      .map((item) => item.publication_id)
      .filter(
        (id: number | null | undefined): id is number =>
          typeof id === "number",
      ),
  );

  const readFromRecipients = new Set(
    recipients
      .filter((item) => item.read_at)
      .map((item) => item.publication_id)
      .filter(
        (id: number | null | undefined): id is number =>
          typeof id === "number",
      ),
  );

  return activePublicationIds.filter(
    (publicationId) =>
      !readFromNewTable.has(publicationId) &&
      !readFromRecipients.has(publicationId),
  ).length;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 },
      );
    }

    const { publicKey, privateKey, subject } = getVapidKeys();

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan llaves VAPID. Revisa NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.",
        },
        { status: 500 },
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const body = await request.json().catch(() => ({}));

    const organizationId = Number(body.organizationId || body.organization_id || 1);
    const email = String(body.email || body.userEmail || body.targetEmail || "").trim();
    const localCode = String(body.localCode || body.targetLocalCode || "").trim();
    const localName = String(body.localName || body.targetLocalName || "").trim();

    const manualPendingCountRaw =
      body.pendingCount ??
      body.pending_count ??
      body.badgeCount ??
      body.badge_count ??
      null;

    const manualPendingCount =
      manualPendingCountRaw === null ||
      manualPendingCountRaw === undefined ||
      manualPendingCountRaw === ""
        ? null
        : Number(manualPendingCountRaw);

    const title = String(
      body.title || "FixLoop | Pumay: nuevo caso para tu local",
    ).trim();

    const message = String(
      body.body ||
        body.message ||
        `Tienes una nueva gestión pendiente${localName ? ` en ${localName}` : ""}.`,
    ).trim();

    const url = String(body.url || "/").trim();

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const targetEmails = await getLocalContactEmails(
      supabaseAdmin,
      organizationId,
      email,
      localCode,
      localName,
    );

    if (targetEmails.length === 0) {
      return NextResponse.json({
        ok: true,
        notified: 0,
        reason: "No se encontraron correos de contacto local para notificar.",
        organizationId,
        email: email || null,
        localCode: localCode || null,
        localName: localName || null,
        targetEmails: [],
      });
    }

    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,user_email,organization_id,endpoint,p256dh,auth")
      .eq("organization_id", organizationId)
      .in("user_email", targetEmails);

    if (subscriptionsError) {
      return NextResponse.json(
        {
          ok: false,
          error: subscriptionsError.message,
          details: subscriptionsError,
          targetEmails,
        },
        { status: 500 },
      );
    }

    const rows = ((subscriptions || []) as PushSubscriptionRow[]).filter(
      (row) => row.endpoint && row.p256dh && row.auth,
    );

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        notified: 0,
        reason:
          "El contacto existe, pero no tiene suscripciones push activas o les faltan claves.",
        targetEmails,
        subscriptionsFound: 0,
      });
    }

    const pendingCountByEmail = new Map<string, number>();

    await Promise.allSettled(
      Array.from(new Set(rows.map((row) => normalizeEmail(row.user_email)))).map(
        async (targetEmail) => {
          if (!targetEmail) return;

          const commercialUnread = await getCommercialUnreadCountForEmail(
            supabaseAdmin,
            organizationId,
            targetEmail,
          );

          const finalCount =
            manualPendingCount !== null && !Number.isNaN(manualPendingCount)
              ? Math.max(0, manualPendingCount)
              : Math.max(0, commercialUnread);

          pendingCountByEmail.set(targetEmail, finalCount);
        },
      ),
    );

    const results = await Promise.allSettled(
      rows.map((row) => {
        const rowEmail = normalizeEmail(row.user_email);
        const pendingCount = pendingCountByEmail.get(rowEmail) ?? 0;

        const payload = JSON.stringify({
          title,
          body: message,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          url,
          pendingCount,
          badgeCount: pendingCount,
          count: pendingCount,
          data: {
            url,
            organizationId,
            localCode,
            localName,
            pendingCount,
          },
        });

        return webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh || "",
              auth: row.auth || "",
            },
          },
          payload,
        );
      }),
    );

    const successful = results.filter((item) => item.status === "fulfilled").length;
    const failed = results.length - successful;

    await Promise.allSettled(
      results.map(async (result, index) => {
        if (result.status !== "rejected") return;

        const reason = result.reason as { statusCode?: number };

        if (reason?.statusCode === 404 || reason?.statusCode === 410) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("id", rows[index].id);
        }
      }),
    );

    return NextResponse.json({
      ok: true,
      targetEmails,
      subscriptionsFound: rows.length,
      notified: successful,
      failed,
      pendingCounts: Object.fromEntries(pendingCountByEmail),
    });
  } catch (error) {
    console.error("Error notify-local-contact:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar notificación al contacto local.",
      },
      { status: 500 },
    );
  }
}
