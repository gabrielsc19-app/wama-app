import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenResponse = {
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return value;
}

function esc(value: string): string {
  return value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function page(title: string, body: string, status = 200) {
  return new NextResponse(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{margin:0;background:#0b0c0e;color:#fff;font-family:Arial;display:grid;place-items:center;min-height:100vh}main{width:min(760px,calc(100% - 32px));background:#17191c;border:1px solid #30343a;border-radius:24px;padding:32px;box-sizing:border-box}.eyebrow{color:#00e5d6;font-weight:800;letter-spacing:.14em;font-size:12px}h1{font-size:34px}p{color:#c4c7cc;line-height:1.6}code,textarea{width:100%;box-sizing:border-box;background:#0b0c0e;color:#00e5d6;border:1px solid #3a3f46;border-radius:12px;padding:14px;font-family:Consolas}textarea{min-height:150px}button{background:#00e5d6;border:0;border-radius:999px;padding:13px 20px;font-weight:800}.warning{background:#2b2110;border:1px solid #6b4e16;color:#ffd27a;padding:14px;border-radius:12px}</style></head><body><main>${body}</main></body></html>`,{status,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-robots-tag":"noindex, nofollow"}});
}

export async function GET(request: NextRequest) {
  const expected = request.cookies.get("wama_google_oauth_state")?.value;
  const received = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) return page("Autorización cancelada", `<div class="eyebrow">WAMA GMAIL</div><h1>Autorización cancelada</h1><p>${esc(oauthError)}</p>`, 400);
  if (!expected || !received || expected !== received) return page("Estado inválido", `<div class="eyebrow">SEGURIDAD OAUTH</div><h1>No pudimos validar la solicitud</h1><p>Vuelve a abrir <code>/api/google/oauth/start</code>.</p>`, 400);
  if (!code) return page("Código ausente", `<div class="eyebrow">WAMA GMAIL</div><h1>Google no entregó el código</h1>`, 400);

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {"content-type":"application/x-www-form-urlencoded"},
      body: new URLSearchParams({
        code,
        client_id: env("GOOGLE_CLIENT_ID"),
        client_secret: env("GOOGLE_CLIENT_SECRET"),
        redirect_uri: env("GOOGLE_REDIRECT_URI"),
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const data = await response.json() as TokenResponse;
    if (!response.ok) throw new Error(data.error_description || data.error || "Google rechazó el intercambio");
    if (!data.refresh_token) return page("Token no entregado", `<div class="eyebrow">WAMA GMAIL</div><h1>Google no entregó refresh token</h1><p>Revoca el acceso anterior de WAMA y vuelve a iniciar el proceso.</p>`, 400);

    const token = esc(data.refresh_token);
    const result = page("Refresh token creado", `<div class="eyebrow">INTEGRACIÓN COMPLETADA</div><h1>Google Gmail quedó autorizado</h1><p>Copia este valor y créalo en Vercel como <strong>GOOGLE_REFRESH_TOKEN</strong>.</p><textarea id="token" readonly>${token}</textarea><p><button onclick="navigator.clipboard.writeText(document.getElementById('token').value)">Copiar token</button></p><div class="warning">No compartas este token ni lo subas a GitHub.</div>`);
    result.cookies.set("wama_google_oauth_state","",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",maxAge:0,path:"/"});
    return result;
  } catch (error) {
    return page("Error OAuth", `<div class="eyebrow">WAMA GMAIL</div><h1>No se pudo completar</h1><p>${esc(error instanceof Error ? error.message : "Error desconocido")}</p>`, 500);
  }
}
