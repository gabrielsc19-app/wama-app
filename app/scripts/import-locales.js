const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const EXCEL_PATH = path.join(
  PROJECT_ROOT,
  "base_locales_fixloop_pumay_permisos.xlsx"
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el archivo ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) return;

    const equalIndex = trimmed.indexOf("=");

    if (equalIndex === -1) return;

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseBoolean(value) {
  const normalized = String(value || "").trim().toLowerCase();

  return ["true", "1", "sí", "si", "yes", "activo", "active"].includes(
    normalized
  );
}

function sheetToRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`No existe la hoja "${sheetName}" en el Excel.`);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  return rows.map((row) => {
    const normalizedRow = {};

    Object.entries(row).forEach(([key, value]) => {
      normalizedRow[String(key).trim()] = value;
    });

    return normalizedRow;
  });
}

async function upsertLocation(supabaseAdmin, row) {
  const organizationId = Number(row.organization_id || 1);
  const localCode = normalizeText(row.local_code);
  const localName = normalizeText(row.local_name);

  if (!localCode || !localName) {
    return {
      skipped: true,
      reason: "Falta local_code o local_name",
      locationId: null,
    };
  }

  const payload = {
    organization_id: organizationId,
    local_code: localCode,
    name: localName,
    brand_name: normalizeText(row.brand_name) || localName,
    floor: row.floor ? Number(row.floor) : null,
    sector: normalizeText(row.sector) || null,
    category: normalizeText(row.category) || null,
    status: normalizeText(row.status) || "active",
    active: normalizeText(row.status).toLowerCase() !== "inactive",
    notes: normalizeText(row.notes) || null,
  };

  const { data: existing, error: findError } = await supabaseAdmin
    .from("locations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("local_code", localCode)
    .maybeSingle();

  if (findError) {
    throw new Error(`Error buscando local ${localCode}: ${findError.message}`);
  }

  if (existing?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("locations")
      .update(payload)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(
        `Error actualizando local ${localCode}: ${updateError.message}`
      );
    }

    return {
      skipped: false,
      action: "actualizado",
      locationId: existing.id,
    };
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("locations")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    throw new Error(
      `Error creando local ${localCode}: ${insertError.message}`
    );
  }

  return {
    skipped: false,
    action: "creado",
    locationId: inserted.id,
  };
}

async function createAuthUserIfNeeded(supabaseAdmin, row) {
  const status = normalizeText(row.status_carga).toLowerCase();
  const email = normalizeEmail(row.email);
  const password = normalizeText(row.temporary_password);

  if (status !== "nuevo") {
    return {
      skipped: true,
      reason: `No es usuario nuevo. status_carga=${status || "vacío"}`,
    };
  }

  if (!email) {
    return {
      skipped: true,
      reason: "Sin email",
    };
  }

  if (!password) {
    return {
      skipped: true,
      reason: "Sin temporary_password",
    };
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: normalizeText(row.name),
      role: normalizeText(row.role),
      company: normalizeText(row.company),
    },
  });

  if (error) {
    const message = String(error.message || "").toLowerCase();

    if (
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists")
    ) {
      return {
        skipped: true,
        reason: "Ya existía en Authentication",
      };
    }

    throw new Error(`Error creando Auth para ${email}: ${error.message}`);
  }

  return {
    skipped: false,
    reason: "Creado en Authentication",
  };
}

async function findPrimaryLocationForUser(supabaseAdmin, email, organizationId) {
  const { data, error } = await supabaseAdmin
    .from("local_user_access")
    .select("location_id")
    .eq("organization_id", organizationId)
    .eq("user_email", email)
    .eq("active", true)
    .order("is_primary_contact", { ascending: false })
    .limit(1);

  if (error) {
    return null;
  }

  return data?.[0]?.location_id || null;
}

