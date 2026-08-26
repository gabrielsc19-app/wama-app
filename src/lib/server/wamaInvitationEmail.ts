type InvitationEmailContext = {
  recipientName: string;
  companyName: string;
  companyLogoUrl?: string | null;
  invitationUrl: string;
  moduleName?: string | null;
  projectName?: string | null;
  teamNames?: string[];
  roleLabel?: string | null;
  roleDescription?: string | null;
  isResend?: boolean;
};

function esc(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] ?? char);
}

const operationsRoles: Record<string, { label: string; description: string }> = {
  operations_admin: {
    label: "Administrador de Operations",
    description:
      "Administra proyectos, equipos, usuarios y puede gestionar todos los casos del módulo.",
  },
  operations_coordinator: {
    label: "Coordinador",
    description:
      "Supervisa los casos de sus equipos, asigna responsables, controla avances y puede cerrar trabajos.",
  },
  operations_operator: {
    label: "Operativo",
    description:
      "Ejecuta los trabajos asignados, registra avances, actualiza estados y adjunta fotografías o evidencias.",
  },
  operations_reporter: {
    label: "Reportante",
    description:
      "Puede crear casos, adjuntar evidencias y seguir el avance de los casos que reportó.",
  },
  operations_observer: {
    label: "Observador",
    description:
      "Puede consultar la información autorizada, sin modificar casos ni configuraciones.",
  },
};

export function getOperationsRoleCopy(role?: string | null) {
  if (!role) return null;
  return operationsRoles[role] || null;
}

