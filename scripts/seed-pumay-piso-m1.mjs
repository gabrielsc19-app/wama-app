/* eslint-disable no-console */
/**
 * Seed piloto Pumay / Piso -1.
 * Ejecutar desde la raíz del proyecto:
 * node scripts/seed-pumay-piso-m1.mjs
 *
 * Lee .env.local y utiliza NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Sube el plano A-001 incluido en seed-assets/ al bucket operations-plans.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [key, value];
      }),
  );
}

const localEnv = loadEnv(path.resolve(".env.local"));
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.",
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const locations = [
  ...Array.from({ length: 14 }, (_, i) => ({
    code: `LOCAL-${String(i + 1).padStart(2, "0")}`,
    name: `Local ${String(i + 1).padStart(2, "0")}`,
    type: "commercial",
  })),
  ...Array.from({ length: 11 }, (_, i) => ({
    code: `MOD-${String(i + 1).padStart(2, "0")}`,
    name: `Módulo ${String(i + 1).padStart(2, "0")}`,
    type: "commercial",
  })),
  { code: "COM-01", name: "Área común Mall", type: "common" },
  { code: "COM-02", name: "Superficie común", type: "common" },
  { code: "ACC-01", name: "Pasillo Nivel 1", type: "access" },
  { code: "ACC-02", name: "Ascensor", type: "access" },
  { code: "ACC-03", name: "Plataforma elevadora", type: "access" },
  { code: "TEC-01", name: "Sala Bombas", type: "technical" },
  { code: "TEC-02", name: "Sala Aseo", type: "service" },
  { code: "TEC-03", name: "Servidores", type: "technical" },
  { code: "TEC-04", name: "Vigilancia", type: "technical" },
  { code: "SER-01", name: "Tesorería", type: "service" },
  { code: "SER-02", name: "Sala de descanso", type: "service" },
  { code: "TEC-05", name: "Tableros generales", type: "technical" },
  { code: "TEC-06", name: "Bomba alcantarillado", type: "technical" },
  { code: "TEC-07", name: "Trafo seco", type: "technical" },
  { code: "SER-03", name: "Lockers", type: "service" },
  { code: "TEC-08", name: "Celda MT", type: "technical" },
  { code: "TEC-09", name: "Sala Subestación", type: "technical" },
  { code: "SER-04", name: "Bodega insumos", type: "service" },
  { code: "SER-05", name: "Bodega materiales", type: "service" },
  { code: "SER-06", name: "Bodega Mall existente", type: "service" },
  { code: "SER-07", name: "Custodia", type: "service" },
  { code: "SER-08", name: "Recepción", type: "service" },
  { code: "TEC-10", name: "UPS 1", type: "technical" },
  { code: "TEC-11", name: "Equipos visual / operaciones", type: "technical" },
  { code: "SER-09", name: "Baños mujeres", type: "service" },
  { code: "SER-10", name: "Baños hombres", type: "service" },
  { code: "SER-11", name: "Baño M / Disc.", type: "service" },
  { code: "SER-12", name: "Gte Tienda", type: "service" },
  { code: "SER-13", name: "Cont. Interno", type: "service" },
  { code: "SER-14", name: "Bodega esclusa", type: "service" },
  { code: "EXT-01", name: "Área existente Mall", type: "other" },
  { code: "EXT-02", name: "Área existente otros operadores", type: "other" },
  { code: "TEC-12", name: "Shaft 80/25", type: "technical" },
];

const { data: tenant, error: tenantError } = await supabase
  .from("wama_tenants")
  .select("id,name")
  .eq("name", "Pumay")
  .maybeSingle();

if (tenantError) throw tenantError;
if (!tenant) throw new Error("No encontré el tenant Pumay.");

const { data: moduleRow, error: moduleError } = await supabase
  .from("wama_module_catalog")
  .select("id,module_key")
  .eq("module_key", "operations")
  .maybeSingle();

if (moduleError) throw moduleError;
if (!moduleRow) throw new Error("No existe Operations Hub en el catálogo.");

const { data: license, error: licenseError } = await supabase
  .from("wama_tenant_module_licenses")
  .select("id")
  .eq("tenant_id", tenant.id)
  .eq("module_id", moduleRow.id)
  .in("status", ["trial", "active"])
  .maybeSingle();

if (licenseError) throw licenseError;
if (!license) throw new Error("Pumay no tiene Operations Hub activo/trial.");

const { data: gabriel } = await supabase
  .from("wama_profiles")
  .select("id,email,full_name")
  .eq("email", "gsanchez@pumay.cl")
  .maybeSingle();

const { data: claudio } = await supabase
  .from("wama_profiles")
  .select("id,email,full_name")
  .eq("email", "cdieterich@pumay.cl")
  .maybeSingle();

if (!gabriel) throw new Error("No encontré el perfil de Gabriel.");
if (!claudio) throw new Error("No encontré el perfil de Claudio.");

let { data: project, error: projectLookupError } = await supabase
  .from("wama_projects")
  .select("id,code,name")
  .eq("tenant_id", tenant.id)
  .eq("code", "PISO-M1")
  .maybeSingle();

if (projectLookupError) throw projectLookupError;

if (!project) {
  const { data: created, error } = await supabase
    .from("wama_projects")
    .insert({
      tenant_id: tenant.id,
      code: "PISO-M1",
      name: "Piso -1",
      description:
        "Piloto real de Operations Hub para coordinación de contratistas externos, casos, evidencias, planos y locaciones.",
      status: "active",
      created_by: gabriel.id,
    })
    .select("id,code,name")
    .single();
  if (error) throw error;
  project = created;
}

await supabase.from("wama_project_modules").upsert(
  {
    project_id: project.id,
    tenant_module_license_id: license.id,
  },
  { onConflict: "project_id,tenant_module_license_id" },
);

await supabase.from("wama_project_members").upsert(
  [
    { project_id: project.id, profile_id: gabriel.id, role: "admin" },
    { project_id: project.id, profile_id: claudio.id, role: "admin" },
  ],
  { onConflict: "project_id,profile_id" },
);

const teamNames = ["Constructores", "Arquitectos", "Eléctricos"];

for (const name of teamNames) {
  let { data: team } = await supabase
    .from("wama_operations_teams")
    .select("id,name")
    .eq("tenant_id", tenant.id)
    .eq("name", name)
    .maybeSingle();

  if (!team) {
    const { data: created, error } = await supabase
      .from("wama_operations_teams")
      .insert({
        tenant_id: tenant.id,
        name,
        receives_urgent: true,
        status: "active",
        created_by: gabriel.id,
      })
      .select("id,name")
      .single();
    if (error) throw error;
    team = created;
  }

  await supabase.from("wama_operations_project_teams").upsert(
    { project_id: project.id, team_id: team.id },
    { onConflict: "project_id,team_id" },
  );

  await supabase.from("wama_operations_team_members").upsert(
    [
      {
        team_id: team.id,
        profile_id: gabriel.id,
        team_role: "coordinator",
      },
      {
        team_id: team.id,
        profile_id: claudio.id,
        team_role: "coordinator",
      },
    ],
    { onConflict: "team_id,profile_id" },
  );
}

for (const [index, item] of locations.entries()) {
  const { data: existing } = await supabase
    .from("wama_operations_locations")
    .select("id")
    .eq("project_id", project.id)
    .eq("name", item.name)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase
      .from("wama_operations_locations")
      .insert({
        tenant_id: tenant.id,
        project_id: project.id,
        code: item.code,
        name: item.name,
        location_type: item.type,
        sort_order: index + 1,
        status: "active",
        created_by: gabriel.id,
      });
    if (error) throw error;
  }
}

const asset = path.resolve(
  "seed-assets",
  "Pumay",
  "Piso-M1",
  "A-001 Planta General.pdf",
);

if (!fs.existsSync(asset)) {
  throw new Error(`No encontré el plano en ${asset}`);
}

const storagePath = `${tenant.id}/${project.id}/A-001-Planta-General-REV3.pdf`;
const bytes = fs.readFileSync(asset);

const { error: uploadError } = await supabase.storage
  .from("operations-plans")
  .upload(storagePath, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });

if (uploadError) throw uploadError;

const { data: existingPlan } = await supabase
  .from("wama_operations_project_plans")
  .select("id")
  .eq("project_id", project.id)
  .eq("sheet_code", "A-001")
  .maybeSingle();

if (!existingPlan) {
  const { error } = await supabase
    .from("wama_operations_project_plans")
    .insert({
      tenant_id: tenant.id,
      project_id: project.id,
      sheet_code: "A-001",
      title: "Planta General",
      revision: "REV. 3",
      revision_date: "2026-08-21",
      scale: "1:100",
      storage_path: storagePath,
      file_name: "A-001 Planta General.pdf",
      mime_type: "application/pdf",
      file_size: bytes.length,
      uploaded_by: gabriel.id,
    });
  if (error) throw error;
}

console.log("");
console.log("PILOTO PUMAY CREADO");
console.log("-------------------");
console.log(`Proyecto: ${project.name} (${project.code})`);
console.log("Administradores: Gabriel Sánchez + Claudio Dieterich");
console.log("Equipos: Constructores, Arquitectos, Eléctricos");
console.log(`Locaciones creadas/verificadas: ${locations.length}`);
console.log("Plano: A-001 · Planta General · REV. 3 · 21-08-2026 · 1:100");
console.log("");
console.log(
  "Los contratistas NO fueron invitados automáticamente. Envíalos desde Operations -> Usuarios para conservar el flujo real de invitación WAMA.",
);
