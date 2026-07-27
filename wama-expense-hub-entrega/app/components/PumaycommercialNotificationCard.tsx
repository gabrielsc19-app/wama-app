"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

type UserProfile = {
  id?: number;
  name?: string | null;
  email: string;
  role: string;
  active?: boolean;
  organization_id: number;
  location_id?: number | null;
};

type PublicationRecipient = {
  id: number;
  publication_id: number;
  recipient_email: string | null;
  recipient_name: string | null;
  read_at: string | null;
  local_code: string | null;
  local_name: string | null;
  location_id: number | null;
};

type PublicationRead = {
  publication_id: number;
  user_email: string | null;
  role: string | null;
  read_at: string | null;
};

type Publication = {
  id: number;
  status: string;
  archived: boolean;
  recipients?: PublicationRecipient[];
};

function normalizeText(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeEmail(email?: string | null) {
  return normalizeText(email);
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

  return value;
}

function isPumayRecipientForUser(
  recipient: PublicationRecipient,
  userEmail: string,
  userRole: string,
) {
  const recipientEmail = normalizeEmail(recipient.recipient_email);

  if (recipientEmail && recipientEmail === userEmail) return true;

  const localCode = normalizeText(recipient.local_code);
  const localName = normalizeText(recipient.local_name);
  const recipientName = normalizeText(recipient.recipient_name);

  const isPumayScope =
    !recipient.location_id ||
    localCode === "pumay" ||
    localName.includes("equipo pumay") ||
    localName.includes("todos los usuarios pumay") ||
    localName.includes("grupo pumay");

  if (!isPumayScope) return false;

  if (
    localName.includes("equipo pumay") ||
    localName.includes("todos los usuarios pumay") ||
    recipientName.includes("equipo pumay") ||
    recipientName.includes("todos los usuarios pumay")
  ) {
    return true;
  }

  if (
    userRole === "owner" &&
    (recipientName.includes("owner") || localName.includes("owner"))
  ) {
    return true;
  }

  if (
    userRole === "super_admin" &&
    (recipientName.includes("super") || localName.includes("super"))
  ) {
    return true;
  }

  if (
    userRole === "mantencion" &&
    (recipientName.includes("mantencion") ||
      recipientName.includes("mantenimiento") ||
      localName.includes("mantencion") ||
      localName.includes("mantenimiento"))
  ) {
    return true;
  }

  if (
    userRole === "seguridad" &&
    (recipientName.includes("seguridad") || localName.includes("seguridad"))
  ) {
    return true;
  }

  if (
    userRole === "aseo" &&
    (recipientName.includes("aseo") || localName.includes("aseo"))
  ) {
    return true;
  }

  if (
    userRole === "operaciones" &&
    (recipientName.includes("operacion") || localName.includes("operacion"))
  ) {
    return true;
  }

  return false;
}

export default function PumayCommercialNotificationCard({
  userProfile,
}: {
  userProfile: UserProfile;
}) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [reads, setReads] = useState<PublicationRead[]>([]);
  const [loading, setLoading] = useState(true);

  const userEmail = normalizeEmail(userProfile.email);
  const userRole = normalizeRole(userProfile.role);

  useEffect(() => {
    let mounted = true;

    async function loadCommercialPublications() {
      if (!userProfile?.organization_id || !userEmail) {
        setPublications([]);
        setReads([]);
        setLoading(false);
        return;
      }

      if (userRole === "comercial") {
        setPublications([]);
        setReads([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("commercial_publications")
        .select("id,status,archived,recipients:commercial_publication_recipients(*)")
        .eq("organization_id", userProfile.organization_id)
        .eq("status", "sent")
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("No se pudieron cargar comunicaciones Pumay:", error);
        setPublications([]);
        setReads([]);
        setLoading(false);
        return;
      }

      const loadedPublications = (data || []) as Publication[];

      const assignedPublications = loadedPublications.filter((publication) =>
        (publication.recipients || []).some((recipient) =>
          isPumayRecipientForUser(recipient, userEmail, userRole),
        ),
      );

      const publicationIds = assignedPublications
        .map((publication) => publication.id)
        .filter((id) => typeof id === "number");

      let loadedReads: PublicationRead[] = [];

      if (publicationIds.length > 0) {
        const { data: readsData, error: readsError } = await supabase
          .from("commercial_publication_reads")
          .select("publication_id,user_email,role,read_at")
          .in("publication_id", publicationIds)
          .eq("user_email", userEmail);

        if (readsError) {
          console.error("No se pudieron cargar lecturas comerciales Pumay:", readsError);
        } else {
          loadedReads = (readsData || []) as PublicationRead[];
        }
      }

      if (!mounted) return;

      setPublications(loadedPublications);
      setReads(loadedReads);
      setLoading(false);
    }

    loadCommercialPublications();

    return () => {
      mounted = false;
    };
  }, [userProfile?.organization_id, userEmail, userRole]);

  const { total, unread } = useMemo(() => {
    const assigned = publications.filter((publication) =>
      (publication.recipients || []).some((recipient) =>
        isPumayRecipientForUser(recipient, userEmail, userRole),
      ),
    );

    const readPublicationIds = new Set(
      reads
        .filter((read) => normalizeEmail(read.user_email) === userEmail && read.read_at)
        .map((read) => read.publication_id),
    );

    const unreadCount = assigned.filter((publication) => {
      const readInNewTable = readPublicationIds.has(publication.id);

      const readInOldRecipients = (publication.recipients || []).some(
        (recipient) =>
          isPumayRecipientForUser(recipient, userEmail, userRole) &&
          normalizeEmail(recipient.recipient_email) === userEmail &&
          recipient.read_at,
      );

      return !readInNewTable && !readInOldRecipients;
    }).length;

    return { total: assigned.length, unread: unreadCount };
  }, [publications, reads, userEmail, userRole]);

  if (userRole === "comercial") {
    return null;
  }

  const hasUnread = unread > 0;

  return (
    <a
      href="/comercial"
      className={`block rounded-3xl border px-5 py-4 shadow-sm transition hover:-translate-y-0.5 sm:px-6 ${
        hasUnread
          ? "border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`relative rounded-2xl p-3 shadow-sm ${
              hasUnread ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            <Bell className="h-5 w-5" />

            {hasUnread && (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white shadow-sm">
                {unread}
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-700">
              Comunicaciones
            </p>

            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Comunicaciones comerciales
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Revisa avisos, campañas, instrucciones y documentos enviados al equipo Pumay.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              hasUnread
                ? "border border-violet-300 bg-white text-violet-800"
                : "border border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {loading
              ? "Cargando comunicaciones..."
              : hasUnread
                ? `${unread} comunicación${unread === 1 ? "" : "es"} sin leer`
                : total > 0
                  ? "Sin comunicaciones pendientes"
                  : "Sin publicaciones disponibles"}
          </span>

          <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            Ver comunicaciones
          </span>
        </div>
      </div>
    </a>
  );
}