"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "@/app/lib/supabase";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  Megaphone,
  RefreshCw,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  organization_id: number;
  location_id: number | null;
};

type Location = {
  id: number;
  name: string;
  floor: number | null;
  active: boolean;
  organization_id: number;
  local_code: string | null;
  brand_name: string | null;
  sector: string | null;
  category: string | null;
};

type Publication = {
  id: number;
  created_at: string;
  organization_id: number;
  title: string;
  message: string;
  publication_type: string;
  status: string;
  channel: string;
  send_to_all: boolean;
  target_summary: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  sent_at: string | null;
  archived: boolean;
};

type PublicationRecipient = {
  id: number;
  created_at: string;
  publication_id: number;
  organization_id: number;
  location_id: number | null;
  local_code: string | null;
  local_name: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  delivery_status: string;
  sent_at: string | null;
  read_at: string | null;
};

type PublicationFile = {
  id: number;
  created_at: string;
  publication_id: number;
  organization_id: number;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  storage_path: string | null;
  uploaded_by_email: string | null;
};

type PublicationWithDetails = Publication & {
  recipients?: PublicationRecipient[];
  files?: PublicationFile[];
};

const SESSION_KEY = "fixloop_pumay_session";
const STORAGE_BUCKET = "commercial-publications";

function normalizeRole(role?: string | null) {
  return String(role || "")
    .toLowerCase()
    .trim();
}

function isLocalRole(role?: string | null) {
  const value = normalizeRole(role);
  return value === "locatario" || value.startsWith("locatario_");
}

function canManageCommercial(role?: string | null) {
  return normalizeRole(role) === "comercial";
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getSavedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed?.email || !parsed?.organization_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cleanFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
}

function buildTargetSummary(
  targetLocations: Location[],
  sendToAll: boolean,
  notifyPumayTeam: boolean,
) {
  const parts: string[] = [];

  if (targetLocations.length > 0) {
    if (sendToAll) {
      parts.push(`Todos los locales activos (${targetLocations.length})`);
    } else {
      const names = targetLocations
        .map(
          (location) =>
            `${location.local_code ? `${location.local_code} · ` : ""}${location.name}`,
        )
        .slice(0, 8)
        .join(", ");

      const extra =
        targetLocations.length > 8 ? ` y ${targetLocations.length - 8} más` : "";
      parts.push(`${targetLocations.length} local(es): ${names}${extra}`);
    }
  }

  if (notifyPumayTeam) {
    parts.push("Equipo Pumay");
  }

  return parts.join(" · ") || "Sin destinatarios";
}

function getDisplayTargetSummary(publication: PublicationWithDetails) {
  if (publication.send_to_all) {
    const uniqueLocals = getRecipientLocalNames(publication.recipients);
    return uniqueLocals.length > 0
      ? `Todos los locales activos (${uniqueLocals.length})`
      : "Todos los locales activos";
  }

  return publication.target_summary || "No informado";
}


function isImagePublicationFile(file?: PublicationFile | null) {
  const fileType = String(file?.file_type || "").toLowerCase();
  const fileName = String(file?.file_name || "").toLowerCase();

  return (
    fileType.startsWith("image/") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".gif") ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  );
}

function splitPublicationFiles(files?: PublicationFile[]) {
  const imageFiles = (files || []).filter(isImagePublicationFile);
  const otherFiles = (files || []).filter((file) => !isImagePublicationFile(file));

  return { imageFiles, otherFiles, primaryImage: imageFiles[0] || null };
}

function isPumayTeamRecipient(recipient?: PublicationRecipient | null) {
  const localCode = String(recipient?.local_code || "")
    .toLowerCase()
    .trim();
  const localName = String(recipient?.local_name || "")
    .toLowerCase()
    .trim();

  return (
    !recipient?.location_id ||
    localCode === "pumay" ||
    localName === "equipo pumay" ||
    localName === "todos los usuarios pumay"
  );
}