export function buildWamaInvitationEmail(context: InvitationEmailContext) {
  const company = context.companyName || "Tu empresa";
  const safeName = esc(context.recipientName || "Usuario");
  const safeCompany = esc(company);
  const safeUrl = esc(context.invitationUrl);
  const safeModule = esc(context.moduleName || "WAMA Operations");
  const safeProject = context.projectName ? esc(context.projectName) : "";
  const safeRole = context.roleLabel ? esc(context.roleLabel) : "";
  const safeRoleDescription = context.roleDescription
    ? esc(context.roleDescription)
    : "";

  const safeTeams = (context.teamNames || []).map(esc);
  const group = safeTeams.length
    ? safeTeams.map((name) => `Equipo ${name}`).join(", ")
    : "Grupo de trabajo asignado";

  const companyIdentity = context.companyLogoUrl
    ? `<img src="${esc(context.companyLogoUrl)}" alt="${safeCompany}" style="display:block;max-width:118px;max-height:52px;object-fit:contain;margin-left:auto">`
    : `<div style="font-size:20px;font-weight:800;color:#FFFFFF;text-align:right">${safeCompany}</div>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 12px 8px 0;font-size:12px;color:#737B84;vertical-align:top;width:120px">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#0B0C0E;font-weight:800">${value}</td>
    </tr>`;

  const subject = `${company} te invita a participar en WAMA${
    context.projectName ? ` · ${context.projectName}` : ""
  }`;

  const text = [
    `Hola ${context.recipientName},`,
    "",
    `WAMA junto a ${company} te invita a participar en un grupo de trabajo.`,
    context.projectName ? `Proyecto: ${context.projectName}` : "",
    context.teamNames?.length ? `Grupo / equipo: ${context.teamNames.join(", ")}` : "",
    context.roleLabel ? `Perfil: ${context.roleLabel}` : "",
    context.roleDescription || "",
    "",
    `Aceptar invitación: ${context.invitationUrl}`,
    "",
    "Instalar WAMA en tu celular:",
    "iPhone / iPad: abre WAMA en Safari > Compartir > Agregar a pantalla de inicio > Agregar.",
    "Android: abre WAMA en Chrome > menú ⋮ > Instalar aplicación o Agregar a pantalla principal.",
    "Computador: puedes usar WAMA directamente desde tu navegador.",
    "",
    `Esta invitación fue generada por ${company} a través de WAMA.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;background:#F3F5F6;font-family:Arial,Helvetica,sans-serif;color:#0B0C0E">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border:1px solid #E1E5E9;border-radius:22px;overflow:hidden">
          <tr>
            <td style="background:#0B0C0E;padding:27px 32px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <div style="font-size:30px;font-weight:900;letter-spacing:4px;color:#00E5D6">WAMA</div>
                    <div style="margin-top:4px;font-size:10px;font-weight:700;letter-spacing:2px;color:#AEB5BD">WARN AND MANAGE</div>
                  </td>
                  <td style="vertical-align:middle;text-align:right">${companyIdentity}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 34px 14px">
              <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#E9FFFC;color:#007E76;font-size:11px;font-weight:900;letter-spacing:1px">
                WAMA × ${safeCompany}
              </div>
              <h1 style="margin:18px 0 12px;font-size:28px;line-height:1.15">Has sido invitado a participar</h1>
              <p style="margin:0;font-size:16px;line-height:1.65;color:#444C54">
                Hola <strong>${safeName}</strong>. WAMA, junto a <strong>${safeCompany}</strong>,
                te invita a formar parte de un grupo de trabajo dentro de <strong>${safeModule}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 34px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:18px;border-radius:16px;background:#F7F9FA;border:1px solid #E2E6E9">
                ${context.projectName ? detailRow("Proyecto", safeProject) : ""}
                ${detailRow("Grupo / equipo", group)}
                ${context.roleLabel ? detailRow("Tu perfil", safeRole) : ""}
              </table>
            </td>
          </tr>

          ${
            context.roleLabel && context.roleDescription
              ? `<tr>
                  <td style="padding:6px 34px 12px">
                    <div style="padding:16px 18px;border-radius:14px;border-left:4px solid #00CFC3;background:#F0FFFD">
                      <div style="margin-bottom:6px;font-size:12px;font-weight:900;color:#007E76">¿QUÉ SIGNIFICA TU PERFIL?</div>
                      <div style="font-size:14px;line-height:1.55;color:#444C54"><strong>${safeRole}:</strong> ${safeRoleDescription}</div>
                    </div>
                  </td>
                </tr>`
              : ""
          }

          <tr>
            <td style="padding:20px 34px 10px">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444C54">
                Desde WAMA podrás centralizar trabajos, responsables, ubicaciones, comentarios,
                fotografías y evidencias manteniendo un historial claro del proyecto.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr>
                  <td style="background:#00E5D6;border-radius:999px">
                    <a href="${safeUrl}" style="display:inline-block;padding:16px 30px;color:#0B0C0E;text-decoration:none;font-size:16px;font-weight:900">
                      ${context.isResend ? "Abrir nueva invitación" : "Aceptar invitación"}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;text-align:center;font-size:12px;line-height:1.5;color:#7A828A">
                Al aceptar podrás crear tu contraseña y entrar al espacio de trabajo de ${safeCompany}.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 34px">
              <div style="height:1px;background:#E6EAED;margin-bottom:25px"></div>
              <h2 style="margin:0 0 8px;font-size:20px">Instala WAMA en tu celular</h2>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#59616B">
                WAMA funciona como aplicación web instalable. No necesitas descargar archivos externos.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;padding-right:7px;vertical-align:top">
                    <div style="padding:16px;border:1px solid #E1E6EA;border-radius:14px">
                      <div style="margin-bottom:7px;font-size:15px;font-weight:900">iPhone / iPad</div>
                      <div style="font-size:13px;line-height:1.55;color:#59616B">
                        Abre WAMA en <strong>Safari</strong> → Compartir → <strong>Agregar a pantalla de inicio</strong> → Agregar.
                      </div>
                    </div>
                  </td>
                  <td style="width:50%;padding-left:7px;vertical-align:top">
                    <div style="padding:16px;border:1px solid #E1E6EA;border-radius:14px">
                      <div style="margin-bottom:7px;font-size:15px;font-weight:900">Android</div>
                      <div style="font-size:13px;line-height:1.55;color:#59616B">
                        Abre WAMA en <strong>Chrome</strong> → menú ⋮ → <strong>Instalar aplicación</strong> o Agregar a pantalla principal.
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:14px;padding:16px;border:1px solid #E1E6EA;border-radius:14px">
                <div style="margin-bottom:6px;font-size:15px;font-weight:900">Computador</div>
                <div style="font-size:13px;line-height:1.55;color:#59616B">
                  También puedes entrar directamente desde Chrome, Edge, Safari u otro navegador compatible.
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 34px;background:#F5F6F7">
              <p style="margin:0 0 7px;font-size:12px;color:#737881">Si el botón no funciona, copia este enlace:</p>
              <p style="margin:0;word-break:break-all;font-size:11px;color:#737881">${safeUrl}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 34px;background:#0B0C0E;text-align:center">
              <div style="font-size:13px;font-weight:900;color:#00E5D6">WAMA · Warn and Manage</div>
              <div style="margin-top:6px;font-size:11px;line-height:1.5;color:#AAB1B9">
                Esta invitación fue generada por ${safeCompany} a través de WAMA.
                Si no reconoces esta invitación, puedes ignorar este correo.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
