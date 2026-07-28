"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import EnterpriseShell from "../../../src/components/enterprise/EnterpriseShell";
import { SectionCard, StatusPill } from "../../../src/components/enterprise/PortalUI";
import {
  loadEnterprisePortalData,
  type EnterprisePortalData,
} from "../../../src/core/portal/portalData";

export default function ProjectsPage() {
  const [data, setData] = useState<EnterprisePortalData | null>(null);

  useEffect(() => {
    void loadEnterprisePortalData().then(setData);
  }, []);

  return (
    <EnterpriseShell
      title="Proyectos"
      subtitle="Organiza módulos y datos por proyecto, sede, contrato o iniciativa."
    >
      <SectionCard
        title="Proyectos de la empresa"
        eyebrow="Organización opcional"
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-[#0B0C0E] px-4 py-2 text-sm font-black text-white">
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </button>
        }
      >
        {!data ? (
          <p>Cargando...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-[#DCE1E6] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9FFFB]">
                      <FolderKanban className="h-5 w-5 text-[#008F87]" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-[#008F87]">
                        {project.code}
                      </p>
                      <h3 className="mt-1 font-black">{project.name}</h3>
                    </div>
                  </div>
                  <StatusPill>{project.status}</StatusPill>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#69717D]">
                  {project.description || "Sin descripción"}
                </p>

                <div className="mt-5 flex gap-2 text-xs font-black">
                  <span className="rounded-full bg-[#F1F3F5] px-3 py-1">
                    Expense
                  </span>
                  <span className="rounded-full bg-[#F1F3F5] px-3 py-1">
                    Operations
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </EnterpriseShell>
  );
}
