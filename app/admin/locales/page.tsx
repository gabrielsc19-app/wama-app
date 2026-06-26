"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  TriangleAlert,
  UserPlus,
  X,
} from "lucide-react";

type LocalContact = {
  id: number;
  organization_id: number;
  location_id: number;
  local_code: string;
  local_name: string;
  user_email: string;
  contact_name: string | null;
  contact_phone: string | null;
  user_role_in_local: string | null;
  can_report: boolean;
  receives_notifications: boolean;
  can_respond_pumay: boolean;
  is_primary_contact: boolean;
  active: boolean;
  data_status: string | null;
  notes: string | null;
};

type LocalRow = {
  id: number;
  organization_id: number;
  local_code: string;
  name: string;
  local_name: string;
  floor: string | null;
  sector: string | null;
  location_type: string | null;
  active: boolean;
  notes: string | null;
  contacts: LocalContact[];
  contacts_count: number;
  incomplete_contacts: number;
  primary_contact: LocalContact | null;
  data_status: string;
};

type Summary = {
  totalLocations: number;
  activeLocations: number;
  inactiveLocations: number;
  incompleteLocations: number;
  totalContacts: number;
  incompleteContacts: number;
};


type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  organization_id: number;
};

type FormState = {
  id?: number | null;
  contactId?: number | null;
  localCode: string;
  localName: string;
  floor: string;
  sector: string;
  locationType: string;
  active: boolean;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  userRoleInLocal: string;
  canReport: boolean;
  receivesNotifications: boolean;
  canRespondPumay: boolean;
  isPrimaryContact: boolean;
};

const emptyForm: FormState = {
  id: null,
  contactId: null,
  localCode: "",
  localName: "",
  floor: "",
  sector: "",
  locationType: "Local",
  active: true,
  notes: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  userRoleInLocal: "Contacto local",
  canReport: true,
  receivesNotifications: true,
  canRespondPumay: true,
  isPrimaryContact: true,
};

const DEFAULT_LOCATARIO_PASSWORD = "Pumay2026!";
const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeRoleValue(value: unknown) {
  return cleanText(value).toLowerCase();
}

function getSavedProfileSession(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(FIXLOOP_SESSION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as UserProfile;
    if (!parsed?.email || !parsed?.organization_id) return null;

    return parsed;
  } catch (error) {
    console.error("No se pudo leer la sesión local:", error);
    return null;
  }
}

function statusBadgeClass(status: string) {
  return status === "Completo"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "Desactivado"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function contactDisplayName(contact: LocalContact) {
  return (
    cleanText(contact.contact_name) ||
    cleanText(contact.user_email) ||
    "Contacto sin nombre"
  );
}

function contactRolePriority(contact: LocalContact) {
  const role = cleanText(contact.user_role_in_local).toLowerCase();

  if (contact.is_primary_contact) return 0;
  if (role.includes("encarg")) return 1;
  if (role.includes("dueñ") || role.includes("duen")) return 2;
  if (role.includes("admin")) return 3;

  return 4;
}

function orderedContacts(contacts: LocalContact[]) {
  return [...contacts].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;

    const priorityA = contactRolePriority(a);
    const priorityB = contactRolePriority(b);

    if (priorityA !== priorityB) return priorityA - priorityB;

    return contactDisplayName(a).localeCompare(contactDisplayName(b), "es");
  });
}

