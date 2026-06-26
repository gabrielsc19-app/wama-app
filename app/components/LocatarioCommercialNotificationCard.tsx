"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type UserProfile = {
  email: string;
  role: string;
  organization_id: number;
};

type Location = {
  id: number;
  name: string | null;
  local_code: string | null;
};

type RecipientRow = {
  id: number;
  publication_id: number | null;
  recipient_email: string | null;
  location_id: number | null;
  read_at: string | null;
};

function isLocalRole(role?: string | null) {
  const value = String(role || "").toLowerCase().trim();
  return value === "locatario" || value.startsWith("locatario_");
}

export default function LocatarioCommercialNotificationCard({
  userProfile,
  userLocation,
}: {
  userProfile: UserProfile;
  userLocation: Location | null;
}) {
  const router = useRouter();

  const [count, setCount] = useState(0);
  const [unreadPublicationIds, setUnreadPublicationIds] = useState<number[]>([]);
  const [unreadRecipientIds, setUnreadRecipientIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    loadCommercialUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.email, userLocation?.id]);

  async function loadCommercialUnreadCount() {
    setLoading(true);

    if (!userProfile || !isLocalRole(userProfile.role)) {
      setCount(0);
      setUnreadPublicationIds([]);
      setUnreadRecipientIds([]);
      setLoading(false);
      return;
    }

    const activeEmail = String(userProfile.email || "").toLowerCase().trim();
    const role = String(userProfile.role || "").toLowerCase().trim();

    const filters: string[] = [];

    if (userLocation?.id) {
      filters.push(`location_id.eq.${userLocation.id}`);
    }

    if (activeEmail) {
      filters.push(`recipient_email.eq.${activeEmail}`);
    }

    if (filters.length === 0) {
      setCount(0);
      setUnreadPublicationIds([]);
      setUnreadRecipientIds([]);
      setLoading(false);
      return;
    }

    const { data: recipients, error: recipientsError } = await supabase
      .from("commercial_publication_recipients")
      .select("id,publication_id,recipient_email,location_id,read_at")
      .eq("organization_id", userProfile.organization_id)
      .or(filters.join(","));

    if (recipientsError || !recipients || recipients.length === 0) {
      setCount(0);
      setUnreadPublicationIds([]);
      setUnreadRecipientIds([]);
      setLoading(false);
      return;
    }

    const recipientRows = recipients as RecipientRow[];

    const publicationIds = Array.from(
      new Set(
        recipientRows
          .map((item) => item.publication_id)
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    if (publicationIds.length === 0) {
      setCount(0);
      setUnreadPublicationIds([]);
      setUnreadRecipientIds([]);
      setLoading(false);
      return;
    }

    const { data: publications, error: publicationsError } = await supabase
      .from("commercial_publications")
      .select("id")
      .eq("organization_id", userProfile.organization_id)
      .eq("status", "sent")
      .eq("archived", false)
      .in("id", publicationIds);

    if (publicationsError || !publications || publications.length === 0) {
      setCount(0);
      setUnreadPublicationIds([]);
      setUnreadRecipientIds([]);
      setLoading(false);
      return;
    }

    const activePublicationIds = publications
      .map((publication: { id?: number | null }) => publication.id)
      .filter((id): id is number => typeof id === "number");

    if (activePublicationIds.length === 0) {
      setCount(0);
      setUnreadPublicationIds([]);
      setUnreadRecipientIds([]);
      setLoading(false);
      return;
    }

    const { data: reads, error: readsError } = await supabase
      .from("commercial_publication_reads")
      .select("publication_id")
      .in("publication_id", activePublicationIds)
      .eq("user_email", activeEmail);

    if (readsError) {
      console.error("Error loading commercial publication reads:", readsError);
    }

    const readPublicationIdsFromNewTable = new Set(
      (reads || [])
        .map((item: { publication_id?: number | null }) => item.publication_id)
        .filter((id): id is number => typeof id === "number"),
    );

    const readPublicationIdsFromRecipients = new Set(
      recipientRows
        .filter((item) => item.read_at)
        .map((item) => item.publication_id)
        .filter((id): id is number => typeof id === "number"),
    );

    const unreadIds = activePublicationIds.filter(
      (publicationId) =>
        !readPublicationIdsFromNewTable.has(publicationId) &&
        !readPublicationIdsFromRecipients.has(publicationId),
    );

    const recipientIdsToMark = recipientRows
      .filter(
        (item) =>
          typeof item.publication_id === "number" &&
          unreadIds.includes(item.publication_id) &&
          !item.read_at,
      )
      .map((item) => item.id);

    setCount(unreadIds.length);
    setUnreadPublicationIds(unreadIds);
    setUnreadRecipientIds(recipientIdsToMark);
    setLoading(false);
  }

  async function openCommunications() {
    if (opening) return;

    setOpening(true);

    const activeEmail = String(userProfile.email || "").toLowerCase().trim();
    const role = String(userProfile.role || "").toLowerCase().trim();
    const now = new Date().toISOString();

    if (unreadPublicationIds.length > 0) {
      await Promise.allSettled(
        unreadPublicationIds.map((publicationId) =>
          fetch("/api/comercial-publications/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              publicationId,
              userEmail: activeEmail,
              locationId: userLocation?.id || null,
              role,
            }),
          }),
        ),
      );
    }

    if (unreadRecipientIds.length > 0) {
      const { error } = await supabase
        .from("commercial_publication_recipients")
        .update({
          delivery_status: "read",
          read_at: now,
        })
        .eq("organization_id", userProfile.organization_id)
        .in("id", unreadRecipientIds);

      if (error) {
        console.error("No se pudieron marcar recipients como leídos:", error);
      }
    }

    setCount(0);
    setUnreadPublicationIds([]);
    setUnreadRecipientIds([]);

    router.push("/comercial");
  }

  const hasUnreadPublications = count > 0;

  return (
    <button
      type="button"
      onClick={openCommunications}
      disabled={opening}
      className={`h-full w-full rounded-3xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80 sm:px-6 ${
        hasUnreadPublications
          ? "border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex h-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`relative rounded-2xl p-3 ${
              hasUnreadPublications
                ? "bg-violet-700 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <Bell className="h-5 w-5" />

            {hasUnreadPublications && (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white shadow-sm">
                {count}
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-700">
              Comunicaciones
            </p>

            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Comunicaciones de Pumay
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Revisa avisos, campañas, instrucciones y documentos enviados a tu local.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              hasUnreadPublications
                ? "border border-violet-300 bg-white text-violet-800"
                : "border border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {loading
              ? "Revisando..."
              : hasUnreadPublications
                ? `${count} comunicación${count === 1 ? "" : "es"} sin leer`
                : "Sin comunicaciones pendientes"}
          </span>

          <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            {opening ? "Abriendo..." : "Ver comunicaciones"}
          </span>
        </div>
      </div>
    </button>
  );
}