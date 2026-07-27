export type ExpenseRole = "collaborator" | "supervisor" | "finance" | "manager" | "admin";

export const expenseRoles: Record<ExpenseRole, {
  label: string;
  description: string;
  defaultView: "dashboard" | "new" | "mine" | "money" | "approvals" | "finance";
}> = {
  collaborator: {
    label: "Colaborador",
    description: "Rinde gastos, revisa el OCR y sigue tus solicitudes.",
    defaultView: "new",
  },
  supervisor: {
    label: "Jefatura",
    description: "Aprueba, observa o rechaza rendiciones del equipo.",
    defaultView: "approvals",
  },
  finance: {
    label: "Finanzas",
    description: "Valida documentos, diferencias, pagos y auditoría.",
    defaultView: "finance",
  },
  manager: {
    label: "Gerencia",
    description: "Consulta indicadores, alertas y tendencias ejecutivas.",
    defaultView: "dashboard",
  },
  admin: {
    label: "Administrador",
    description: "Acceso completo al módulo y su configuración.",
    defaultView: "dashboard",
  },
};