async function upsertLocalUserProfile(supabaseAdmin, row) {
  const email = normalizeEmail(row.email);
  const organizationId = Number(row.organization_id || 1);

  if (!email) {
    return {
      skipped: true,
      reason: "Sin email",
    };
  }

  const locationId = await findPrimaryLocationForUser(
    supabaseAdmin,
    email,
    organizationId
  );

  const payload = {
    name: normalizeText(row.name),
    email,
    phone: row.phone ? normalizeText(row.phone) : null,
    role: normalizeText(row.role) || "locatario_usuario",
    active: parseBoolean(row.active),
    organization_id: organizationId,
    location_id: locationId,
  };

  const { data: existing, error: findError } = await supabaseAdmin
    .from("users_pumay")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    throw new Error(`Error buscando perfil ${email}: ${findError.message}`);
  }

  if (existing?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("users_pumay")
      .update(payload)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(
        `Error actualizando perfil ${email}: ${updateError.message}`
      );
    }

    return {
      skipped: false,
      action: "actualizado",
    };
  }

  const { error: insertError } = await supabaseAdmin
    .from("users_pumay")
    .insert(payload);

  if (insertError) {
    throw new Error(
      `Error creando perfil ${email}: ${insertError.message}`
    );
  }

  return {
    skipped: false,
    action: "creado",
  };
}

