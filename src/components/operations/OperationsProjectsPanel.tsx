"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  FolderKanban,
  Loader2,
  MapPin,
  Plus,
  Upload,
  Users,
} from "lucide-react";
import { supabase } from "../../../app/lib/supabase";

type ProjectMember = {
  profile_id: string;
  role: string;
  profile: { id: string; full_name: string; email: string } | null;
};

type Location = {
  id: string;
  code?: string | null;
  name: string;
  location_type: string;
};

type Plan = {
  id: string;
  sheet_code?: string | null;
  title: string;
  revision?: string | null;
  revision_date?: string | null;
  scale?: string | null;
  file_name: string;
  url?: string | null;
};

type Team = { id: string; name: string; color?: string | null };

type Project = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  members: ProjectMember[];
  locations: Location[];
  plans: Plan[];
  teams: Team[];
};

type Payload = {
  projects: Project[];
  canAdmin: boolean;
  currentProfileId: string;
};

async function api(url: string, init?: RequestInit) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("Sesión caducada. Vuelve a iniciar sesión.");
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...init?.headers,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "No fue posible completar la solicitud.");
  }
  return body;
}

const typeLabel: Record<string, string> = {
  commercial: "Local / módulo",
  common: "Área común",
  technical: "Área técnica",
  service: "Servicio",
  access: "Acceso / circulación",
  other: "Otra",
};

