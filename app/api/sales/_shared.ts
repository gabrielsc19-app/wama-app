import { NextResponse } from "next/server";

type RestResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  details?: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SALES_STAGES = [
  "target_account",
  "first_contact",
  "qualified_lead",
  "proposal_sent",
  "negotiation",
  "closing",
  "closed_won",
  "closed_lost",
  "disqualified",
] as const;

export function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

export function stageProbability(stage: string) {
  const map: Record<string, number> = {
    target_account: 15,
    first_contact: 30,
    qualified_lead: 50,
    proposal_sent: 70,
    negotiation: 85,
    closing: 95,
    closed_won: 100,
    closed_lost: 0,
    disqualified: 0,
  };

  return map[stage] ?? 15;
}

export function statusForStage(stage: string) {
  if (stage === "closed_won") return "won";
  if (stage === "closed_lost") return "lost";
  if (stage === "disqualified") return "disqualified";
  return "open";
}

export function assertSalesEnv() {
  if (!SUPABASE_URL) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local / Vercel.");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local / Vercel.");
  }
}

function getAuthKey() {
  return SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || "";
}

export async function supabaseRest<T = unknown>(path: string, init: RequestInit = {}): Promise<RestResult<T>> {
  try {
    assertSalesEnv();

    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const key = getAuthKey();
    const headers = new Headers(init.headers);

    headers.set("apikey", key);
    headers.set("Authorization", `Bearer ${key}`);
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    headers.set("Prefer", headers.get("Prefer") || "return=representation");

    const response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown = null;

    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof data === "object" && data && "message" in data
          ? String((data as { message?: unknown }).message)
          : `Supabase REST error ${response.status}`;

      return {
        ok: false,
        status: response.status,
        data: data as T,
        error: message,
        details: data,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido en Supabase REST.",
    };
  }
}

export async function readRequestJson(request: Request) {
  const text = await request.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("JSON inválido en el body de la solicitud.");
  }
}