export default function AdminLocalesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [locations, setLocations] = useState<LocalRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalLocations: 0,
    activeLocations: 0,
    inactiveLocations: 0,
    incompleteLocations: 0,
    totalContacts: 0,
    incompleteContacts: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "incomplete"
  >("all");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "contact">(
    "create"
  );
  const [form, setForm] = useState<FormState>(emptyForm);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sendingContactId, setSendingContactId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const isOwner = normalizeRoleValue(currentUser?.role) === "owner";

  useEffect(() => {
    setCurrentUser(getSavedProfileSession());
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeFilter]);

  const filteredLocations = useMemo(() => locations, [locations]);

  async function loadLocations() {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams({
        organizationId: "1",
        status: statusFilter,
        active: activeFilter,
      });

      if (cleanText(search)) params.set("search", cleanText(search));

      const response = await fetch(`/api/admin/locales?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || "No se pudieron cargar los locales.");
        return;
      }

      setLocations(result.locations || []);
      setSummary(
        result.summary || {
          totalLocations: 0,
          activeLocations: 0,
          inactiveLocations: 0,
          incompleteLocations: 0,
          totalContacts: 0,
          incompleteContacts: 0,
        }
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudieron cargar los locales.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormMode("create");
    setForm(emptyForm);
    setFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openEditForm(location: LocalRow, contact?: LocalContact | null) {
    const selectedContact = contact || location.primary_contact;

    setFormMode("edit");
    setForm({
      id: location.id,
      contactId: selectedContact?.id || null,
      localCode: location.local_code || "",
      localName: location.local_name || location.name || "",
      floor: location.floor || "",
      sector: location.sector || "",
      locationType: location.location_type || "Local",
      active: location.active,
      notes: location.notes || selectedContact?.notes || "",
      contactName: selectedContact?.contact_name || "",
      contactEmail: selectedContact?.user_email || "",
      contactPhone: selectedContact?.contact_phone || "",
      userRoleInLocal: selectedContact?.user_role_in_local || "Contacto local",
      canReport: selectedContact?.can_report ?? true,
      receivesNotifications: selectedContact?.receives_notifications ?? true,
      canRespondPumay: selectedContact?.can_respond_pumay ?? true,
      isPrimaryContact: selectedContact?.is_primary_contact ?? true,
    });
    setFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openAddContactForm(location: LocalRow) {
    setFormMode("contact");
    setForm({
      ...emptyForm,
      id: location.id,
      localCode: location.local_code || "",
      localName: location.local_name || location.name || "",
      floor: location.floor || "",
      sector: location.sector || "",
      locationType: location.location_type || "Local",
      active: location.active,
      notes: location.notes || "",
      isPrimaryContact: location.contacts_count === 0,
    });
    setFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        organizationId: 1,
        locationId: form.id,
        localCode: form.localCode,
        localName: form.localName,
        floor: form.floor,
        sector: form.sector,
        locationType: form.locationType,
        active: form.active,
        notes: form.notes,
        contactId: form.contactId,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        userRoleInLocal: form.userRoleInLocal,
        canReport: form.canReport,
        receivesNotifications: form.receivesNotifications,
        canRespondPumay: form.canRespondPumay,
        isPrimaryContact: form.isPrimaryContact,
      };

      const isCreate = formMode === "create";
      const url = isCreate
        ? "/api/admin/locales"
        : `/api/admin/locales/${form.id}`;
      const method = isCreate ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || "No se pudo guardar.");
        return;
      }

      setSuccessMessage(
        isCreate
          ? "Local creado correctamente."
          : "Local actualizado correctamente."
      );
      setFormOpen(false);
      await loadLocations();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo guardar el local.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateLocation(location: LocalRow) {
    const confirmed = window.confirm(
      `¿Desactivar el local ${location.local_name || location.name}?`
    );

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/locales/${location.id}?organizationId=1`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || "No se pudo desactivar el local.");
        return;
      }

      setSuccessMessage("Local desactivado correctamente.");
      await loadLocations();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo desactivar el local.");
    } finally {
      setSaving(false);
    }
  }

  async function permanentlyDeleteLocation(location: LocalRow) {
    if (!isOwner || !currentUser) {
      setErrorMessage("Solo usuarios owner pueden eliminar locales definitivamente.");
      return;
    }

    if (location.active) {
      setErrorMessage("Primero debes desactivar el local antes de eliminarlo definitivamente.");
      return;
    }

    const localLabel = location.local_name || location.name || location.local_code || "local";

    const confirmed = window.confirm(
      `¿Eliminar definitivamente el local ${localLabel}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      "Confirmación final: se eliminará el local de la base y también sus contactos asociados. Usa esta opción solo para locales cargados por error."
    );

    if (!secondConfirmation) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const params = new URLSearchParams({
        organizationId: String(currentUser.organization_id || 1),
        permanent: "true",
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });

      const response = await fetch(
        `/api/admin/locales/${location.id}?${params.toString()}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || "No se pudo eliminar definitivamente el local.");
        return;
      }

      setSuccessMessage("Local eliminado definitivamente.");
      setLocations((current) => current.filter((item) => item.id !== location.id));
      await loadLocations();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo eliminar definitivamente el local.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateContact(contact: LocalContact) {
    const label = contactDisplayName(contact);
    const confirmed = window.confirm(`¿Desactivar el contacto ${label}?`);

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/locales/contacts/${contact.id}?organizationId=1`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || "No se pudo desactivar el contacto.");
        return;
      }

      setSuccessMessage("Contacto desactivado correctamente.");
      await loadLocations();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo desactivar el contacto.");
    } finally {
      setSaving(false);
    }
  }

  async function reactivateContact(contact: LocalContact) {
    const label = contactDisplayName(contact);
    const confirmed = window.confirm(`¿Reactivar el contacto ${label}?`);

    if (!confirmed) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/locales/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: 1,
          active: true,
          receivesNotifications: true,
          canRespondPumay: true,
          canReport: true,
          isPrimaryContact: false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || "No se pudo reactivar el contacto.");
        return;
      }

      setSuccessMessage("Contacto reactivado correctamente.");
      await loadLocations();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo reactivar el contacto.");
    } finally {
      setSaving(false);
    }
  }

  async function permanentlyDeleteContact(contact: LocalContact) {
    const label = contactDisplayName(contact);

    const confirmed = window.confirm(
      `¿Eliminar definitivamente el contacto ${label}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      "Confirmación final: esto eliminará el contacto de la base. Usa esta opción solo si fue cargado por error o está duplicado."
    );

    if (!secondConfirmation) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/locales/contacts/${contact.id}?organizationId=1&permanent=true`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(
          result.error || "No se pudo eliminar definitivamente el contacto."
        );
        return;
      }

      setSuccessMessage("Contacto eliminado definitivamente.");
      await loadLocations();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo eliminar definitivamente el contacto.");
    } finally {
      setSaving(false);
    }
  }

  async function sendContactAccess(location: LocalRow, contact: LocalContact) {
    const email = cleanText(contact.user_email).toLowerCase();
    const contactName = contactDisplayName(contact);
    const localName =
      location.local_name ||
      location.name ||
      contact.local_name ||
      "Local Pumay";

    if (!email) {
      setErrorMessage("El contacto no tiene correo registrado.");
      return;
    }

    const confirmed = window.confirm(
      `¿Enviar acceso a ${contactName} (${email}) para el local ${localName}?`
    );

    if (!confirmed) return;

    setSendingContactId(contact.id);
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/send-locatario-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: 1,
          contactId: contact.id,
          locationId: location.id,
          localName,
          recipientName: contactName,
          recipientEmail: email,
          password: DEFAULT_LOCATARIO_PASSWORD,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(
          typeof result?.error === "string"
            ? result.error
            : "No se pudo enviar el acceso al locatario."
        );
        return;
      }

      setSuccessMessage(
        `Acceso enviado correctamente a ${email}. Clave provisoria: ${DEFAULT_LOCATARIO_PASSWORD}`
      );

      await loadLocations();
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo enviar el acceso al locatario.");
    } finally {
      setSaving(false);
      setSendingContactId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-sm md:p-8">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="mb-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </button>

          <p className="text-sm text-white/80">FixLoop | Pumay</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Administración de locales
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-white md:text-base">
            Crea, edita y mantiene locales, contactos, permisos y datos
            pendientes sin depender de Supabase.
          </p>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {successMessage}
          </div>
        )}

        {saving && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-700">
            Procesando cambio...
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-6">
          <MetricCard label="Locales" value={summary.totalLocations} />
          <MetricCard label="Activos" value={summary.activeLocations} />
          <MetricCard label="Inactivos" value={summary.inactiveLocations} />
          <MetricCard
            label="Locales incompletos"
            value={summary.incompleteLocations}
            alert
          />
          <MetricCard label="Contactos" value={summary.totalContacts} />
          <MetricCard
            label="Contactos incompletos"
            value={summary.incompleteContacts}
            alert
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_auto_auto] lg:items-end">
            <div>
              <label className="text-sm font-bold text-slate-700">Buscar</label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadLocations();
                  }}
                  className="w-full outline-none"
                  placeholder="Local, código, correo, contacto..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Estado datos
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="all">Todos</option>
                <option value="incomplete">Incompletos</option>
                <option value="complete">Completos</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Activo</label>
              <select
                value={activeFilter}
                onChange={(event) =>
                  setActiveFilter(event.target.value as typeof activeFilter)
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadLocations}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              Crear local
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-emerald-700" />
              <div>
                <h2 className="text-2xl font-black">Locales cargados</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Base actual de locales y contactos asociados.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
              Vista operacional por local
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              <p className="mt-2 text-sm text-slate-600">Cargando locales...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay locales para mostrar.
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {filteredLocations.map((location) => {
                const contacts = orderedContacts(location.contacts);
                const primaryContact = location.primary_contact;

                return (
                  <article
                    key={location.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="grid gap-4 xl:grid-cols-[1.15fr_1.85fr]">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between xl:flex-col xl:justify-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-2xl bg-slate-950 px-3 py-1 text-sm font-black text-white">
                                {location.local_code}
                              </span>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass(
                                  location.data_status
                                )}`}
                              >
                                {location.data_status}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  location.active
                                    ? "bg-sky-50 text-sky-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {location.active ? "Activo" : "Inactivo"}
                              </span>
                            </div>

                            <h3 className="mt-3 text-2xl font-black text-slate-950">
                              {location.local_name || location.name}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                              <span className="rounded-full bg-slate-100 px-3 py-1">
                                {location.location_type || "Local"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">
                                {location.floor || "Sin piso"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">
                                {location.sector || "Sin sector"}
                              </span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 md:min-w-[240px] xl:min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              Resumen
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                              <div className="rounded-xl bg-white p-2">
                                <p className="text-slate-500">Contactos</p>
                                <p className="mt-1 text-lg font-black text-slate-950">
                                  {location.contacts_count}
                                </p>
                              </div>
                              <div className="rounded-xl bg-white p-2">
                                <p className="text-slate-500">Pendientes</p>
                                <p
                                  className={`mt-1 text-lg font-black ${
                                    location.incomplete_contacts > 0
                                      ? "text-amber-700"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {location.incomplete_contacts}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-1">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              Contacto principal
                            </p>
                            {primaryContact ? (
                              <div className="mt-2">
                                <p className="font-black text-slate-950">
                                  {primaryContact.contact_name || "Sin nombre"}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {primaryContact.user_email}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {primaryContact.contact_phone || "Sin teléfono"}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-400">
                                Sin contacto principal.
                              </p>
                            )}
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              Permisos principales
                            </p>
                            {primaryContact ? (
                              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                                <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                  Notifica: {primaryContact.receives_notifications ? "Sí" : "No"}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                  Responde: {primaryContact.can_respond_pumay ? "Sí" : "No"}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-slate-700">
                                  Reporta: {primaryContact.can_report ? "Sí" : "No"}
                                </span>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-400">Sin permisos configurados.</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Acciones del local
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(location)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
                            >
                              <Edit3 className="h-4 w-4" />
                              Editar local
                            </button>

                            {location.active && (
                              <button
                                type="button"
                                onClick={() => openAddContactForm(location)}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                              >
                                <UserPlus className="h-4 w-4" />
                                Agregar contacto
                              </button>
                            )}

                            {location.active && (
                              <button
                                type="button"
                                onClick={() => deactivateLocation(location)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                              >
                                <X className="h-4 w-4" />
                                Desactivar local
                              </button>
                            )}

                            {!location.active && isOwner && (
                              <button
                                type="button"
                                onClick={() => permanentlyDeleteLocation(location)}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar local
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              Contactos del local
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Principal y encargados aparecen primero. Inactivos quedan al final.
                            </p>
                          </div>

                          <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700">
                            {contacts.length} contacto(s)
                          </span>
                        </div>

                        {contacts.length > 0 ? (
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            {contacts.map((contact) => (
                              <div
                                key={contact.id}
                                className={`rounded-2xl border p-3 ${
                                  contact.active
                                    ? "border-slate-200 bg-white"
                                    : "border-rose-200 bg-rose-50"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900">
                                    {contactDisplayName(contact)}
                                  </p>

                                  <p className="truncate text-xs text-slate-600">
                                    {contact.user_email}
                                  </p>

                                  {contact.contact_phone && (
                                    <p className="truncate text-xs text-slate-500">
                                      {contact.contact_phone}
                                    </p>
                                  )}

                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                                      {contact.user_role_in_local || "Contacto local"}
                                    </span>

                                    {contact.is_primary_contact && (
                                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                        Principal
                                      </span>
                                    )}

                                    <span
                                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                                        contact.active
                                          ? "bg-sky-50 text-sky-700"
                                          : "bg-rose-100 text-rose-700"
                                      }`}
                                    >
                                      {contact.active ? "Activo" : "Inactivo"}
                                    </span>

                                    {contact.data_status && (
                                      <span
                                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                                          contact.data_status === "Completo"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : contact.data_status === "Desactivado"
                                            ? "bg-rose-100 text-rose-700"
                                            : "bg-amber-50 text-amber-700"
                                        }`}
                                      >
                                        {contact.data_status}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {contact.active && (
                                    <button
                                      type="button"
                                      onClick={() => sendContactAccess(location, contact)}
                                      disabled={saving || sendingContactId === contact.id}
                                      className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                                    >
                                      {sendingContactId === contact.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Send className="h-3.5 w-3.5" />
                                      )}
                                      {sendingContactId === contact.id
                                        ? "Enviando..."
                                        : "Enviar acceso"}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => openEditForm(location, contact)}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Editar
                                  </button>

                                  {contact.active ? (
                                    <button
                                      type="button"
                                      onClick={() => deactivateContact(contact)}
                                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Desactivar
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => reactivateContact(contact)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Reactivar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => permanentlyDeleteContact(contact)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Eliminar definitivo
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                            Sin contactos asociados.
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {formOpen && (
          <section className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
            <div className="mx-auto my-8 max-w-4xl rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">
                    {formMode === "create"
                      ? "Crear nuevo local"
                      : formMode === "contact"
                      ? "Agregar contacto"
                      : "Editar local / contacto"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Completa la información operativa para que el local funcione
                    correctamente en FixLoop.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-2xl border border-slate-300 p-3"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submitForm} className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <TextField
                    label="Código local"
                    value={form.localCode}
                    onChange={(value) => updateForm({ localCode: value })}
                    placeholder="Automático o L074"
                    disabled={formMode !== "create"}
                  />
                  <TextField
                    label="Nombre local"
                    value={form.localName}
                    onChange={(value) => updateForm({ localName: value })}
                    placeholder="Nombre del local"
                  />
                  <TextField
                    label="Piso"
                    value={form.floor}
                    onChange={(value) => updateForm({ floor: value })}
                    placeholder="Piso 1"
                  />
                  <TextField
                    label="Sector"
                    value={form.sector}
                    onChange={(value) => updateForm({ sector: value })}
                    placeholder="Pajaritos / 5 Abril"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <TextField
                    label="Tipo ubicación"
                    value={form.locationType}
                    onChange={(value) => updateForm({ locationType: value })}
                    placeholder="Local / Módulo / Isla"
                  />
                  <TextField
                    label="Contacto"
                    value={form.contactName}
                    onChange={(value) => updateForm({ contactName: value })}
                    placeholder="Nombre contacto"
                  />
                  <TextField
                    label="Correo contacto"
                    value={form.contactEmail}
                    onChange={(value) => updateForm({ contactEmail: value })}
                    placeholder="correo@ejemplo.cl"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <TextField
                    label="Teléfono"
                    value={form.contactPhone}
                    onChange={(value) => updateForm({ contactPhone: value })}
                    placeholder="+569..."
                  />
                  <TextField
                    label="Rol contacto"
                    value={form.userRoleInLocal}
                    onChange={(value) => updateForm({ userRoleInLocal: value })}
                    placeholder="Contacto local"
                  />
                  <TextField
                    label="Notas"
                    value={form.notes}
                    onChange={(value) => updateForm({ notes: value })}
                    placeholder="Observaciones internas"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <Toggle
                    label="Activo"
                    checked={form.active}
                    onChange={(checked) => updateForm({ active: checked })}
                  />
                  <Toggle
                    label="Recibe notificaciones"
                    checked={form.receivesNotifications}
                    onChange={(checked) =>
                      updateForm({ receivesNotifications: checked })
                    }
                  />
                  <Toggle
                    label="Puede responder"
                    checked={form.canRespondPumay}
                    onChange={(checked) =>
                      updateForm({ canRespondPumay: checked })
                    }
                  />
                  <Toggle
                    label="Puede reportar"
                    checked={form.canReport}
                    onChange={(checked) => updateForm({ canReport: checked })}
                  />
                  <Toggle
                    label="Contacto principal"
                    checked={form.isPrimaryContact}
                    onChange={(checked) =>
                      updateForm({ isPrimaryContact: checked })
                    }
                  />
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        alert && value > 0
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {alert && value > 0 ? (
          <TriangleAlert className="h-5 w-5 text-amber-600" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        )}
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
        placeholder={placeholder}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}
