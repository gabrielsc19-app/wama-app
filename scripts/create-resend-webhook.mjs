import fs from "node:fs";
import path from "node:path";
import { Resend } from "resend";

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [key, value];
      }),
  );
}

const local = loadEnv(path.resolve(".env.local"));
const apiKey = process.env.RESEND_API_KEY || local.RESEND_API_KEY;
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  local.NEXT_PUBLIC_APP_URL ||
  "https://wamaapp.com";

if (!apiKey) {
  throw new Error("Falta RESEND_API_KEY en .env.local.");
}

const resend = new Resend(apiKey);
const endpoint = `${appUrl.replace(/\/$/, "")}/api/webhooks/resend`;

const { data, error } = await resend.webhooks.create({
  endpoint,
  events: [
    "email.sent",
    "email.delivered",
    "email.delivery_delayed",
    "email.bounced",
    "email.complained",
    "email.failed",
    "email.suppressed",
    "email.opened",
    "email.clicked",
  ],
});

if (error || !data) {
  throw new Error(error?.message || "No se pudo crear el webhook.");
}

console.log("");
console.log("Webhook Resend creado correctamente");
console.log("-----------------------------------");
console.log("Endpoint:", endpoint);
console.log("Webhook ID:", data.id);
console.log("Signing secret:", data.signing_secret);
console.log("");
console.log("IMPORTANTE:");
console.log("1. Copia el signing secret.");
console.log("2. Agrégalo en Vercel como RESEND_WEBHOOK_SECRET.");
console.log("3. Haz Redeploy después de guardar la variable.");
