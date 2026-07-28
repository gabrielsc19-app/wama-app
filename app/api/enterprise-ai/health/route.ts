import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());

  return NextResponse.json(
    {
      ok: configured,
      service: "WAMA AI",
      configured,
      model,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      checkedAt: new Date().toISOString(),
    },
    {
      status: configured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
