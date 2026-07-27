const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const PROJECT_ROOT = process.cwd();
const ENV_PATH = path.join(PROJECT_ROOT, ".env.local");
const CSV_PATH = path.join(PROJECT_ROOT, "usuarios_pumay.csv");

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

function detectDelimiter(headerLine) {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;

  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsvLine(line, delimiter) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());

  return result;
}

function parseCsv(content) {
  const cleanContent = content.replace(/^\uFEFF/, "");
  const lines = cleanContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);

  console.log(`Separador detectado: ${delimiter === ";" ? "punto y coma ;" : "coma ,"}`);

  const headers = parseCsvLine(lines[0], delimiter).map((header) =>
    header.trim().toLowerCase()
  );

  console.log("Columnas detectadas:");
  console.log(headers.join(" | "));
  console.log("");

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });

    return row;
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parseBoolean(value) {
  const normalized = String(value || "").trim().toLowerCase();

  return ["true", "1", "sí", "si", "yes", "activo"].includes(normalized);
}

async function createAuthUserIfNeeded(supabaseAdmin, row) {
  const status = String(row.status_carga || "").trim().toLowerCase();
  const email = normalizeEmail(row.email);
  const password = String(row.temporary_password || "").trim();

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

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: row.name || "",
      role: row.role || "",
      area: row.area || "",
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
    authUserId: data?.user?.id || null,
  };
}

async function upsertUserProfile(supabaseAdmin, row) {
  const email = normalizeEmail(row.email);

  if (!email) {
    return {
      skipped: true,
      reason: "Sin email",
    };
  }

  const profilePayload = {
    name: String(row.name || "").trim(),
    email,
    phone: row.phone ? String(row.phone).trim() : null,
    role: String(row.role || "").trim(),
    active: parseBoolean(row.active),
    organization_id: Number(row.organization_id || 1),
    location_id: null,
  };

  const { data: existingProfile, error: findError } = await supabaseAdmin
    .from("users_pumay")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    throw new Error(`Error buscando perfil ${email}: ${findError.message}`);
  }

  if (existingProfile?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("users_pumay")
      .update(profilePayload)
      .eq("id", existingProfile.id);

    if (updateError) {
      throw new Error(`Error actualizando perfil ${email}: ${updateError.message}`);
    }

    return {
      action: "actualizado",
    };
  }

  const { error: insertError } = await supabaseAdmin
    .from("users_pumay")
    .insert(profilePayload);

  if (insertError) {
    throw new Error(`Error insertando perfil ${email}: ${insertError.message}`);
  }

  return {
    action: "creado",
  };
}

async function main() {
  console.log("Iniciando carga masiva de usuarios Pumay...");

  loadEnvFile(ENV_PATH);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
  }

  if (!serviceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error("No se encontró usuarios_pumay.csv en la raíz del proyecto.");
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const csvContent = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csvContent);

  if (rows.length === 0) {
    throw new Error("El CSV no tiene filas para cargar.");
  }

  console.log(`Usuarios encontrados en CSV: ${rows.length}`);
  console.log("");

  const summary = {
    authCreated: 0,
    authSkipped: 0,
    profilesCreated: 0,
    profilesUpdated: 0,
    profilesSkipped: 0,
    errors: 0,
  };

  for (const row of rows) {
    const email = normalizeEmail(row.email);
    const name = String(row.name || "").trim();
    const status = String(row.status_carga || "").trim();

    try {
      console.log(`Procesando: ${name} <${email}>`);
      console.log(`  Rol: ${row.role || "sin rol"} | Estado carga: ${status || "vacío"}`);

      const authResult = await createAuthUserIfNeeded(supabaseAdmin, row);

      if (authResult.skipped) {
        summary.authSkipped += 1;
        console.log(`  Auth: omitido (${authResult.reason})`);
      } else {
        summary.authCreated += 1;
        console.log("  Auth: creado");
      }

      const profileResult = await upsertUserProfile(supabaseAdmin, row);

      if (profileResult.skipped) {
        summary.profilesSkipped += 1;
        console.log(`  Perfil users_pumay: omitido (${profileResult.reason})`);
      }

      if (profileResult.action === "creado") {
        summary.profilesCreated += 1;
        console.log("  Perfil users_pumay: creado");
      }

      if (profileResult.action === "actualizado") {
        summary.profilesUpdated += 1;
        console.log("  Perfil users_pumay: actualizado");
      }

      console.log("");
    } catch (error) {
      summary.errors += 1;
      console.error(`  ERROR en ${email || "sin email"}:`, error.message);
      console.log("");
    }
  }

  console.log("Carga finalizada.");
  console.log("");
  console.log("Resumen:");
  console.log(`Auth creados: ${summary.authCreated}`);
  console.log(`Auth omitidos: ${summary.authSkipped}`);
  console.log(`Perfiles creados: ${summary.profilesCreated}`);
  console.log(`Perfiles actualizados: ${summary.profilesUpdated}`);
  console.log(`Perfiles omitidos: ${summary.profilesSkipped}`);
  console.log(`Errores: ${summary.errors}`);

  if (summary.errors > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Error general:", error.message);
  process.exit(1);
});