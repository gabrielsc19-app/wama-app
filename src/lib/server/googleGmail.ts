import "server-only";
import { Resend } from "resend";

type SendInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

const WAMA_FROM = "WAMA <notificaciones@notificaciones.wamaapp.com>";
const WAMA_REPLY_TO = "contacto@wamaapp.com";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return value;
}

export async function sendWamaEmail(input: SendInput) {
  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((email) => email.trim())
    .filter(Boolean);

  if (!recipients.length) throw new Error("Falta destinatario");

  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  const { data, error } = await resend.emails.send({
    from: WAMA_FROM,
    to: recipients,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo?.trim() || WAMA_REPLY_TO,
  });

  if (error || !data?.id) {
    throw new Error(error?.message || "Resend no confirmó el envío del correo.");
  }

  return { id: data.id, threadId: null };
}
