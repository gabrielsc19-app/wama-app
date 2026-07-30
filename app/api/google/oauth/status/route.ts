import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const names = ["GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","GOOGLE_REDIRECT_URI","GOOGLE_SENDER_EMAIL","GOOGLE_REFRESH_TOKEN"] as const;
  const configured = Object.fromEntries(names.map((name)=>[name,Boolean(process.env[name]?.trim())]));
  const ok = Object.values(configured).every(Boolean);
  return NextResponse.json({ok,service:"WAMA Gmail",configured,sender:process.env.GOOGLE_SENDER_EMAIL?.trim() || null,checkedAt:new Date().toISOString()},{status:ok?200:503,headers:{"cache-control":"no-store"}});
}
