import nodemailer from "nodemailer";

type SendInput = { to: string | string[]; subject: string; html: string; text?: string; replyTo?: string };
type TokenResponse = { access_token?: string; error?: string; error_description?: string };
type SendResponse = { id?: string; threadId?: string; error?: { message?: string } };

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return value;
}

function b64url(value: string): string {
  return Buffer.from(value,"utf8").toString("base64").replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
}

function header(value: string): string {
  return value.replace(/[\r\n]+/g," ").trim();
}

async function accessToken(): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({
      client_id:env("GOOGLE_CLIENT_ID"),
      client_secret:env("GOOGLE_CLIENT_SECRET"),
      refresh_token:env("GOOGLE_REFRESH_TOKEN"),
      grant_type:"refresh_token",
    }),
    cache:"no-store",
  });
  const data = await response.json() as TokenResponse;
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || `Google OAuth respondió ${response.status}`);
  return data.access_token;
}

function mime(input: SendInput): string {
  const sender = header(env("GOOGLE_SENDER_EMAIL"));
  const to = (Array.isArray(input.to)?input.to:[input.to]).map(header).filter(Boolean).join(", ");
  if (!to) throw new Error("Falta destinatario");
  const boundary = `wama_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const text = input.text || input.html.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  const lines = [
    `From: WAMA <${sender}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(header(input.subject),"utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  if (input.replyTo) lines.push(`Reply-To: ${header(input.replyTo)}`);
  return [...lines,"",`--${boundary}`,'Content-Type: text/plain; charset="UTF-8"',"Content-Transfer-Encoding: base64","",Buffer.from(text,"utf8").toString("base64"),`--${boundary}`,'Content-Type: text/html; charset="UTF-8"',"Content-Transfer-Encoding: base64","",Buffer.from(input.html,"utf8").toString("base64"),`--${boundary}--`].join("\r\n");
}

export async function sendWamaEmail(input: SendInput) {
  const smtpPassword = process.env.WAMA_SMTP_APP_PASSWORD?.replace(/\s+/g, "");
  if (smtpPassword) {
    const sender = process.env.WAMA_SMTP_USER?.trim() || process.env.GOOGLE_SENDER_EMAIL?.trim() || "contacto@wamaapp.com";
    const transporter = nodemailer.createTransport({
      host: process.env.WAMA_SMTP_HOST?.trim() || "smtp.gmail.com",
      port: Number(process.env.WAMA_SMTP_PORT || 465),
      secure: Number(process.env.WAMA_SMTP_PORT || 465) === 465,
      auth: { user: sender, pass: smtpPassword },
    });
    const result = await transporter.sendMail({
      from: `WAMA <${sender}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { id: result.messageId, threadId: null };
  }

  const token = await accessToken();
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:JSON.stringify({raw:b64url(mime(input))}),
    cache:"no-store",
  });
  const data = await response.json() as SendResponse;
  if (!response.ok || !data.id) throw new Error(data.error?.message || `Gmail API respondió ${response.status}`);
  return {id:data.id,threadId:data.threadId || null};
}
