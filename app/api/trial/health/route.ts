import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "WAMA Trial",
    databaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    emailConfigured: Boolean(process.env.RESEND_API_KEY),
    sender: process.env.WAMA_FROM_EMAIL || "WAMA <contacto@wamaapp.com>",
    module: "Rendiciones de Gastos",
    trialDays: 15,
    includedUsers: 10,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
  });
}
