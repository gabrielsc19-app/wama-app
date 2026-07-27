import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "WAMA",
    status: "healthy",
    message: "WAMA API is running.",
  });
}