async function findLocationByCode(supabaseAdmin, organizationId, localCode) {
  const { data, error } = await supabaseAdmin
    .from("locations")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("local_code", localCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Error buscando local ${localCode}: ${error.message}`);
  }

  return data || null;
}

async function upsertLocalUserAccess(supabaseAdmin, row) {
  const organizationId = Number(row.organization_id || 1);
  const localCode = normalizeText(row.local_code);
  const email = normalizeEmail(row.user_email);

  if (!localCode || !email) {
    return {
      skipped: true,
      reason: "Falta local_code o user_email",
    };
  }

  const location = await findLocationByCode(
    supabaseAdmin,
    organizationId,
    localCode
  );

  if (!location?.id) {
    return {
      skipped: true,
      reason: `No existe local_code ${localCode}`,
    };
  }

  const payload = {
    organization_id: organizationId,
    location_id: location.id,
    local_code: localCode,
    local_name: normalizeText(row.local_name) || location.name,
    user_email: email,
    user_role_in_local: normalizeText(row.user_role_in_local) || "apoyo",
    can_report: parseBoolean(row.can_report),
    receives_notifications: parseBoolean(row.receives_notifications),
    can_respond_pumay_cases: parseBoolean(row.can_respond_pumay_cases),
    is_primary_contact: parseBoolean(row.is_primary_contact),
    active: parseBoolean(row.active),
  };

  const { data: existing, error: findError } = await supabaseAdmin
    .from("local_user_access")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("location_id", location.id)
    .eq("user_email", email)
    .maybeSingle();

  if (findError) {
    throw new Error(
      `Error buscando relación ${localCode}/${email}: ${findError.message}`
    );
  }

  if (existing?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("local_user_access")
      .update(payload)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(
        `Error actualizando relación ${localCode}/${email}: ${updateError.message}`
      );
    }

    return {
      skipped: false,
      action: "actualizada",
      email,
      locationId: location.id,
    };
  }

  const { error: insertError } = await supabaseAdmin
    .from("local_user_access")
    .insert(payload);

  if (insertError) {
    throw new Error(
      `Error creando relación ${localCode}/${email}: ${insertError.message}`
    );
  }

  return {
    skipped: false,
    action: "creada",
    email,
    locationId: location.id,
  };
}

async function syncUserPrimaryLocation(supabaseAdmin, email, organizationId) {
  const locationId = await findPrimaryLocationForUser(
    supabaseAdmin,
    email,
    organizationId
  );

  if (!locationId) return;

  await supabaseAdmin
    .from("users_pumay")
    .update({ location_id: locationId })
    .eq("email", email);
}

async function main() {
  console.log("Iniciando carga masiva de locales y usuarios de locales...");

  loadEnvFile(ENV_PATH);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
  }

  if (!serviceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }

  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(
      `No se encontró el archivo ${path.basename(EXCEL_PATH)} en la raíz del proyecto.`
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const workbook = XLSX.readFile(EXCEL_PATH);

  const locales = sheetToRows(workbook, "locales");
  const usuariosLocales = sheetToRows(workbook, "usuarios_locales");
  const relaciones = sheetToRows(workbook, "relacion_local_usuario");

  const summary = {
    locationsCreated: 0,
    locationsUpdated: 0,
    locationsSkipped: 0,
    authCreated: 0,
    authSkipped: 0,
    profilesCreated: 0,
    profilesUpdated: 0,
    profilesSkipped: 0,
    relationsCreated: 0,
    relationsUpdated: 0,
    relationsSkipped: 0,
    errors: 0,
  };

  console.log("");
  console.log(`Locales encontrados: ${locales.length}`);

  for (const row of locales) {
    try {
      const result = await upsertLocation(supabaseAdmin, row);

      if (result.skipped) {
        summary.locationsSkipped += 1;
        console.log(
          `Local omitido: ${row.local_code || "sin código"} (${result.reason})`
        );
      } else if (result.action === "creado") {
        summary.locationsCreated += 1;
        console.log(`Local creado: ${row.local_code} - ${row.local_name}`);
      } else {
        summary.locationsUpdated += 1;
        console.log(`Local actualizado: ${row.local_code} - ${row.local_name}`);
      }
    } catch (error) {
      summary.errors += 1;
      console.error(
        `ERROR local ${row.local_code || "sin código"}: ${error.message}`
      );
    }
  }

  console.log("");
  console.log(`Relaciones local-usuario encontradas: ${relaciones.length}`);

  const affectedEmails = new Set();

  for (const row of relaciones) {
    try {
      const result = await upsertLocalUserAccess(supabaseAdmin, row);

      if (result.skipped) {
        summary.relationsSkipped += 1;
        console.log(
          `Relación omitida: ${row.local_code || "sin local"} / ${
            row.user_email || "sin email"
          } (${result.reason})`
        );
      } else if (result.action === "creada") {
        summary.relationsCreated += 1;
        affectedEmails.add(result.email);
        console.log(`Relación creada: ${row.local_code} / ${row.user_email}`);
      } else {
        summary.relationsUpdated += 1;
        affectedEmails.add(result.email);
        console.log(
          `Relación actualizada: ${row.local_code} / ${row.user_email}`
        );
      }
    } catch (error) {
      summary.errors += 1;
      console.error(
        `ERROR relación ${row.local_code || "sin local"} / ${
          row.user_email || "sin email"
        }: ${error.message}`
      );
    }
  }

  console.log("");
  console.log(`Usuarios de locales encontrados: ${usuariosLocales.length}`);

  for (const row of usuariosLocales) {
    try {
      const email = normalizeEmail(row.email);

      console.log(`Procesando usuario local: ${row.name} <${email}>`);

      const authResult = await createAuthUserIfNeeded(supabaseAdmin, row);

      if (authResult.skipped) {
        summary.authSkipped += 1;
        console.log(`  Auth omitido: ${authResult.reason}`);
      } else {
        summary.authCreated += 1;
        console.log("  Auth creado");
      }

      const profileResult = await upsertLocalUserProfile(supabaseAdmin, row);

      if (profileResult.skipped) {
        summary.profilesSkipped += 1;
        console.log(`  Perfil omitido: ${profileResult.reason}`);
      } else if (profileResult.action === "creado") {
        summary.profilesCreated += 1;
        console.log("  Perfil users_pumay creado");
      } else {
        summary.profilesUpdated += 1;
        console.log("  Perfil users_pumay actualizado");
      }

      if (email) {
        affectedEmails.add(email);
      }
    } catch (error) {
      summary.errors += 1;
      console.error(
        `ERROR usuario ${row.email || "sin email"}: ${error.message}`
      );
    }
  }

  for (const email of affectedEmails) {
    await syncUserPrimaryLocation(supabaseAdmin, email, 1);
  }

  console.log("");
  console.log("Carga finalizada.");
  console.log("");
  console.log("Resumen:");
  console.log(`Locales creados: ${summary.locationsCreated}`);
  console.log(`Locales actualizados: ${summary.locationsUpdated}`);
  console.log(`Locales omitidos: ${summary.locationsSkipped}`);
  console.log(`Auth creados: ${summary.authCreated}`);
  console.log(`Auth omitidos: ${summary.authSkipped}`);
  console.log(`Perfiles creados: ${summary.profilesCreated}`);
  console.log(`Perfiles actualizados: ${summary.profilesUpdated}`);
  console.log(`Perfiles omitidos: ${summary.profilesSkipped}`);
  console.log(`Relaciones creadas: ${summary.relationsCreated}`);
  console.log(`Relaciones actualizadas: ${summary.relationsUpdated}`);
  console.log(`Relaciones omitidas: ${summary.relationsSkipped}`);
  console.log(`Errores: ${summary.errors}`);

  if (summary.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Error general:", error.message);
  process.exit(1);
});