function getRecipientLocalNames(recipients?: PublicationRecipient[]) {
  const names = Array.from(
    new Set(
      (recipients || [])
        .filter((recipient) => !isPumayTeamRecipient(recipient))
        .map(
          (recipient) =>
            `${recipient.local_code ? `${recipient.local_code} · ` : ""}${recipient.local_name || "Local sin nombre"}`,
        )
        .filter(Boolean),
    ),
  );

  return names;
}

function hasPumayTeamRecipients(recipients?: PublicationRecipient[]) {
  return (recipients || []).some(isPumayTeamRecipient);
}

function getPumayTeamRecipientCount(recipients?: PublicationRecipient[]) {
  return (recipients || []).filter(isPumayTeamRecipient).length;
}

export default function ComercialPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [publications, setPublications] = useState<PublicationWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [publicationType, setPublicationType] = useState("informativo");
  const [channel, setChannel] = useState("app");
  const [sendToAll, setSendToAll] = useState(true);
  const [notifyPumayTeam, setNotifyPumayTeam] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [locationSearch, setLocationSearch] = useState("");

  const role = normalizeRole(profile?.role);
  const isLocatario = isLocalRole(role);
  const canManage = canManageCommercial(role);

  const filteredLocations = useMemo(() => {
    const search = locationSearch.toLowerCase().trim();
    if (!search) return locations;

    return locations.filter((location) => {
      const text =
        `${location.name || ""} ${location.local_code || ""} ${location.brand_name || ""}`
          .toLowerCase()
          .trim();
      return text.includes(search);
    });
  }, [locations, locationSearch]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setErrorMessage("");

    const saved = getSavedProfile();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const activeEmail = String(session?.user?.email || saved?.email || "")
      .toLowerCase()
      .trim();

    if (!activeEmail) {
      setErrorMessage(
        "Debes iniciar sesión para ingresar al módulo comercial.",
      );
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("users_pumay")
      .select("*")
      .eq("email", activeEmail)
      .eq("active", true)
      .maybeSingle();

    if (profileError || !profileData) {
      setErrorMessage("No se encontró un perfil activo para este usuario.");
      setLoading(false);
      return;
    }

    const activeProfile = profileData as UserProfile;
    setProfile(activeProfile);

    if (canManageCommercial(activeProfile.role)) {
      await loadLocations(activeProfile.organization_id);
    }

    await loadPublications(activeProfile);
    setLoading(false);
  }

  async function loadLocations(organizationId: number) {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("local_code", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setErrorMessage("No se pudieron cargar los locales activos.");
      setLocations([]);
      return;
    }

    setLocations((data || []) as Location[]);
  }

  async function loadPublications(activeProfile = profile) {
    if (!activeProfile) return;

    const { data, error } = await supabase
      .from("commercial_publications")
      .select(
        "*, recipients:commercial_publication_recipients(*), files:commercial_publication_files(*)",
      )
      .eq("organization_id", activeProfile.organization_id)
      .eq("status", "sent")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando publicaciones comerciales:", error);
      setErrorMessage("No se pudieron cargar las publicaciones comerciales.");
      setPublications([]);
      return;
    }

    const loadedPublications = (data || []) as PublicationWithDetails[];
    setPublications(loadedPublications);

    const activeRole = normalizeRole(activeProfile.role);

    if (!canManageCommercial(activeRole)) {
      await markVisiblePublicationsAsRead(activeProfile, loadedPublications);
    }
  }

  async function markVisiblePublicationsAsRead(
    activeProfile: UserProfile,
    loadedPublications: PublicationWithDetails[],
  ) {
    const activeEmail = String(activeProfile.email || "").toLowerCase().trim();
    const activeRole = normalizeRole(activeProfile.role);
    const activeIsLocatario = isLocalRole(activeRole);

    if (!activeEmail || loadedPublications.length === 0) return;

    const visiblePublications = loadedPublications.filter((publication) => {
      return (publication.recipients || []).some((item) => {
        const recipientEmail = String(item.recipient_email || "")
          .toLowerCase()
          .trim();

        const sameEmail = Boolean(recipientEmail && recipientEmail === activeEmail);

        const sameLocation =
          activeIsLocatario &&
          item.location_id !== null &&
          item.location_id !== undefined &&
          activeProfile.location_id !== null &&
          activeProfile.location_id !== undefined &&
          Number(item.location_id) === Number(activeProfile.location_id);

        const samePumayTeamUser =
          !activeIsLocatario &&
          isPumayTeamRecipient(item) &&
          Boolean(recipientEmail && recipientEmail === activeEmail);

        const generalPumayTeam =
          !activeIsLocatario && isPumayTeamRecipient(item) && !recipientEmail;

        return sameEmail || sameLocation || samePumayTeamUser || generalPumayTeam;
      });
    });

    if (visiblePublications.length === 0) return;

    await Promise.allSettled(
      visiblePublications.map((publication) =>
        fetch("/api/comercial-publications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicationId: publication.id,
            userEmail: activeEmail,
            locationId: activeIsLocatario ? activeProfile.location_id : null,
            role: activeRole,
          }),
        }),
      ),
    );

    const recipientIdsToUpdate = visiblePublications.flatMap((publication) =>
      (publication.recipients || [])
        .filter((item) => {
          if (item.read_at) return false;

          const recipientEmail = String(item.recipient_email || "")
            .toLowerCase()
            .trim();

          const sameEmail = Boolean(recipientEmail && recipientEmail === activeEmail);

          const sameLocation =
            activeIsLocatario &&
            item.location_id !== null &&
            item.location_id !== undefined &&
            activeProfile.location_id !== null &&
            activeProfile.location_id !== undefined &&
            Number(item.location_id) === Number(activeProfile.location_id);

          const samePumayTeamUser =
            !activeIsLocatario &&
            isPumayTeamRecipient(item) &&
            Boolean(recipientEmail && recipientEmail === activeEmail);

          return sameEmail || sameLocation || samePumayTeamUser;
        })
        .map((item) => item.id),
    );

    if (recipientIdsToUpdate.length > 0) {
      const { error } = await supabase
        .from("commercial_publication_recipients")
        .update({
          delivery_status: "read",
          read_at: new Date().toISOString(),
        })
        .eq("organization_id", activeProfile.organization_id)
        .in("id", recipientIdsToUpdate);

      if (error) {
        console.error("No se pudieron actualizar recipients leídos:", error);
      }
    }
  }

  function toggleLocation(locationId: number) {
    setSelectedLocationIds((current) =>
      current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId],
    );
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files || []);
    if (incoming.length === 0) return;

    const accepted = incoming.filter((file) => file.size <= 15 * 1024 * 1024);
    const next = [...files, ...accepted].slice(0, 5);
    setFiles(next);
    event.target.value = "";
  }

  async function uploadFilesForPublication(publicationId: number) {
    if (!profile || files.length === 0) return [];

    const uploaded: PublicationFile[] = [];

    for (const file of files) {
      const path = `${profile.organization_id}/${publicationId}/${Date.now()}-${cleanFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(
          `No se pudo subir ${file.name}. Revisa que exista el bucket ${STORAGE_BUCKET}.`,
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

      const { data: insertedFile, error: fileError } = await supabase
        .from("commercial_publication_files")
        .insert({
          publication_id: publicationId,
          organization_id: profile.organization_id,
          file_url: publicUrlData.publicUrl,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          storage_path: path,
          uploaded_by_email: profile.email,
        })
        .select()
        .single();

      if (fileError) {
        throw new Error(
          `El archivo ${file.name} subió, pero no quedó registrado.`,
        );
      }

      uploaded.push(insertedFile as PublicationFile);
    }

    return uploaded;
  }

  async function createPublication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile || !canManage) {
      setErrorMessage(
        "No tienes permisos para crear publicaciones comerciales.",
      );
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Debes ingresar un título para la publicación.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Debes ingresar un mensaje para los locatarios.");
      return;
    }

    const targetLocations = sendToAll
      ? locations
      : locations.filter((location) =>
          selectedLocationIds.includes(location.id),
        );

    if (targetLocations.length === 0 && !notifyPumayTeam) {
      setErrorMessage(
        "Debes seleccionar al menos un local o marcar que también se notifique al equipo Pumay.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Se enviará esta publicación a ${targetLocations.length} local(es)${
        notifyPumayTeam ? " y al equipo Pumay" : ""
      }. ¿Confirmas el envío?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const targetSummary = buildTargetSummary(
        targetLocations,
        sendToAll,
        notifyPumayTeam,
      );

      const { data: publicationData, error: publicationError } = await supabase
        .from("commercial_publications")
        .insert({
          organization_id: profile.organization_id,
          title: title.trim(),
          message: message.trim(),
          publication_type: publicationType,
          status: "sent",
          channel,
          send_to_all: sendToAll,
          target_summary: targetSummary,
          created_by_name: profile.name,
          created_by_email: profile.email,
          sent_at: new Date().toISOString(),
          archived: false,
        })
        .select()
        .single();

      if (publicationError || !publicationData) {
        throw new Error("No se pudo crear la publicación comercial.");
      }

      const publication = publicationData as Publication;
      const targetLocationIds = targetLocations.map((location) => location.id);

      const { data: accessRows } = await supabase
        .from("local_user_access")
        .select(
          "location_id, local_code, local_name, user_email, user_role_in_local, receives_notifications, active",
        )
        .eq("organization_id", profile.organization_id)
        .eq("active", true)
        .in("location_id", targetLocationIds);

      const contactsByLocation = new Map<number, any[]>();

      (accessRows || []).forEach((access: any) => {
        const locationId = Number(access.location_id || 0);
        if (!locationId) return;

        const current = contactsByLocation.get(locationId) || [];
        current.push(access);
        contactsByLocation.set(locationId, current);
      });

      const localRecipientRows = targetLocations.flatMap((location) => {
        const contacts = contactsByLocation.get(location.id) || [];

        if (contacts.length === 0) {
          return [
            {
              publication_id: publication.id,
              organization_id: profile.organization_id,
              location_id: location.id,
              local_code: location.local_code,
              local_name: location.name,
              recipient_email: null,
              recipient_name: null,
              delivery_status: "sent",
              sent_at: new Date().toISOString(),
            },
          ];
        }

        return contacts.map((contact) => ({
          publication_id: publication.id,
          organization_id: profile.organization_id,
          location_id: location.id,
          local_code: contact.local_code || location.local_code,
          local_name: contact.local_name || location.name,
          recipient_email: contact.user_email || null,
          recipient_name: contact.user_role_in_local || null,
          delivery_status: "sent",
          sent_at: new Date().toISOString(),
        }));
      });

      let pumayRecipientRows: Array<{
        publication_id: number;
        organization_id: number;
        location_id: null;
        local_code: string;
        local_name: string;
        recipient_email: string | null;
        recipient_name: string | null;
        delivery_status: string;
        sent_at: string;
      }> = [];

      if (notifyPumayTeam) {
        const { data: pumayUsers, error: pumayUsersError } = await supabase
          .from("users_pumay")
          .select("name,email,role,active")
          .eq("organization_id", profile.organization_id)
          .eq("active", true);

        if (pumayUsersError) {
          throw new Error(
            "La publicación se creó, pero no se pudieron cargar los usuarios Pumay para notificar.",
          );
        }

        pumayRecipientRows = (pumayUsers || [])
          .filter((user: any) => {
            const userRole = normalizeRole(user.role);
            return !isLocalRole(userRole) && userRole !== "comercial";
          })
          .map((user: any) => ({
            publication_id: publication.id,
            organization_id: profile.organization_id,
            location_id: null,
            local_code: "PUMAY",
            local_name: "Equipo Pumay",
            recipient_email: user.email || null,
            recipient_name: user.name || user.role || null,
            delivery_status: "sent",
            sent_at: new Date().toISOString(),
          }));
      }

      const recipientRows = [...localRecipientRows, ...pumayRecipientRows];

      if (recipientRows.length === 0) {
        throw new Error("No se encontraron destinatarios para la publicación.");
      }

      const { error: recipientsError } = await supabase
        .from("commercial_publication_recipients")
        .insert(recipientRows);

      if (recipientsError) {
        throw new Error(
          "La publicación se creó, pero falló el registro de destinatarios.",
        );
      }

      await uploadFilesForPublication(publication.id);

      let emailResultText = "";

      if (channel === "email" || channel === "app_email") {
        try {
          const emailResponse = await fetch(
            "/api/comercial-publications/send-email",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                publicationId: publication.id,
                organizationId: profile.organization_id,
                requestedByEmail: profile.email,
              }),
            },
          );

          const emailResult = await emailResponse.json().catch(() => ({}));

          if (emailResponse.ok && emailResult.ok) {
            emailResultText = ` Correos enviados: ${emailResult.sent || 0}.`;
          } else {
            emailResultText =
              " La publicación quedó en la app, pero el envío por correo no se pudo completar.";
          }
        } catch {
          emailResultText =
            " La publicación quedó en la app, pero el envío por correo no se pudo completar.";
        }
      }

      setTitle("");
      setMessage("");
      setPublicationType("informativo");
      setChannel("app");
      setSendToAll(true);
      setNotifyPumayTeam(false);
      setSelectedLocationIds([]);
      setFiles([]);
      setLocationSearch("");

      setSuccessMessage(
        `Publicación enviada correctamente a ${targetLocations.length} local(es)${
          notifyPumayTeam
            ? ` y a ${pumayRecipientRows.length} usuario(s) Pumay`
            : ""
        }.${emailResultText}`,
      );

      await loadPublications(profile);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la publicación comercial.",
      );
    }

    setSaving(false);
  }

  async function archivePublication(publication: PublicationWithDetails) {
    if (!profile) return;

    const activeRole = normalizeRole(profile.role);

    if (!["owner", "comercial"].includes(activeRole)) {
      setErrorMessage(
        "Solo Comercial u Owner pueden eliminar publicaciones comerciales.",
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la publicación "${publication.title}"? Dejará de verse para locatarios y en el historial comercial.`,
    );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/comercial-publications/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicationId: publication.id,
          organizationId: profile.organization_id,
          requestedByEmail: profile.email,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : "No se pudo eliminar la publicación comercial.",
        );
      }

      setSuccessMessage("Publicación comercial eliminada correctamente.");
      await loadPublications(profile);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la publicación comercial.",
      );
    }

    setSaving(false);
  }

  async function markPublicationAsRead(publication: PublicationWithDetails) {
    if (!profile) return;

    const activeEmail = String(profile.email || "").toLowerCase().trim();
    const activeRole = normalizeRole(profile.role);

    const recipient = publication.recipients?.find((item) => {
      const recipientEmail = String(item.recipient_email || "")
        .toLowerCase()
        .trim();

      const sameEmail = Boolean(recipientEmail && recipientEmail === activeEmail);

      const sameLocation =
        isLocatario &&
        item.location_id !== null &&
        item.location_id !== undefined &&
        profile.location_id !== null &&
        profile.location_id !== undefined &&
        Number(item.location_id) === Number(profile.location_id);

      const samePumayTeamUser =
        !isLocatario &&
        isPumayTeamRecipient(item) &&
        Boolean(recipientEmail && recipientEmail === activeEmail);

      return sameEmail || sameLocation || samePumayTeamUser;
    });

    try {
      await fetch("/api/comercial-publications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicationId: publication.id,
          userEmail: activeEmail,
          locationId: isLocatario ? profile.location_id : null,
          role: activeRole,
        }),
      });
    } catch (error) {
      console.error("No se pudo registrar lectura comercial:", error);
    }

    if (!recipient || recipient.read_at) return;

    const { error } = await supabase
      .from("commercial_publication_recipients")
      .update({
        delivery_status: "read",
        read_at: new Date().toISOString(),
      })
      .eq("id", recipient.id)
      .eq("organization_id", profile.organization_id);

    if (error) {
      console.error("No se pudo actualizar recipient read_at:", error);
      return;
    }

    await loadPublications(profile);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef4fa] p-4 sm:p-6">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-sky-700" />
          <span className="font-semibold text-slate-700">
            Cargando módulo comercial...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef4fa] p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-fuchsia-900 via-slate-900 to-sky-900 px-5 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-100">
                    FixLoop | Pumay
                  </p>
                  <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                    Comunicaciones comerciales
                  </h1>
                  <p className="mt-1 text-sm text-slate-200">
                    {canManage
                      ? "Crear y enviar publicaciones a locatarios y equipo Pumay."
                      : isLocatario
                        ? "Revisa las comunicaciones enviadas por Pumay a tu local."
                        : "Revisa las comunicaciones internas enviadas al equipo Pumay."}
                  </p>
                </div>
              </div>

              <a
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 md:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al panel
              </a>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        {!profile ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
            No hay sesión activa. Vuelve al panel principal e inicia sesión.
          </div>
        ) : canManage ? (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <form
              onSubmit={createPublication}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-fuchsia-50 p-3 text-fuchsia-700">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Nueva publicación
                  </h2>
                  <p className="text-sm text-slate-500">
                    Se mostrará en la app de los destinatarios seleccionados.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <Field label="Título">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Campaña Día del Padre"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  />
                </Field>

                <Field label="Mensaje para locatarios">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe la información, instrucción o campaña que recibirá el local."
                    className="min-h-36 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Tipo">
                    <select
                      value={publicationType}
                      onChange={(e) => setPublicationType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="informativo">Informativo</option>
                      <option value="campana">Campaña</option>
                      <option value="requerimiento">Requerimiento</option>
                      <option value="recordatorio">Recordatorio</option>
                    </select>
                  </Field>

                  <Field label="Canal">
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="app">App</option>
                      <option value="email">Correo</option>
                      <option value="app_email">App + correo</option>
                    </select>
                  </Field>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={sendToAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSendToAll(checked);
                        if (checked) {
                          setSelectedLocationIds([]);
                          setLocationSearch("");
                        }
                      }}
                      className="mt-1"
                    />
                    Enviar a todos los locales activos
                  </label>

                  {sendToAll ? (
                    <div className="mt-3 rounded-2xl border border-sky-200 bg-white p-3 text-xs font-semibold text-sky-800">
                      Se enviará a todos los locales activos cargados en la
                      base. En el historial quedará registrado como “Todos los
                      locales activos”.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <input
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Buscar local por nombre o código..."
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      />

                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {filteredLocations.map((location) => (
                          <label
                            key={location.id}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLocationIds.includes(
                                location.id,
                              )}
                              onChange={() => toggleLocation(location.id)}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-bold text-slate-900">
                                {location.local_code
                                  ? `${location.local_code} · `
                                  : ""}
                                {location.name}
                              </span>
                              <span className="block text-xs text-slate-500">
                                Piso {location.floor || "N/I"}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                  <label className="flex items-start gap-3 text-sm font-semibold text-fuchsia-950">
                    <input
                      type="checkbox"
                      checked={notifyPumayTeam}
                      onChange={(e) => setNotifyPumayTeam(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-black">Notificar también a equipo Pumay</span>
                      <span className="mt-1 block text-xs font-semibold text-fuchsia-800">
                        Se enviará una copia interna a todos los usuarios Pumay activos.
                      </span>
                    </span>
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <FileText className="h-4 w-4 text-fuchsia-700" />
                    Adjuntos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Máximo 5 archivos. Peso máximo sugerido: 15 MB por archivo.
                  </p>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFiles(files.filter((_, i) => i !== index))
                            }
                            className="ml-3 text-slate-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {saving ? "Enviando..." : "Enviar publicación"}
                </button>
              </div>
            </form>

            <section className="space-y-4 xl:col-span-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Historial comercial
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Publicaciones enviadas a locatarios desde el área
                      comercial. Comercial y Owner pueden eliminar mensajes
                      enviados.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadPublications(profile)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                  </button>
                </div>
              </div>

              <PublicationList
                publications={publications}
                showRecipients
                canDelete={role === "owner" || role === "comercial"}
                onDelete={archivePublication}
              />
            </section>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Comunicaciones recibidas
                  </h2>
                  <p className="text-sm text-slate-500">
                    {isLocatario
                      ? "Mensajes comerciales enviados por Pumay a tu local."
                      : "Mensajes comerciales internos enviados al equipo Pumay."}
                  </p>
                </div>
              </div>
            </div>

            <PublicationList
              publications={publications}
              onOpen={markPublicationAsRead}
            />
          </section>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function PublicationList({
  publications,
  showRecipients = false,
  canDelete = false,
  onDelete,
  onOpen,
}: {
  publications: PublicationWithDetails[];
  showRecipients?: boolean;
  canDelete?: boolean;
  onDelete?: (publication: PublicationWithDetails) => void;
  onOpen?: (publication: PublicationWithDetails) => void;
}) {
  if (publications.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
        Todavía no hay publicaciones comerciales.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {publications.map((publication) => {
        const { imageFiles, otherFiles, primaryImage } = splitPublicationFiles(
          publication.files,
        );

        return (
          <article
            key={publication.id}
            onClick={() => onOpen?.(publication)}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-fuchsia-700">
                    {publication.publication_type}
                  </span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-700">
                    {publication.channel === "app_email"
                      ? "App + correo"
                      : publication.channel === "email"
                        ? "Correo"
                        : "App"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatDate(publication.sent_at || publication.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row md:flex-col md:items-end">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="mr-1 inline h-4 w-4" />
                  Enviada
                </div>

                {canDelete && onDelete && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(publication);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {primaryImage && (
              <a
                href={primaryImage.file_url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="mt-4 block overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:border-sky-300"
              >
                <img
                  src={primaryImage.file_url}
                  alt={primaryImage.file_name || publication.title}
                  className="max-h-[520px] w-full bg-white object-contain"
                />
              </a>
            )}

            {imageFiles.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {imageFiles.slice(1).map((file, index) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-sky-300"
                    title={file.file_name || `Imagen ${index + 2}`}
                  >
                    <img
                      src={file.file_url}
                      alt={file.file_name || `Imagen ${index + 2}`}
                      className="h-20 w-24 object-cover transition group-hover:scale-[1.02]"
                    />
                  </a>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-xl font-black text-slate-900">
                {publication.title}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {publication.message}
              </p>
            </div>

            {showRecipients && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <SmallStat
                  icon={<Users className="h-4 w-4" />}
                  label="Destinatarios"
                  value={String(publication.recipients?.length || 0)}
                />
                <SmallStat
                  icon={<Building2 className="h-4 w-4" />}
                  label="Alcance"
                  value={getDisplayTargetSummary(publication)}
                />
                <SmallStat
                  icon={<FileText className="h-4 w-4" />}
                  label="Adjuntos"
                  value={String(publication.files?.length || 0)}
                />
              </div>
            )}

            {showRecipients &&
              publication.recipients &&
              publication.recipients.length > 0 && (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <p className="mb-3 text-sm font-black text-sky-900">
                    {hasPumayTeamRecipients(publication.recipients)
                      ? "Destinatarios"
                      : publication.send_to_all
                        ? "Locales incluidos"
                        : "Locales destinatarios"}
                  </p>
                  {publication.send_to_all && (
                    <p className="mb-3 text-xs font-semibold text-sky-800">
                      Publicación enviada a todos los locales activos al momento
                      del envío.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {getRecipientLocalNames(publication.recipients).map(
                      (localName) => (
                        <span
                          key={localName}
                          className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-bold text-sky-800"
                        >
                          {localName}
                        </span>
                      ),
                    )}

                    {hasPumayTeamRecipients(publication.recipients) && (
                      <span className="rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-xs font-bold text-fuchsia-800">
                        Equipo Pumay · {getPumayTeamRecipientCount(publication.recipients)} usuario(s)
                      </span>
                    )}
                  </div>
                </div>
              )}

            {otherFiles.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-black text-slate-900">
                  Archivos adjuntos
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {otherFiles.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {file.file_name || "Archivo"}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function SmallStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
