import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const publicationId = Number(body.publicationId || body.publication_id);
    const userId = body.userId || body.user_id || null;
    const userEmail = String(body.userEmail || body.user_email || "").trim().toLowerCase();
    const locationIdRaw = body.locationId || body.location_id || null;
    const role = String(body.role || "").trim();

    const locationId =
      locationIdRaw === null || locationIdRaw === undefined || locationIdRaw === ""
        ? null
        : Number(locationIdRaw);

    if (!publicationId || Number.isNaN(publicationId)) {
      return NextResponse.json(
        { ok: false, error: "publicationId inválido" },
        { status: 400 }
      );
    }

    if (!userEmail && !userId && !locationId && !role) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos del usuario para registrar lectura" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const payload = {
      publication_id: publicationId,
      user_id: userId,
      user_email: userEmail || null,
      location_id: locationId,
      role: role || null,
      read_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("commercial_publication_reads")
      .upsert(payload, {
        onConflict: "publication_id,user_email,location_id,role",
      })
      .select()
      .single();

    if (error) {
      console.error("Error marking commercial publication as read:", error);

      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      read: data,
    });
  } catch (error) {
    console.error("Unexpected error in commercial publication read endpoint:", error);

    return NextResponse.json(
      { ok: false, error: "Error interno al registrar lectura" },
      { status: 500 }
    );
  }
}