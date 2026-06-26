import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = "incident-photos";
const MAX_IMAGE_FILES = 5;
const MAX_VIDEO_FILES = 1;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 50;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Faltan variables de Supabase: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value: FormDataEntryValue | string | null | undefined, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getMediaType(file: File) {
  if (file.type.startsWith("video/")) return "video";
  return "image";
}

function safeFileExtension(fileName: string, mediaType: "image" | "video") {
  const raw = fileName.split(".").pop()?.toLowerCase().trim() || "";
  const imageAllowed = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
  const videoAllowed = ["mp4", "mov", "webm", "m4v", "quicktime"];

  if (mediaType === "video") {
    if (raw === "quicktime") return "mov";
    return videoAllowed.includes(raw) ? raw : "mp4";
  }

  return imageAllowed.includes(raw) ? raw : "jpg";
}

function isAllowedImage(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function isAllowedVideo(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type === "video/mp4" ||
    file.type === "video/quicktime" ||
    file.type === "video/webm" ||
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".webm") ||
    name.endsWith(".m4v")
  );
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);

    const incidentId = Number(searchParams.get("incidentId") || 0);
    const organizationId = Number(searchParams.get("organizationId") || 1);

    if (!incidentId) {
      return NextResponse.json(
        { ok: false, error: "Falta incidentId." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("incident_photos")
      .select("*")
      .eq("incident_id", incidentId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "No se pudieron cargar los adjuntos." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, photos: data || [] });
  } catch (error) {
    console.error("GET /api/incident-photos error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los adjuntos del caso.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const formData = await request.formData();

    const incidentId = Number(formData.get("incidentId") || 0);
    const organizationId = Number(formData.get("organizationId") || 1);
    const photoType = cleanText(formData.get("photoType"), "creation");
    const uploadedBy = cleanText(formData.get("uploadedBy"));
    const uploadedByEmail = cleanText(formData.get("uploadedByEmail")).toLowerCase();
    const setMainPhoto = cleanText(formData.get("setMainPhoto")) === "true";

    if (!incidentId) {
      return NextResponse.json(
        { ok: false, error: "Falta incidentId." },
        { status: 400 }
      );
    }

    const incomingFiles = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (incomingFiles.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Debes adjuntar al menos una foto o video." },
        { status: 400 }
      );
    }

    const imageFiles = incomingFiles.filter((file) => isAllowedImage(file));
    const videoFiles = incomingFiles.filter((file) => isAllowedVideo(file));
    const validFiles = [...imageFiles, ...videoFiles];

    if (validFiles.length !== incomingFiles.length) {
      return NextResponse.json(
        { ok: false, error: "Solo se permiten imágenes JPG, PNG, WEBP, HEIC o videos MP4, MOV, WEBM." },
        { status: 400 }
      );
    }

    if (imageFiles.length > MAX_IMAGE_FILES) {
      return NextResponse.json(
        { ok: false, error: `Solo puedes adjuntar hasta ${MAX_IMAGE_FILES} fotos.` },
        { status: 400 }
      );
    }

    if (videoFiles.length > MAX_VIDEO_FILES) {
      return NextResponse.json(
        { ok: false, error: `Solo puedes adjuntar hasta ${MAX_VIDEO_FILES} video.` },
        { status: 400 }
      );
    }

    for (const file of imageFiles) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          {
            ok: false,
            error: `Cada foto debe pesar máximo ${MAX_IMAGE_SIZE_MB} MB.`,
          },
          { status: 400 }
        );
      }
    }

    for (const file of videoFiles) {
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          {
            ok: false,
            error: `El video debe pesar máximo ${MAX_VIDEO_SIZE_MB} MB.`,
          },
          { status: 400 }
        );
      }
    }

    const { data: incident, error: incidentError } = await supabaseAdmin
      .from("incidents")
      .select("id, organization_id, photo_url")
      .eq("id", incidentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (incidentError || !incident) {
      return NextResponse.json(
        {
          ok: false,
          error: incidentError?.message || "No se encontró el caso asociado.",
        },
        { status: 404 }
      );
    }

    const uploadedRows: Array<{
      incident_id: number;
      organization_id: number;
      photo_url: string;
      photo_type: string;
      uploaded_by: string | null;
      uploaded_by_email: string | null;
      media_type: string;
      file_name: string | null;
      mime_type: string | null;
      file_size: number | null;
    }> = [];

    for (const file of incomingFiles) {
      const mediaType = getMediaType(file) as "image" | "video";
      const extension = safeFileExtension(file.name, mediaType);
      const filePath = `${organizationId}/${incidentId}/${photoType}-${mediaType}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType: file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se pudo subir un adjunto: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      uploadedRows.push({
        incident_id: incidentId,
        organization_id: organizationId,
        photo_url: publicUrlData.publicUrl,
        photo_type: photoType,
        uploaded_by: uploadedBy || null,
        uploaded_by_email: uploadedByEmail || null,
        media_type: mediaType,
        file_name: file.name || null,
        mime_type: file.type || null,
        file_size: file.size || null,
      });
    }

    const { data: insertedPhotos, error: insertError } = await supabaseAdmin
      .from("incident_photos")
      .insert(uploadedRows)
      .select("*");

    if (insertError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Adjuntos subidos, pero no se pudo registrar la galería: ${insertError.message}`,
        },
        { status: 500 }
      );
    }

    const firstImageUrl = uploadedRows.find((row) => row.media_type === "image")?.photo_url || uploadedRows[0]?.photo_url || null;

    if (setMainPhoto && firstImageUrl) {
      await supabaseAdmin
        .from("incidents")
        .update({ photo_url: firstImageUrl })
        .eq("id", incidentId)
        .eq("organization_id", organizationId);
    }

    return NextResponse.json({
      ok: true,
      photos: insertedPhotos || [],
      firstPhotoUrl: firstImageUrl,
    });
  } catch (error) {
    console.error("POST /api/incident-photos error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron subir los adjuntos del caso.",
      },
      { status: 500 }
    );
  }
}