export default function OperationsProjectsPanel({
  selectedProjectId,
  selectProject,
}: {
  selectedProjectId: string;
  selectProject: (id: string) => void;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);

  const [projectForm, setProjectForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [locationForm, setLocationForm] = useState({
    code: "",
    name: "",
    locationType: "other",
    address: "",
  });

  const [planForm, setPlanForm] = useState({
    sheetCode: "",
    title: "Plano del proyecto",
    revision: "",
    revisionDate: "",
    scale: "",
    file: null as File | null,
  });

  async function load() {
    setError("");
    try {
      const payload = (await api("/api/operations/projects")) as Payload;
      setData(payload);

      if (!selectedProjectId && payload.projects.length === 1) {
        selectProject(payload.projects[0].id);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible cargar proyectos.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(
    () =>
      data?.projects.find((project) => project.id === selectedProjectId) ||
      data?.projects[0] ||
      null,
    [data, selectedProjectId],
  );

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setBusy("project");
    setError("");
    try {
      const result = await api("/api/operations/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_project",
          ...projectForm,
        }),
      });

      setProjectForm({ name: "", code: "", description: "" });
      setShowProjectForm(false);
      selectProject(result.project.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear.");
    } finally {
      setBusy("");
    }
  }

  async function createLocation(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;

    setBusy("location");
    setError("");
    try {
      await api("/api/operations/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_location",
          projectId: selected.id,
          ...locationForm,
        }),
      });

      setLocationForm({
        code: "",
        name: "",
        locationType: "other",
        address: "",
      });
      setShowLocationForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear locación.");
    } finally {
      setBusy("");
    }
  }

  async function uploadPlan(event: FormEvent) {
    event.preventDefault();
    if (!selected || !planForm.file) return;

    setBusy("plan");
    setError("");

    try {
      const form = new FormData();
      form.append("projectId", selected.id);
      form.append("sheetCode", planForm.sheetCode);
      form.append("title", planForm.title);
      form.append("revision", planForm.revision);
      form.append("revisionDate", planForm.revisionDate);
      form.append("scale", planForm.scale);
      form.append("file", planForm.file);

      await api("/api/operations/project-plan", {
        method: "POST",
        body: form,
      });

      setPlanForm({
        sheetCode: "",
        title: "Plano del proyecto",
        revision: "",
        revisionDate: "",
        scale: "",
        file: null,
      });
      setShowPlanForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el plano.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-5">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">
              Proyectos de Operations
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Obras, contratos e iniciativas
            </h2>
            <p className="mt-2 text-sm text-[#69717D]">
              Cada proyecto puede tener participantes, equipos, planos,
              locaciones y casos independientes.
            </p>
          </div>

          {data?.canAdmin && (
            <button
              onClick={() => setShowProjectForm((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00E5D6] px-5 py-3 text-sm font-black"
            >
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </button>
          )}
        </div>

        {showProjectForm && (
          <form
            onSubmit={createProject}
            className="mt-6 grid gap-3 rounded-2xl border border-[#BFE8E4] bg-[#F6FFFD] p-5"
          >
            <input
              required
              className="input"
              placeholder="Nombre · Ej. Piso -1"
              value={projectForm.name}
              onChange={(e) =>
                setProjectForm({ ...projectForm, name: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Código · Ej. PISO-M1"
              value={projectForm.code}
              onChange={(e) =>
                setProjectForm({ ...projectForm, code: e.target.value })
              }
            />
            <textarea
              className="input min-h-24"
              placeholder="Descripción del proyecto"
              value={projectForm.description}
              onChange={(e) =>
                setProjectForm({
                  ...projectForm,
                  description: e.target.value,
                })
              }
            />
            <button
              disabled={busy === "project"}
              className="rounded-full bg-[#0B0C0E] px-5 py-3 text-sm font-black text-white"
            >
              {busy === "project" ? "Creando…" : "Crear proyecto"}
            </button>
          </form>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.projects.map((project) => (
          <button
            key={project.id}
            onClick={() => selectProject(project.id)}
            className={`rounded-[1.5rem] border p-5 text-left transition ${
              selected?.id === project.id
                ? "border-[#00B8AE] bg-[#F1FFFD]"
                : "border-[#DCE1E6] bg-white"
            }`}
          >
            <FolderKanban className="h-6 w-6 text-[#008F87]" />
            <p className="mt-4 text-xs font-black uppercase tracking-[.14em] text-[#008F87]">
              {project.code}
            </p>
            <h3 className="mt-1 text-xl font-black">{project.name}</h3>
            <p className="mt-2 text-sm leading-6 text-[#69717D]">
              {project.description || "Sin descripción"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-[#59616B]">
              <span>{project.members.length} participantes</span>
              <span>{project.locations.length} locaciones</span>
              <span>{project.plans.length} planos</span>
            </div>
          </button>
        ))}
      </div>

      {!selected && (
        <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-10 text-center text-sm text-[#69717D]">
          Aún no hay proyectos de Operations.
        </section>
      )}

      {selected && (
        <>
          <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-[#008F87]">
                  Proyecto seleccionado
                </p>
                <h2 className="mt-2 text-3xl font-black">{selected.name}</h2>
                <p className="mt-2 text-sm text-[#69717D]">
                  {selected.description || "Sin descripción"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {data?.canAdmin && (
                  <>
                    <button
                      onClick={() =>
                        setShowLocationForm((value) => !value)
                      }
                      className="rounded-full border px-4 py-2 text-sm font-black"
                    >
                      + Locación
                    </button>
                    <button
                      onClick={() => setShowPlanForm((value) => !value)}
                      className="rounded-full border px-4 py-2 text-sm font-black"
                    >
                      + Plano
                    </button>
                  </>
                )}
              </div>
            </div>

            {showLocationForm && (
              <form
                onSubmit={createLocation}
                className="mt-6 grid gap-3 rounded-2xl bg-[#F4F7F8] p-5 md:grid-cols-2"
              >
                <input
                  className="input"
                  placeholder="Código opcional"
                  value={locationForm.code}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
                      code: e.target.value,
                    })
                  }
                />
                <select
                  className="input"
                  value={locationForm.locationType}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
                      locationType: e.target.value,
                    })
                  }
                >
                  <option value="commercial">Local / módulo</option>
                  <option value="common">Área común</option>
                  <option value="technical">Área técnica</option>
                  <option value="service">Servicio</option>
                  <option value="access">Acceso / circulación</option>
                  <option value="other">Otra</option>
                </select>
                <input
                  required
                  className="input md:col-span-2"
                  placeholder="Nombre de la locación"
                  value={locationForm.name}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
                      name: e.target.value,
                    })
                  }
                />
                <input
                  className="input md:col-span-2"
                  placeholder="Descripción o referencia opcional"
                  value={locationForm.address}
                  onChange={(e) =>
                    setLocationForm({
                      ...locationForm,
                      address: e.target.value,
                    })
                  }
                />
                <button
                  disabled={busy === "location"}
                  className="rounded-full bg-[#00E5D6] px-5 py-3 font-black md:col-span-2"
                >
                  {busy === "location" ? "Guardando…" : "Guardar locación"}
                </button>
              </form>
            )}

            {showPlanForm && (
              <form
                onSubmit={uploadPlan}
                className="mt-6 grid gap-3 rounded-2xl bg-[#F4F7F8] p-5 md:grid-cols-2"
              >
                <input
                  className="input"
                  placeholder="Código lámina · A-001"
                  value={planForm.sheetCode}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, sheetCode: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Título"
                  value={planForm.title}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, title: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Revisión · REV. 3"
                  value={planForm.revision}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, revision: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="input"
                  value={planForm.revisionDate}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      revisionDate: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Escala · 1:100"
                  value={planForm.scale}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, scale: e.target.value })
                  }
                />
                <input
                  required
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="input"
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                />
                <button
                  disabled={busy === "plan" || !planForm.file}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B0C0E] px-5 py-3 font-black text-white md:col-span-2"
                >
                  {busy === "plan" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Cargar plano
                </button>
              </form>
            )}
          </section>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6">
              <div className="flex items-center gap-3">
                <MapPin className="text-[#008F87]" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[.14em] text-[#008F87]">
                    Locaciones
                  </p>
                  <h3 className="text-xl font-black">
                    {selected.locations.length} ubicaciones del proyecto
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {selected.locations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-2xl bg-[#F4F7F8] p-4"
                  >
                    <p className="text-[11px] font-black uppercase tracking-[.12em] text-[#008F87]">
                      {typeLabel[location.location_type] || "Otra"}
                    </p>
                    <strong className="mt-1 block">{location.name}</strong>
                    {location.code && (
                      <span className="text-xs text-[#69717D]">
                        {location.code}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5">
              <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6">
                <div className="flex items-center gap-3">
                  <FileText className="text-[#008F87]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.14em] text-[#008F87]">
                      Planos
                    </p>
                    <h3 className="text-xl font-black">Documentación vigente</h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {selected.plans.map((plan) => (
                    <a
                      key={plan.id}
                      href={plan.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-[#DCE1E6] p-4 transition hover:border-[#00B8AE]"
                    >
                      <strong>
                        {plan.sheet_code ? `${plan.sheet_code} · ` : ""}
                        {plan.title}
                      </strong>
                      <p className="mt-1 text-xs text-[#69717D]">
                        {[plan.revision, plan.revision_date, plan.scale]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </a>
                  ))}

                  {!selected.plans.length && (
                    <p className="text-sm text-[#69717D]">
                      Aún no hay planos cargados.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-[#DCE1E6] bg-white p-6">
                <div className="flex items-center gap-3">
                  <Users className="text-[#008F87]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.14em] text-[#008F87]">
                      Participantes y equipos
                    </p>
                    <h3 className="text-xl font-black">
                      Acceso al proyecto
                    </h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  {selected.members.map((member) => (
                    <div
                      key={member.profile_id}
                      className="rounded-2xl bg-[#F4F7F8] p-4"
                    >
                      <strong>
                        {member.profile?.full_name || "Usuario"}
                      </strong>
                      <p className="text-xs text-[#69717D]">
                        {member.profile?.email}
                      </p>
                      <p className="mt-1 text-xs font-black text-[#008F87]">
                        {member.role === "admin"
                          ? "Administrador del proyecto"
                          : "Participante"}
                      </p>
                    </div>
                  ))}

                  {selected.teams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-[#DCE1E6] p-4"
                    >
                      <strong>Equipo {team.name}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
