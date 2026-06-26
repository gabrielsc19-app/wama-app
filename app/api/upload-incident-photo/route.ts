import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "incident-photos";

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function sanitizeFolder(value: unknown) {
  const folder = cleanText(value, "general")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");

  return folder || "general";
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 6) {
    return fromName.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  }

  const mime = file.type.toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic")) return "heic";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";

  return "jpg";
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const formData = await request.formData();

    const file = formData.get("file");
    const organizationId = Number(formData.get("organizationId") || 1);
    const folder = sanitizeFolder(formData.get("folder"));

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No se recibió una foto válida." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "El archivo adjunto debe ser una imagen." },
        { status: 400 }
      );
    }

    const maxSizeMb = 12;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: `La foto supera el máximo permitido de ${maxSizeMb} MB.`,
        },
        { status: 400 }
      );
    }

    const extension = getFileExtension(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${organizationId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se pudo subir la foto adjunta: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      ok: true,
      path: filePath,
      publicUrl: data.publicUrl,
    });
  } catch (error) {
    console.error("POST /api/upload-incident-photo error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir la foto adjunta.",
      },
      { status: 500 }
    );
  }
}
