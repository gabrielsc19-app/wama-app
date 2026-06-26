"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowLeft,
  CheckCircle2,
  FileArchive,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type UserProfile = {
  id?: number;
  organization_id: number;
  name: string;
  email: string;
  role: string;
  active?: boolean;
};

type PaymentPackage = {
  id: number;
  organization_id: number;
  package_name: string;
  payment_date: string | null;
  week_year: number | null;
  week_number: number | null;
  week_start: string | null;
  week_end: string | null;
  status: string;
  prepared_by_name: string | null;
  prepared_by_email: string | null;
  prepared_at: string | null;
  sent_for_review_at: string | null;
  reviewed_by_name: string | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  approved_by_name: string | null;
  approved_by_email: string | null;
  approved_at: string | null;
  rejected_by_name: string | null;
  rejected_by_email: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  sent_to_execution_at: string | null;
  executed_by_name: string | null;
  executed_by_email: string | null;
  executed_at: string | null;
  total_requested: number;
  total_approved: number;
  total_observed: number;
  total_rejected: number;
  payment_count: number;
  approved_count: number;
  observed_count: number;
  rejected_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PaymentPackageFile = {
  id: number;
  package_id: number;
  organization_id: number;
  file_name: string;
  file_type: string | null;
  file_category: string;
  storage_path: string | null;
  source: string | null;
  file_size: number | null;
  uploaded_by_name: string | null;
  uploaded_by_email: string | null;
  uploaded_at: string;
  parse_status: string;
  parse_message: string | null;
  raw_metadata: Record<string, unknown> | null;
  created_at: string;
};

type PaymentPackageLine = {
  id: number;
  package_id: number;
  file_id: number | null;
  organization_id: number;
  line_type: string;
  supplier_name: string | null;
  supplier_rut: string | null;
  supplier_bank: string | null;
  supplier_account_type: string | null;
  supplier_account_number: string | null;
  supplier_email: string | null;
  company_name: string | null;
  document_type: string | null;
  document_folio: string | null;
  issue_date: string | null;
  due_date: string | null;
  payment_date: string | null;
  invoice_amount: number;
  payment_amount: number;
  credit_note_amount: number;
  approved_amount: number;
  validation_status: string;
  reviewer_decision: string | null;
  observation: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type SupplierBankAccount = {
  id?: number;
  organization_id: number;
  supplier_rut: string;
  supplier_name: string | null;
  bank: string | null;
  account_type: string | null;
  account_number: string | null;
  beneficiary_email: string | null;
  active: boolean;
  source: string | null;
  notes?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  updated_by_name?: string | null;
  updated_by_email?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PaymentPackageBankMovement = {
  id: number;
  package_id: number;
  file_id: number | null;
  organization_id: number;
  source_file_name: string | null;
  source_row_number: number | null;
  beneficiary_rut: string | null;
  beneficiary_name: string | null;
  amount: number;
  payment_method: string | null;
  payment_date: string | null;
  bank_name: string | null;
  account_number: string | null;
  bank_status: string | null;
  rejection_reason: string | null;
  match_status: string | null;
  matched_line_id: number | null;
  match_score: number | null;
  raw_row: Record<string, unknown> | null;
  created_at: string;
};

type PaymentBankHistoryMovement = {
  id: number;
  organization_id: number;
  package_id: number | null;
  file_id: number | null;
  dedupe_key: string;
  source_file_name: string | null;
  source_row_number: number | null;
  beneficiary_rut: string | null;
  beneficiary_name: string | null;
  amount: number;
  payment_method: string | null;
  payment_date: string | null;
  bank_name: string | null;
  account_number: string | null;
  bank_status: string | null;
  rejection_reason: string | null;
  raw_row: Record<string, unknown> | null;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
};

type PaymentPackageObservation = {
  id: number;
  package_id: number;
  line_id: number | null;
  organization_id: number;
  observation_type: string;
  message: string;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string;
};

type PackageFileDraft = {
  file_name: string;
  file_type: string;
  file_category: string;
  file_size: number;
  source: string;
  raw_metadata: Record<string, unknown>;
};

type ExtractedFileRow = {
  fileName: string;
  category: string;
  sheet?: string;
  rowNumber?: number;
  column?: string;
  value: string;
};

type FileProcessingProgress = {
  fileName: string;
  category: string;
  status: "pendiente" | "leyendo" | "listo" | "error";
  progress: number;
  message: string;
};

const FIXLOOP_SESSION_KEY = "fixloop_pumay_session";

const ALLOWED_ROLES = [
  "owner",
  "cuentas_por_pagar",
  "proveedores",
  "facturacion",
  "facturación",
  "finanzas",
];

const SII_SOCIETY_BY_RUT: Record<string, string> = {
  // Sociedades validadas por Pumay. No inferir nombres por RUT.
  "79587660K": "Pumay S.A.",
  "79587660-K": "Pumay S.A.",
  "772055773": "Pumay SpA",
  "77205577-3": "Pumay SpA",
  "77601611K": "Inmobiliaria La Palmera",
  "77601611-K": "Inmobiliaria La Palmera",
};

function getRutFromFileName(fileName: string) {
  const match = fileName.match(/(\d{7,8})-?([0-9Kk])/);

  if (!match) return "";

  return `${match[1]}-${match[2].toUpperCase()}`;
}

function getSiiSocietyFromFileName(fileName: string) {
  const rutFromFile = getRutFromFileName(fileName);
  const cleanRut = normalizeRutNumberOnly(rutFromFile || fileName);
  const direct = SII_SOCIETY_BY_RUT[cleanRut] || SII_SOCIETY_BY_RUT[rutFromFile.toUpperCase()];

  if (direct) return direct;

  // Para no perder confiabilidad, si la razón social no está validada se muestra el RUT
  // del Registro SII y no se inventa el nombre de la sociedad.
  if (rutFromFile) return `Sociedad RUT ${rutFromFile}`;

  return "Sociedad SII por confirmar";
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeRole(role?: string | null) {
  return normalizeText(role);
}

function canAccessPayments(profile?: UserProfile | null) {
  if (!profile?.active && profile?.active !== undefined) return false;

  return ALLOWED_ROLES.includes(normalizeRole(profile?.role));
}

function getSavedProfileSession(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FIXLOOP_SESSION_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function normalizeRutNumberOnly(value: string | number | null | undefined) {
  return String(value || "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

function amountLooksLikeRut(amount: number, possibleRut?: string | null) {
  const cleanAmount = String(Math.round(Number(amount || 0))).replace(/[^0-9]/g, "");
  const cleanRut = normalizeRutNumberOnly(possibleRut).replace(/[kK]$/, "");

  if (!cleanAmount) return false;

  // RUT empresa/persona sin DV: 7 a 8 dígitos. Ej: 79587660, 77625410, 76691442.
  if (cleanAmount.length >= 7 && cleanAmount.length <= 8) return true;

  // Si el monto contiene el RUT leído, también se descarta.
  if (cleanRut && cleanAmount.includes(cleanRut)) return true;

  return false;
}

function sanitizeDisplayAmount(amount: number, possibleRut?: string | null) {
  const numeric = Number(amount || 0);

  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  // Protección fuerte: nunca mostrar un RUT como monto.
  if (amountLooksLikeRut(numeric, possibleRut)) return 0;

  // Protección para lecturas absurdas de PDF.
  // Si el monto real supera este umbral, debe venir desde una validación manual posterior,
  // no desde lectura automática.
  if (numeric > 50000000) return 0;

  return numeric;
}

function sanitizeDisplayAmountBySource(
  amount: number,
  possibleRut?: string | null,
  sourceType?: string | null,
) {
  const numeric = Number(amount || 0);

  if (!Number.isFinite(numeric) || numeric === 0) return 0;

  // En el Registro de Compras SII, "Monto Total" es una columna oficial.
  // Se acepta con signo: factura suma, nota de crédito resta.
  if (sourceType === "sii_registro_compras") {
    return numeric;
  }

  if (numeric <= 0) return 0;

  return sanitizeDisplayAmount(numeric, possibleRut);
}

function getLineSourceType(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  return String(raw.source_type || "");
}

function getLineConfidence(line: PaymentPackageLine) {
  // "% Datos" mide qué tan completa está la información necesaria para pagar.
  // No es el estado de aprobación. Una línea puede estar "Por revisar" y tener 100% de datos.
  const checks = [
    Boolean(line.supplier_name),
    Boolean(line.supplier_rut),
    Boolean(line.document_folio),
    Boolean(line.issue_date),
    getSafeLineAmount(line) > 0,
    Boolean(line.supplier_bank),
    Boolean(line.supplier_account_type),
    Boolean(line.supplier_account_number),
    Boolean(line.supplier_email),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function buildLineMissingDataText(line: PaymentPackageLine) {
  const missing: string[] = [];

  if (!line.supplier_name) missing.push("proveedor");
  if (!line.supplier_rut) missing.push("RUT");
  if (!line.document_folio) missing.push("folio");
  if (!line.issue_date) missing.push("fecha emisión");
  if (getSafeLineAmount(line) <= 0) missing.push("monto");
  if (!line.supplier_bank) missing.push("banco");
  if (!line.supplier_account_type) missing.push("tipo de cuenta");
  if (!line.supplier_account_number) missing.push("cuenta bancaria");
  if (!line.supplier_email) missing.push("email");

  if (missing.length === 0) return "Datos completos. Revisar antes de enviar a revisión.";

  return `Falta: ${missing.join(", ")}.`;
}

function getSafeLineAmount(line: PaymentPackageLine) {
  const rawAmount = Number(line.payment_amount || line.invoice_amount || 0);
  return sanitizeDisplayAmountBySource(rawAmount, line.supplier_rut, getLineSourceType(line));
}

function getLinePaymentStatus(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  return String(raw.payment_status || "no_cruzado");
}

function getLinePaymentStatusLabel(line: PaymentPackageLine) {
  const status = getLinePaymentStatus(line);

  if (status === "pagado_cartola") return "Pagado banco";
  if (status === "pagado_manual") return "Pagado manual";
  if (status === "rechazado") return "Rechazado";
  if (status === "pendiente") return "Pendiente";

  return "No pagado";
}

function getLinePaymentStatusClass(line: PaymentPackageLine) {
  const status = getLinePaymentStatus(line);

  if (status === "pagado_cartola") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "pagado_manual") return "border-purple-200 bg-purple-50 text-purple-800";
  if (status === "rechazado") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "pendiente") return "border-amber-200 bg-amber-50 text-amber-800";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function isLinePaidByBank(line: PaymentPackageLine) {
  return getLinePaymentStatus(line) === "pagado_cartola";
}

function isLineRejectedByBank(line: PaymentPackageLine) {
  return getLinePaymentStatus(line) === "rechazado";
}

function getLineDueDateObject(line: PaymentPackageLine) {
  if (!line.due_date) return null;

  const value = line.due_date.slice(0, 10);
  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getPackagePaymentWeek(packageItem?: PaymentPackage | null) {
  const baseDate = packageItem?.payment_date
    ? new Date(`${packageItem.payment_date.slice(0, 10)}T00:00:00`)
    : new Date();

  return getWeekPeriod(baseDate);
}

function getLineScheduledPaymentDate(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  const scheduled = String(raw.scheduled_payment_date || "");

  return normalizeDateForDb(scheduled);
}

function getLineScheduledDateObject(line: PaymentPackageLine) {
  const scheduled = getLineScheduledPaymentDate(line);

  if (!scheduled) return null;

  const date = new Date(`${scheduled}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function lineDueThisPaymentWeek(line: PaymentPackageLine, packageItem?: PaymentPackage | null) {
  const scheduledDate = getLineScheduledDateObject(line);

  // Regla operacional:
  // Si el cargo de carga no movió la factura, la factura abierta pertenece al paquete/semana actual.
  // La fecha de vencimiento queda como dato informativo, porque el Registro SII no siempre trae vencimiento real.
  if (!scheduledDate) return true;

  const week = getPackagePaymentWeek(packageItem);

  return scheduledDate >= week.monday && scheduledDate <= week.sunday;
}

function lineShouldBePaidThisWeek(line: PaymentPackageLine, packageItem?: PaymentPackage | null) {
  if (isLineCreditNote(line)) return false;
  if (isLinePaidByBank(line)) return false;
  if (isLineRejectedByBank(line)) return false;

  return lineDueThisPaymentWeek(line, packageItem);
}

function getLinePaymentPlanLabel(line: PaymentPackageLine, packageItem?: PaymentPackage | null) {
  const scheduled = getLineScheduledPaymentDate(line);

  if (isLineCreditNote(line)) return "Nota crédito descuenta";
  if (isLinePaidByBank(line)) return "Ya pagado banco";
  if (isLineRejectedByBank(line)) return "Rechazado banco";
  if (scheduled && lineShouldBePaidThisWeek(line, packageItem)) return "Reprogramado a esta semana";
  if (scheduled) return `Movido a ${formatDate(scheduled)}`;

  return "Pagar esta semana";
}

function getLinePaymentPlanObservation(line: PaymentPackageLine, packageItem?: PaymentPackage | null) {
  const scheduled = getLineScheduledPaymentDate(line);
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  const rescheduleReason = String(raw.reschedule_reason || "");

  if (isLineCreditNote(line)) return "Nota de crédito SII: descuenta del total a pagar. No se paga como transferencia.";
  if (isLinePaidByBank(line)) return "No se vuelve a pagar: ya aparece como abono efectuado en nómina/cartola bancaria.";
  if (isLineRejectedByBank(line)) return "Pago rechazado por banco: revisar motivo, cuenta y datos del proveedor antes de reintentar.";
  if (scheduled) return `Pago movido para ${formatDate(scheduled)}${rescheduleReason ? `: ${rescheduleReason}` : "."}`;

  return "Factura abierta del Registro SII asignada a la semana actual. Si no se pagará ahora, moverla a otra semana.";
}

function getLinePaymentDetail(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  return String(raw.payment_match_detail || "");
}

function getLinePaymentReason(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  return String(raw.payment_reason || "");
}

function getLinePaymentSolution(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  return String(raw.payment_solution || "");
}

type PackageLineSortKey =
  | "none"
  | "supplier"
  | "rut"
  | "company"
  | "type"
  | "folio"
  | "issue"
  | "due"
  | "total"
  | "bank"
  | "accountType"
  | "account"
  | "email"
  | "payment"
  | "review"
  | "percent";

function getSortableLineValue(line: PaymentPackageLine, key: PackageLineSortKey) {
  const paymentOrder: Record<string, number> = {
    no_pagado: 1,
    pendiente: 2,
    rechazado: 3,
    pagado_cartola: 4,
  };

  if (key === "supplier") return normalizeText(line.supplier_name || "");
  if (key === "rut") return normalizeRutNumberOnly(line.supplier_rut || "");
  if (key === "company") return normalizeText(line.company_name || "");
  if (key === "type") return normalizeText(line.document_type || "");
  if (key === "folio") return normalizeText(line.document_folio || "");
  if (key === "issue") return line.issue_date || "";
  if (key === "due") return line.due_date || "";
  if (key === "total") return getSafeLineAmount(line);
  if (key === "bank") return normalizeText(line.supplier_bank || "");
  if (key === "accountType") return normalizeText(line.supplier_account_type || "");
  if (key === "account") return normalizeDigitsOnly(line.supplier_account_number || "");
  if (key === "email") return normalizeText(line.supplier_email || "");
  if (key === "payment") return paymentOrder[getLinePaymentStatus(line)] || 99;
  if (key === "review") return normalizeText(getLineStatusLabel(line.validation_status));
  if (key === "percent") return getLineConfidence(line);

  return "";
}

function buildAmountObservation(originalAmount: number, possibleRut?: string | null) {
  const numeric = Number(originalAmount || 0);

  if (!numeric) {
    return "No se pudo identificar un monto total confiable. Revisar documento antes de enviar a revisión.";
  }

  if (amountLooksLikeRut(numeric, possibleRut)) {
    return "Monto descartado porque coincide con formato de RUT. Revisar monto real del documento.";
  }

  if (numeric > 50000000) {
    return "Monto descartado por lectura no confiable desde PDF. Revisar monto real del documento.";
  }

  return "";
}

function buildLineObservationSummary(line: PaymentPackageLine) {
  const parts: string[] = [];
  const missing = buildLineMissingDataText(line);
  const reason = getLinePaymentReason(line);
  const solution = getLinePaymentSolution(line);
  const amountObservation =
    getLineSourceType(line) === "sii_registro_compras"
      ? ""
      : buildAmountObservation(Number(line.payment_amount || line.invoice_amount || 0), line.supplier_rut);

  if (missing) parts.push(missing);
  if (reason) parts.push(`Motivo: ${reason}`);
  if (solution) parts.push(`Cómo se soluciona: ${solution}`);
  if (line.observation) parts.push(line.observation);
  if (amountObservation) parts.push(amountObservation);

  return parts.filter(Boolean).join(" | ");
}

function formatExcelDate(value?: string | null) {
  if (!value) return "";

  const dateText = value.slice(0, 10);
  const parts = dateText.split("-");

  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return formatDate(value).replace(/\//g, "-");
}

function estimateNetAmount(total: number) {
  const amount = Number(total || 0);
  if (!amount) return 0;

  return Math.round(amount / 1.19);
}

function extractArticleFromLine(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  const preview = String(raw.extraction_preview || raw.source_file || line.observation || "");

  const articlePatterns = [
    /art[ií]culo[:\s]+([^\n\r]{3,140})/i,
    /detalle[:\s]+([^\n\r]{3,140})/i,
    /descripci[oó]n[:\s]+([^\n\r]{3,140})/i,
    /glosa[:\s]+([^\n\r]{3,140})/i,
  ];

  for (const pattern of articlePatterns) {
    const match = preview.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\s+/g, " ").trim().slice(0, 140);
    }
  }

  return line.observation?.replace(/\s+/g, " ").trim().slice(0, 140) || "";
}

function getIsoWeekNumber(date: Date) {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = current.getUTCDay() || 7;

  current.setUTCDate(current.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekPeriod(date: Date) {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  const day = base.getDay() || 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - day + 1);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekNumber: getIsoWeekNumber(base),
    monday,
    sunday,
  };
}

function getWorkflowRoleLabel(profile?: UserProfile | null) {
  const normalizedRole = normalizeRole(profile?.role);

  if (["cuentas_por_pagar", "proveedores", "facturacion", "facturación"].includes(normalizedRole)) {
    return "Carga de proveedores";
  }

  if (["owner", "gerencia_control", "planificacion_control", "aprobador_pagos"].includes(normalizedRole)) {
    return "Revisión y aprobación";
  }

  if (["gerencia_general", "ejecucion_pagos"].includes(normalizedRole)) {
    return "Cargo de ejecución";
  }

  if (normalizedRole === "finanzas") return "Finanzas";

  return "Usuario autorizado";
}

function getStatusLabel(status?: string | null) {
  const value = normalizeText(status);

  if (value === "borrador") return "Borrador";
  if (value === "enviado_revision") return "En revisión";
  if (value === "observado") return "Observado";
  if (value === "rechazado") return "Rechazado";
  if (value === "aprobado") return "Aprobado";
  if (value === "enviado_ejecucion") return "Enviado a ejecución";
  if (value === "ejecutado") return "Ejecutado";

  return "Sin estado";
}

function getStatusStyle(status?: string | null) {
  const value = normalizeText(status);

  if (value === "borrador") return "border-slate-200 bg-slate-50 text-slate-700";
  if (value === "enviado_revision") return "border-sky-200 bg-sky-50 text-sky-800";
  if (value === "observado") return "border-amber-200 bg-amber-50 text-amber-800";
  if (value === "rechazado") return "border-rose-200 bg-rose-50 text-rose-800";
  if (value === "aprobado") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "enviado_ejecucion") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (value === "ejecutado") return "border-slate-900 bg-slate-900 text-white";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function classifyPackageFile(fileName: string) {
  const value = normalizeText(fileName);
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (extension === "zip") return { category: "zip", type: "zip" };
  if (value.includes("macro") || extension === "xlsm") return { category: "banco_chile_macro", type: extension };
  if (value.includes("pago nomina") || value.includes("nomina banco") || value.includes("nómina banco") || extension === "txt") {
    return { category: extension === "txt" ? "banco_chile_txt" : "cartola_pagos", type: extension };
  }
  if (value.includes("ctas") || value.includes("cuentas") || value.includes("bancarias")) {
    return { category: "cuentas_bancarias", type: extension };
  }
  if (value.includes("nota") || value.includes("n-c") || value.includes("nc ")) {
    return { category: "nota_credito", type: extension };
  }
  if (value.includes("pagos efectuados") || value.includes("comprobante")) {
    return { category: "comprobante_pago", type: extension };
  }
  if (value.includes("rcv") || value.includes("registro compra") || value.includes("registro_compras") || value.includes("compra_registro")) {
    return { category: "registro_sii", type: extension };
  }
  if (value.includes("registro en el diario") || value.includes("registro")) {
    return { category: "registro_contable", type: extension };
  }
  if (value.includes("caja chica") || value.includes("rendicion")) {
    return { category: "caja_chica", type: extension };
  }
  if (value.includes("iva")) return { category: "iva", type: extension };
  if (value.includes("security")) return { category: "banco_security", type: extension };
  if (value.startsWith("f-") || value.includes("factura")) {
    return { category: "factura", type: extension };
  }
  if (value.includes("cartola")) return { category: "cartola", type: extension };

  return { category: "otro", type: extension };
}

function getCategoryLabel(category?: string | null) {
  const value = normalizeText(category);

  if (value === "zip") return "ZIP";
  if (value === "factura") return "Factura";
  if (value === "nota_credito") return "Nota de crédito";
  if (value === "comprobante_pago") return "Comprobante";
  if (value === "registro_sii") return "Registros SII sociedades";
  if (value === "registro_contable") return "Registro contable";
  if (value === "caja_chica") return "Caja chica";
  if (value === "iva") return "IVA";
  if (value === "banco_chile_macro") return "Macro BCH";
  if (value === "banco_chile_txt") return "TXT BCH";
  if (value === "banco_security") return "Banco Security";
  if (value === "cuentas_bancarias") return "Cuentas bancarias";
  if (value === "cartola" || value === "cartola_pagos") return "Cartola / nómina bancaria";

  return "Otro";
}

function getCategoryStyle(category?: string | null) {
  const value = normalizeText(category);

  if (value === "factura") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "nota_credito") return "border-rose-200 bg-rose-50 text-rose-800";
  if (value.includes("banco") || value === "cartola_pagos" || value === "cartola") return "border-sky-200 bg-sky-50 text-sky-800";
  if (value === "comprobante_pago") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (value === "registro_sii") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "registro_contable") return "border-amber-200 bg-amber-50 text-amber-800";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getCategoryOrder(category?: string | null) {
  const value = normalizeText(category);

  if (value === "banco_chile_txt" || value === "banco_chile_macro" || value === "cartola_pagos" || value === "cartola") return 1;
  if (value === "banco_security") return 2;
  if (value === "cuentas_bancarias") return 3;
  if (value === "factura") return 4;
  if (value === "nota_credito") return 5;
  if (value === "comprobante_pago") return 6;
  if (value === "registro_contable") return 7;
  if (value === "caja_chica") return 8;
  if (value === "iva") return 9;

  return 99;
}

function getLineStatusLabel(status?: string | null) {
  const value = normalizeText(status);

  if (value === "ok") return "OK";
  if (value === "observado") return "Observado";
  if (value === "rechazado") return "Rechazado";
  if (value === "excluir") return "Excluir";
  if (value === "falta_respaldo") return "Falta respaldo";
  if (value === "monto_no_coincide") return "Monto no coincide";
  if (value === "ya_pagado") return "Ya pagado";
  if (value === "nota_credito_aplicada") return "NC aplicada";
  if (value === "sin_cuenta_bancaria") return "Sin cuenta";
  if (value === "datos_incompletos") return "Datos incompletos";
  if (value === "posible_duplicado") return "Posible duplicado";
  if (value === "baja_confianza") return "Revisar lectura";

  return "Por revisar";
}

function getLineStatusStyle(status?: string | null) {
  const value = normalizeText(status);

  if (value === "ok") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (
    value === "observado" ||
    value === "falta_respaldo" ||
    value === "monto_no_coincide" ||
    value === "posible_duplicado" ||
    value === "baja_confianza"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (value === "rechazado" || value === "excluir") return "border-rose-200 bg-rose-50 text-rose-800";
  if (value === "ya_pagado") return "border-sky-200 bg-sky-50 text-sky-800";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function waitForFileStep(ms = 850) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function extractZipFileDrafts(file: File): Promise<PackageFileDraft[]> {
  const zipModule = await import("jszip");
  const JSZip = zipModule.default || zipModule;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(
    zip.files as Record<string, { name: string; dir: boolean; async: (type: "arraybuffer" | "string") => Promise<ArrayBuffer | string> }>,
  ).filter((entry) => !entry.dir);

  const drafts: PackageFileDraft[] = [];

  for (const entry of entries) {
    const fileName = entry.name.split("/").pop() || entry.name;
    const meta = classifyPackageFile(fileName);
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    let extracted: Record<string, unknown> = {
      extraction_status: "not_supported",
      extraction_type: extension || "unknown",
      message: "Archivo interno del ZIP registrado.",
    };

    try {
      if (["xlsx", "xls", "xlsm", "csv", "txt", "pdf"].includes(extension)) {
        const buffer = await entry.async("arraybuffer");
        const innerFile = new File([buffer], fileName, { type: extension === "csv" ? "text/csv" : "" });
        extracted = await extractFileMetadata(innerFile);
      }
    } catch (error) {
      extracted = {
        extraction_status: "error",
        extraction_type: extension || "unknown",
        error: error instanceof Error ? error.message : "No se pudo leer archivo interno del ZIP.",
      };
    }

    drafts.push({
      file_name: fileName,
      file_type: meta.type,
      file_category: meta.category,
      file_size: 0,
      source: file.name,
      raw_metadata: {
        zip_file: file.name,
        zip_path: entry.name,
        compressed: true,
        society_name: getSiiSocietyFromFileName(fileName),
        extracted,
      },
    });
  }

  return drafts;
}

async function buildBankAccountFileDraft(file: File): Promise<PackageFileDraft> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const extracted = await extractFileMetadata(file);

  return {
    file_name: file.name,
    file_type: extension,
    file_category: "cuentas_bancarias",
    file_size: file.size,
    source: "manual_bank_account_upload",
    raw_metadata: {
      original_file_name: file.name,
      size: file.size,
      type: file.type,
      extracted,
    },
  };
}

async function buildBankStatementFileDraft(file: File): Promise<PackageFileDraft> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const extracted = await extractFileMetadata(file);

  return {
    file_name: file.name,
    file_type: extension,
    file_category: "cartola_pagos",
    file_size: file.size,
    source: "manual_bank_statement_upload",
    raw_metadata: {
      original_file_name: file.name,
      size: file.size,
      type: file.type,
      extracted,
    },
  };
}

async function buildPackageFileDrafts(
  files: File[],
  onProgress?: (progress: FileProcessingProgress[]) => void,
) {
  const drafts: PackageFileDraft[] = [];

  const progressRows: FileProcessingProgress[] = files.map((file) => {
    const meta = classifyPackageFile(file.name);

    return {
      fileName: file.name,
      category: meta.category,
      status: "pendiente",
      progress: 0,
      message: "En espera",
    };
  });

  const emitProgress = () => {
    onProgress?.([...progressRows]);
  };

  emitProgress();

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const meta = classifyPackageFile(file.name);

    progressRows[index] = {
      ...progressRows[index],
      status: "leyendo",
      progress: 20,
      message: "Analizando archivo",
    };
    emitProgress();
    await waitForFileStep(900);

    try {
      progressRows[index] = {
        ...progressRows[index],
        status: "leyendo",
        progress: 45,
        message: "Leyendo contenido",
      };
      emitProgress();
      await waitForFileStep(850);

      const extracted = file.name.toLowerCase().endsWith(".zip")
        ? {
            extraction_status: "zip_container",
            extraction_type: "zip",
            message: "ZIP registrado. Se clasifican los archivos internos por nombre.",
          }
        : await extractFileMetadata(file);

      progressRows[index] = {
        ...progressRows[index],
        progress: 75,
        message: "Traspasando datos al consolidado",
      };
      emitProgress();
      await waitForFileStep(700);

      drafts.push({
        file_name: file.name,
        file_type: meta.type,
        file_category: meta.category,
        file_size: file.size,
        source: "direct_upload",
        raw_metadata: {
          original_file_name: file.name,
          size: file.size,
          type: file.type,
          extracted,
        },
      });

      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const innerDrafts = await extractZipFileDrafts(file);
          drafts.push(...innerDrafts);
        } catch (error) {
          drafts.push({
            file_name: `ERROR leyendo ${file.name}`,
            file_type: "error",
            file_category: "otro",
            file_size: 0,
            source: file.name,
            raw_metadata: {
              error: error instanceof Error ? error.message : "No se pudo leer ZIP.",
            },
          });
        }
      }

      progressRows[index] = {
        ...progressRows[index],
        status: "listo",
        progress: 100,
        message: "Datos incorporados al consolidado",
      };
      emitProgress();
      await waitForFileStep(250);
    } catch (error) {
      progressRows[index] = {
        ...progressRows[index],
        status: "error",
        progress: 100,
        message: error instanceof Error ? error.message : "No se pudo leer el archivo",
      };
      emitProgress();

      drafts.push({
        file_name: file.name,
        file_type: meta.type || "error",
        file_category: meta.category || "otro",
        file_size: file.size,
        source: "direct_upload",
        raw_metadata: {
          original_file_name: file.name,
          size: file.size,
          type: file.type,
          extracted: {
            extraction_status: "error",
            error: error instanceof Error ? error.message : "No se pudo leer el archivo",
          },
        },
      });
    }
  }

  return drafts;
}


function parseMoneyCandidate(value: string) {
  const raw = String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/CLP/gi, "")
    .replace(/\$/g, " ")
    .trim();

  const match = raw.match(/([0-9]{1,3}(?:[\.\s][0-9]{3})+|[0-9]{4,})/);
  if (!match?.[1]) return 0;

  const amount = Number(String(match[1]).replace(/[\.\s,]/g, ""));
  if (!Number.isFinite(amount)) return 0;

  return amount;
}

function looksLikeRutNumber(amount: number) {
  return amount >= 7000000 && amount <= 99999999;
}

function isReasonableInvoiceAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  if (looksLikeRutNumber(amount)) return false;

  return amount >= 1000 && amount <= 50000000;
}

function extractAmountNearLabel(text: string, labels: string[]) {
  const normalized = String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `${escaped}[^0-9$]{0,80}(?:CLP)?\\s*\\$?\\s*([0-9]{1,3}(?:[\\.\\s][0-9]{3})+|[0-9]{4,})`,
      "i",
    );

    const match = normalized.match(pattern);
    if (!match?.[1]) continue;

    const amount = parseMoneyCandidate(match[1]);
    if (isReasonableInvoiceAmount(amount)) return amount;
  }

  return 0;
}

function looksLikeRut(value: string) {
  return /\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]/.test(value) || /^\d{7,9}[\dkK]?$/.test(value.trim());
}

function normalizeRutFromText(value: string) {
  const rutMatch =
    value.match(/\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]/) ||
    value.match(/\b\d{7,9}[\dkK]\b/);

  if (!rutMatch) return "";

  const raw = rutMatch[0].replace(/\./g, "").replace(/-/g, "").trim();
  if (raw.length < 2) return raw;

  return `${raw.slice(0, -1)}-${raw.slice(-1).toUpperCase()}`;
}

function parseDelimitedPaymentLine(line: string) {
  const separator = line.includes(";") ? ";" : line.includes("\t") ? "\t" : line.includes(",") ? "," : "";
  if (!separator) return null;

  const parts = line
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) return null;

  const amountCandidates = parts
    .map((part, index) => ({ index, amount: parseMoneyCandidate(part), value: part }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const amount = amountCandidates[0]?.amount || 0;
  if (!amount) return null;

  const rut = parts.find(looksLikeRut) || "";
  const supplierName =
    parts
      .filter((part, index) => index !== amountCandidates[0].index)
      .filter((part) => !looksLikeRut(part))
      .filter((part) => !/^\d+$/.test(part.replace(/\s/g, "")))
      .sort((a, b) => b.length - a.length)[0] || "Beneficiario sin nombre";

  return {
    supplier_name: supplierName,
    supplier_rut: normalizeRutFromText(rut),
    payment_amount: amount,
    document_type: "Nómina Banco Chile",
    document_folio: "",
    raw_data: {
      line,
      parts,
      parser: "delimited",
    },
  };
}

function parseFixedWidthPaymentLine(line: string) {
  const amountMatches = Array.from(line.matchAll(/\d{4,}/g))
    .map((match) => ({
      value: match[0],
      index: match.index || 0,
      amount: parseMoneyCandidate(match[0]),
    }))
    .filter((item) => item.amount > 0);

  if (amountMatches.length === 0) return null;

  const amountCandidate = amountMatches[amountMatches.length - 1];
  const amount = amountCandidate.amount;

  if (!amount || amount < 1000) return null;

  const rut = normalizeRutFromText(line);

  let supplierName = line
    .replace(/\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]/g, " ")
    .replace(/\b\d{7,9}[\dkK]\b/g, " ")
    .replace(/\d{4,}/g, " ")
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ&.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (supplierName.length > 70) {
    supplierName = supplierName.slice(0, 70).trim();
  }

  if (supplierName.length < 3) {
    supplierName = "Beneficiario sin nombre";
  }

  return {
    supplier_name: supplierName,
    supplier_rut: rut,
    payment_amount: amount,
    document_type: "Nómina Banco Chile",
    document_folio: "",
    raw_data: {
      line,
      parser: "fixed_width",
    },
  };
}

function parseBchPaymentTxt(content: string) {
  const lines = content
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = lines
    .map((line, index) => {
      const delimited = parseDelimitedPaymentLine(line);
      const fallback = delimited || parseFixedWidthPaymentLine(line);

      if (!fallback) return null;

      return {
        ...fallback,
        bank_txt_row: index + 1,
      };
    })
    .filter(Boolean) as Array<{
      supplier_name: string;
      supplier_rut: string;
      payment_amount: number;
      document_type: string;
      document_folio: string;
      bank_txt_row: number;
      raw_data: Record<string, unknown>;
    }>;

  const unique = new Map<string, (typeof parsed)[number]>();

  parsed.forEach((line) => {
    const key = `${line.supplier_rut || line.supplier_name}-${line.payment_amount}-${line.bank_txt_row}`;
    unique.set(key, line);
  });

  return Array.from(unique.values());
}

async function readTextFile(file: File) {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("iso-8859-1");
  const decoded = decoder.decode(buffer);

  if (decoded.includes("�")) {
    return await file.text();
  }

  return decoded;
}


function csvEscape(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function downloadTextFile(fileName: string, content: string, mimeType = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}


function cleanCellValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function flattenExcelRows(fileName: string, category: string, sheets: Array<{ name: string; rows: Record<string, unknown>[] }>) {
  const rows: ExtractedFileRow[] = [];

  sheets.forEach((sheet) => {
    sheet.rows.slice(0, 500).forEach((row, rowIndex) => {
      Object.entries(row).forEach(([column, value]) => {
        const clean = cleanCellValue(value);
        if (!clean) return;

        rows.push({
          fileName,
          category,
          sheet: sheet.name,
          rowNumber: rowIndex + 1,
          column,
          value: clean,
        });
      });
    });
  });

  return rows;
}

function flattenTextRows(fileName: string, category: string, text: string) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({
      fileName,
      category,
      rowNumber: index + 1,
      column: "Texto",
      value: cleanCellValue(line),
    }))
    .filter((row) => row.value)
    .slice(0, 1000);
}

async function extractExcelMetadata(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (extension === "csv") {
    const rawText = await file.text();
    const text = rawText.replace(/^\ufeff/, "");
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    const delimiter = lines[0]?.includes(";") ? ";" : ",";
    const headers = (lines[0] || "")
      .split(delimiter)
      .map((header, index) => cleanCellValue(header) || `Columna ${index + 1}`);

    const rows = lines.slice(1).map((line) => {
      const values = line.split(delimiter);
      const record: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        // Importante: en CSV SII se conserva el texto original.
        // No usar conversión automática de fechas, porque 01-06-2026 debe quedar junio, no mayo.
        record[header] = cleanCellValue(values[index] || "");
      });

      return record;
    }).filter((row) => Object.values(row).some((value) => cleanCellValue(value)));

    return {
      extraction_status: "ok",
      extraction_type: "excel",
      sheet_count: 1,
      sheets: [
        {
          name: "Registro SII",
          rows: rows.slice(0, 2000),
          total_rows_read: rows.length,
        },
      ],
    };
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    raw: false,
  });

  function buildRowsFromBestHeader(sheet: any) {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    const directRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    const knownHeaders = [
      "rut",
      "rutbeneficiario",
      "rutproveedor",
      "nombre",
      "nombrerazonsocial",
      "razonsocial",
      "monto",
      "monto",
      "mediodepago",
      "fechadepago",
      "fechapago",
      "institucion",
      "banco",
      "cuenta",
      "estado",
      "motivo",
      "motivodelrechazo",
      "depuracionpormotivodelrechazo",
      "tipodoc",
      "tipocompra",
      "folio",
      "fechadocto",
      "fecharecepcion",
      "montoneto",
      "montoiva",
      "montototal",
      "rutcliente",
      "tipo_cuenta",
      "tipocuenta",
      "numero",
      "email",
    ];

    let bestHeaderIndex = -1;
    let bestScore = 0;

    matrix.slice(0, 80).forEach((row, rowIndex) => {
      const score = row.reduce<number>((count, cell) => {
        const key = normalizeColumnKey(cleanCellValue(cell));
        if (!key) return count;

        const matched = knownHeaders.some((known) => key === known || key.includes(known) || known.includes(key));

        return matched ? count + 1 : count;
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestHeaderIndex = rowIndex;
      }
    });

    if (bestHeaderIndex < 0 || bestScore < 2) {
      return directRows.slice(0, 500);
    }

    const headers = matrix[bestHeaderIndex].map((cell, index) => {
      const header = cleanCellValue(cell);
      return header || `Columna ${index + 1}`;
    });

    const rows = matrix
      .slice(bestHeaderIndex + 1)
      .map((row) => {
        const record: Record<string, unknown> = {};

        headers.forEach((header, index) => {
          record[header] = cleanCellValue(row[index]);
        });

        return record;
      })
      .filter((row) => Object.values(row).some((value) => cleanCellValue(value)));

    return rows.slice(0, 500);
  }

  const sheets = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = buildRowsFromBestHeader(sheet);

    return {
      name: sheetName,
      rows,
      total_rows_read: rows.length,
    };
  });

  return {
    extraction_status: "ok",
    extraction_type: "excel",
    sheet_count: workbook.SheetNames.length,
    sheets,
  };
}

async function extractTextMetadata(file: File) {
  const text = await readTextFile(file);

  return {
    extraction_status: "ok",
    extraction_type: "text",
    text,
    lines: text.split(/\r?\n/).length,
  };
}

async function extractPdfMetadata(file: File) {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    const pdfjs = (pdfjsLib as any).default || pdfjsLib;

    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pageTexts: Array<{ page: number; text: string }> = [];

    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 20); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: { str?: string }) => item.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pageTexts.push({ page: pageNumber, text });
    }

    const fullText = pageTexts.map((page) => `Página ${page.page}: ${page.text}`).join("\n");

    return {
      extraction_status: "ok",
      extraction_type: "pdf",
      pages: pdf.numPages,
      text: fullText,
      full_text: fullText,
      page_texts: pageTexts,
    };
  } catch (error) {
    return {
      extraction_status: "error",
      extraction_type: "pdf",
      error: error instanceof Error ? error.message : "No se pudo leer el PDF.",
    };
  }
}

async function extractFileMetadata(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (["xlsx", "xls", "xlsm", "csv"].includes(extension)) {
    return extractExcelMetadata(file);
  }

  if (extension === "txt") {
    return extractTextMetadata(file);
  }

  if (extension === "pdf") {
    return extractPdfMetadata(file);
  }

  return {
    extraction_status: "not_supported",
    extraction_type: extension || "unknown",
    message: "Archivo registrado, pero sin extracción de contenido en esta versión.",
  };
}


function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, " ").trim();
  }

  return "";
}

function findDocumentFolio(fileName: string, text: string) {
  const fromFile = fileName.match(/(?:F-|F\s*)(\d{3,})/i) || fileName.match(/(?:N-C|NC|NOTA\s*CREDITO)[^0-9]*(\d{2,})/i);
  if (fromFile?.[1]) return fromFile[1];

  return findFirstMatch(text, [
    /Folio\s*:?\s*([0-9]{2,})/i,
    /N[°º]\s*:?\s*([0-9]{2,})/i,
    /Factura\s+(?:Electr[oó]nica\s*)?(?:N[°º]\s*)?([0-9]{2,})/i,
    /Nota\s+de\s+Cr[eé]dito\s+(?:Electr[oó]nica\s*)?(?:N[°º]\s*)?([0-9]{2,})/i,
  ]);
}

function findCompanyName(text: string, fileName = "") {
  const source = normalizeText(`${text} ${fileName}`);
  const siiSociety = getSiiSocietyFromFileName(fileName);

  if (siiSociety && siiSociety !== "Sociedad SII por confirmar") return siiSociety;
  if (source.includes("pumay sa") || source.includes("pumay s a")) return "Pumay S.A.";
  if (source.includes("pumay")) return "Pumay";

  return "Por definir";
}

function findSupplierName(fileName: string, text: string) {
  const candidates = [
    findFirstMatch(text, [
      /Señor\(es\)\s*:?\s*([^\n\r]{3,80})/i,
      /Senor\(es\)\s*:?\s*([^\n\r]{3,80})/i,
      /Raz[oó]n\s+Social\s*:?\s*([^\n\r]{3,80})/i,
      /Proveedor\s*:?\s*([^\n\r]{3,80})/i,
      /Nombre\s*:?\s*([^\n\r]{3,80})/i,
    ]),
  ].filter(Boolean);

  if (candidates[0]) return candidates[0];

  const cleaned = fileName
    .replace(/\.pdf|\.xlsx|\.xls|\.csv|\.txt/gi, "")
    .replace(/^(F-|NC|N-C|NOTA\s*CREDITO)[-_\s]*/i, "")
    .replace(/[0-9]{3,}/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Proveedor por revisar";
}

function findBestRut(text: string) {
  return normalizeRutFromText(text);
}

function findBestDate(text: string, labels: string[]) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}[^0-9]*(\\d{1,2}[-/]\\d{1,2}[-/]\\d{2,4})`, "i");
    const match = text.match(pattern);
    if (match?.[1]) return normalizeDateCandidate(match[1]);
  }

  const generic = text.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/);
  return generic?.[1] ? normalizeDateCandidate(generic[1]) : null;
}

function normalizeDateCandidate(value: string) {
  const parts = value.replace(/\//g, "-").split("-").map((part) => part.padStart(2, "0"));
  if (parts.length !== 3) return null;

  const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
  return `${year}-${parts[1]}-${parts[0]}`;
}

function findBestAmount(text: string) {
  const totalAmount = extractAmountNearLabel(text, [
    "MONTO TOTAL",
    "TOTAL A PAGAR",
    "TOTAL FACTURA",
    "TOTAL DOCUMENTO",
    "TOTAL",
  ]);

  if (totalAmount > 0) return totalAmount;

  const normalized = String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const candidates = Array.from(
    normalized.matchAll(/(?:CLP\s*|\$\s*)([0-9]{1,3}(?:[\.\s][0-9]{3})+|[0-9]{4,})/gi),
  )
    .map((match) => parseMoneyCandidate(match[1]))
    .filter(isReasonableInvoiceAmount)
    .sort((a, b) => b - a);

  return candidates[0] || 0;
}

function findNetAmount(text: string, totalAmount: number) {
  const netAmount = extractAmountNearLabel(text, [
    "MONTO NETO",
    "NETO",
    "VALOR NETO",
  ]);

  if (netAmount > 0) return netAmount;
  if (totalAmount > 0) return estimateNetAmount(totalAmount);

  return 0;
}

function extractTextFromDraft(draft: PackageFileDraft) {
  const extracted = (draft.raw_metadata?.extracted || {}) as Record<string, any>;

  if (extracted.extraction_type === "pdf") {
    return String(extracted.full_text || extracted.text || "");
  }

  if (extracted.extraction_type === "text") {
    return String(extracted.text || "");
  }

  if (extracted.extraction_type === "excel") {
    const sheets = (extracted.sheets || []) as Array<{ name: string; rows: Record<string, unknown>[] }>;
    return sheets
      .flatMap((sheet) => sheet.rows.map((row) => Object.values(row).map(cleanCellValue).join(" ")))
      .join("\n");
  }

  return "";
}


function normalizeColumnKey(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function getRowValue(row: Record<string, unknown>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeColumnKey).filter(Boolean);
  const entries = Object.entries(row);

  const exactEntry = entries.find(([key]) => normalizedAliases.includes(normalizeColumnKey(key)));

  if (exactEntry) return cleanCellValue(exactEntry[1]);

  const fuzzyEntry = entries.find(([key]) => {
    const normalizedKey = normalizeColumnKey(key);

    if (!normalizedKey) return false;

    return normalizedAliases.some((alias) => {
      if (!alias || alias.length < 4) return false;

      return normalizedKey.includes(alias) || alias.includes(normalizedKey);
    });
  });

  return fuzzyEntry ? cleanCellValue(fuzzyEntry[1]) : "";
}

function getRowAmount(row: Record<string, unknown>, aliases: string[], rutValue = "") {
  const value = getRowValue(row, aliases);
  if (!value) return 0;

  const directNumber = Number(String(value).replace(/\./g, "").replace(/,/g, "."));
  const amount = Number.isFinite(directNumber) && directNumber > 0 ? Math.round(directNumber) : parseMoneyCandidate(value);
  const rutNumber = normalizeRutNumberOnly(rutValue).replace(/[kK]$/, "");

  if (!amount) return 0;

  // Si el monto viene desde una columna explícita de monto, se acepta aunque sea alto,
  // pero nunca si coincide con el RUT de la misma fila.
  if (rutNumber && String(Math.round(amount)).includes(rutNumber)) return 0;

  return amount;
}

function isValidIsoDateParts(year: string, month: string, day: string) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (!y || y < 1900 || y > 2100) return false;
  if (!m || m < 1 || m > 12) return false;
  if (!d || d < 1 || d > 31) return false;

  const date = new Date(Date.UTC(y, m - 1, d));

  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function buildIsoDate(year: string, month: string, day: string) {
  const normalizedYear = year.length === 2 ? `20${year}` : year;
  const normalizedMonth = month.padStart(2, "0");
  const normalizedDay = day.padStart(2, "0");

  return isValidIsoDateParts(normalizedYear, normalizedMonth, normalizedDay)
    ? `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
    : null;
}

function normalizeDateForDb(value?: string | null) {
  const raw = cleanCellValue(value || "");
  if (!raw) return null;

  const iso = raw.match(/^\s*(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s*$/);
  if (iso) {
    const direct = buildIsoDate(iso[1], iso[2], iso[3]);
    if (direct) return direct;

    // Corrige casos ingresados como 2026-19-06, que realmente son 19-06-2026.
    const yearDayMonth = buildIsoDate(iso[1], iso[3], iso[2]);
    if (yearDayMonth) return yearDayMonth;
  }

  const dmy = raw.match(/^\s*(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\s*$/);
  if (dmy) return buildIsoDate(dmy[3], dmy[2], dmy[1]);

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return null;
}

function toIsoDateFromCell(value: string) {
  return normalizeDateForDb(value);
}

function getExcelSheetsFromDraft(draft: PackageFileDraft) {
  const extracted = (draft.raw_metadata?.extracted || {}) as Record<string, any>;

  if (extracted.extraction_type !== "excel") return [];

  return (extracted.sheets || []) as Array<{
    name: string;
    rows: Record<string, unknown>[];
  }>;
}


function isSiiRcvRow(row: Record<string, unknown>) {
  const tipoDoc = getStructuredDocumentType(row);
  const rutProveedor = getStructuredRut(row);
  const razonSocial = getStructuredSupplier(row);
  const folio = getStructuredFolio(row);
  const hasAmountColumn =
    getRowValue(row, ["Monto Total", "Monto total", "Total"]) ||
    getRowValue(row, ["Monto Neto", "Monto neto"]) ||
    getRowValue(row, ["Monto Exento", "Monto exento"]) ||
    getRowValue(row, ["Monto IVA Recuperable", "Monto IVA Rec", "IVA Recuperable", "IVA"]);

  return Boolean(tipoDoc && rutProveedor && razonSocial && folio && hasAmountColumn);
}

function getSiiDocumentCode(row: Record<string, unknown>) {
  const raw = String(
    getRowValue(row, ["Tipo Doc", "Tipo Documento", "Tipo DTE", "Tipo de documento", "Tipo documento", "Documento"]) || "",
  ).trim();

  const parenthesesCode = raw.match(/\((\d{1,3})\)/);
  if (parenthesesCode?.[1]) return parenthesesCode[1];

  const leadingCode = raw.match(/^\s*(\d{1,3})\b/);
  if (leadingCode?.[1]) return leadingCode[1];

  return raw;
}

function isSupportedSiiPaymentDocument(row: Record<string, unknown>) {
  const code = getSiiDocumentCode(row);
  const typeText = normalizeText(
    getRowValue(row, ["Tipo Doc", "Tipo Documento", "Tipo DTE", "Tipo de documento", "Tipo documento", "Documento"]) || "",
  );

  if (["33", "34", "46", "56", "61"].includes(code)) return true;

  return (
    typeText.includes("factura electronica") ||
    typeText.includes("factura exenta") ||
    typeText.includes("factura de compra") ||
    typeText.includes("nota de credito") ||
    typeText.includes("nota de debito")
  );
}

function isSiiCreditNoteRow(row: Record<string, unknown>) {
  const code = getSiiDocumentCode(row);
  const typeText = normalizeText(
    getRowValue(row, ["Tipo Doc", "Tipo Documento", "Tipo DTE", "Tipo de documento", "Tipo documento", "Documento"]) || "",
  );

  return code === "61" || typeText.includes("nota de credito");
}

function getSignedSiiPaymentTotal(row: Record<string, unknown>, rutValue = "") {
  const amount = getSiiPaymentTotal(row, rutValue);

  if (!amount) return 0;

  return isSiiCreditNoteRow(row) ? -Math.abs(amount) : amount;
}

function isLineCreditNote(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  const code = normalizeText(String(raw.sii_tipo_doc || ""));
  const type = normalizeText(line.document_type || "");

  return code === "61" || type.includes("nota de credito");
}

function getStructuredSupplier(row: Record<string, unknown>) {
  return getRowValue(row, [
    "Proveedor",
    "Razón Social",
    "Razon Social",
    "Razon Social Proveedor",
    "Razón Social Proveedor",
    "Nombre Beneficiario",
    "Nombre / Razón social",
    "Nombre / Razon social",
  ]);
}

function getStructuredRut(row: Record<string, unknown>) {
  return getRowValue(row, [
    "Rut",
    "RUT",
    "Rut Proveedor",
    "RUT proveedor",
    "RUT Proveedor",
    "RUT Proveed",
    "Rut Proveed",
    "RUT Beneficiario",
    "RUT_BENEFICIARIO",
  ]);
}

function getStructuredFolio(row: Record<string, unknown>) {
  return getRowValue(row, [
    "Número de factura",
    "Numero de factura",
    "Número factura",
    "Numero factura",
    "Folio",
    "N° Factura",
    "Nro Factura",
    "Factura",
  ]);
}

function getStructuredDocumentType(row: Record<string, unknown>) {
  return getRowValue(row, [
    "Tipo de documento",
    "Tipo documento",
    "Tipo Doc",
    "Tipo Documento",
    "Tipo DTE",
    "Documento",
  ]);
}

function getSiiPaymentTotal(row: Record<string, unknown>, rutValue = "") {
  const totalAmount = getRowAmount(row, ["Monto total", "Monto Total", "Total", "Total factura", "Monto Factura"], rutValue);

  if (totalAmount > 0) return totalAmount;

  const netAmount = getRowAmount(row, ["Monto neto", "Monto Neto", "Neto"], rutValue);
  const ivaAmount = getRowAmount(row, ["Monto IVA Recuperable", "Monto IVA Rec", "IVA Recuperable", "IVA"], rutValue);
  const exemptAmount = getRowAmount(row, ["Monto Exento", "Monto exento"], rutValue);
  const composedAmount = netAmount + ivaAmount + exemptAmount;

  return composedAmount > 0 ? composedAmount : 0;
}

function isBankStatementRow(row: Record<string, unknown>) {
  const status = getRowValue(row, ["Estado", "Status", "Estatus"]);
  const paymentDate = getRowValue(row, ["Fecha de Pago", "Fecha Pago", "Fecha movimiento", "Fecha Transferencia"]);
  const paymentMethod = getRowValue(row, ["Medio de Pago", "Medio Pago", "Tipo Pago", "Tipo de Pago"]);
  const bank = getRowValue(row, ["Institución", "Institucion", "Banco", "Banco destino"]);
  const account = getRowValue(row, ["Cuenta", "Cuenta destino", "Cuenta bancaria", "N° Cuenta", "Nro Cuenta", "Número Cuenta", "Numero Cuenta"]);
  const amount = getStatementAmount(row);
  const beneficiary = getStatementDescription(row);
  const rut = getRowValue(row, ["Rut", "RUT", "RUT Beneficiario", "RUT_BENEFICIARIO", "Rut proveedor"]);

  return Boolean(amount > 0 && (status || paymentDate || paymentMethod) && (bank || account) && (beneficiary || rut));
}

function isBankStatementDraft(draft: PackageFileDraft) {
  if (draft.file_category === "cuentas_bancarias") return false;
  if (["banco_chile_macro", "banco_chile_txt", "cartola_pagos", "cartola"].includes(draft.file_category)) return true;

  return getExcelSheetsFromDraft(draft).some((sheet) =>
    sheet.rows.some((row) => isBankStatementRow(row)),
  );
}

function getSiiDocumentType(row: Record<string, unknown>) {
  const tipoDoc = getRowValue(row, ["Tipo Doc", "Tipo Documento", "Tipo DTE"]);
  const code = String(tipoDoc || "").trim();

  if (code === "33") return "Factura Electrónica (33)";
  if (code === "34") return "Factura Exenta Electrónica (34)";
  if (code === "46") return "Factura de Compra Electrónica (46)";
  if (code === "56") return "Nota de Débito Electrónica (56)";
  if (code === "61") return "Nota de Crédito Electrónica (61)";

  return code ? `Documento SII (${code})` : "Documento SII";
}

function inferCompanyFromSiiFile(fileName: string) {
  return getSiiSocietyFromFileName(fileName);
}

function getSiiArticle(row: Record<string, unknown>) {
  const tipoCompra = getRowValue(row, ["Tipo Compra"]);
  const tipoDoc = getSiiDocumentType(row);
  const exento = getRowAmount(row, ["Monto Exento"], "");
  const neto = getRowAmount(row, ["Monto Neto"], "");
  const iva = getRowAmount(row, ["Monto IVA Recuperable", "Monto IVA Rec", "IVA Recuperable"], "");

  return [
    "Registro de compras SII",
    tipoDoc,
    tipoCompra ? `Tipo compra: ${tipoCompra}` : "",
    exento > 0 ? `Exento: ${exento}` : "",
    neto > 0 ? `Neto: ${neto}` : "",
    iva > 0 ? `IVA: ${iva}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function rowLooksLikeInvoice(row: Record<string, unknown>) {
  if (isBankStatementRow(row)) return false;

  const supplier = getStructuredSupplier(row);
  const rut = getStructuredRut(row);
  const folio = getStructuredFolio(row);
  const documentType = normalizeText(getStructuredDocumentType(row));
  const rutValue = rut || "";

  const hasValidDocumentType =
    isSupportedSiiPaymentDocument(row) ||
    documentType.includes("factura") ||
    documentType.includes("nota de credito") ||
    documentType.includes("nota de debito");

  const amount = getSiiPaymentTotal(row, rutValue);

  if (isSiiRcvRow(row)) return Boolean(hasValidDocumentType && supplier && rut && folio && amount > 0);

  return Boolean(hasValidDocumentType && (supplier || rut) && folio && amount > 0);
}

function buildBankAccountMap(drafts: PackageFileDraft[], masterAccounts: SupplierBankAccount[] = []) {
  const map = new Map<string, {
    bank: string;
    accountType: string;
    accountNumber: string;
    email: string;
  }>();

  masterAccounts
    .filter((account) => account.active !== false)
    .forEach((account) => {
      const value = {
        bank: account.bank || "",
        accountType: account.account_type || "",
        accountNumber: account.account_number || "",
        email: account.beneficiary_email || "",
      };

      if (account.supplier_rut) map.set(normalizeRutNumberOnly(account.supplier_rut), value);
      if (account.supplier_name) map.set(normalizeText(account.supplier_name), value);
    });

  drafts
    .filter((draft) => draft.file_category === "cuentas_bancarias")
    .forEach((draft) => {
      getExcelSheetsFromDraft(draft).forEach((sheet) => {
        sheet.rows.forEach((row) => {
          const rut = getRowValue(row, ["RUT_BENEFICIARIO", "Rut Beneficiario", "RUT Beneficiario", "Rut", "RUT", "Rut proveedor", "RUT proveedor", "RUT Proveedor", "RUT Proveed", "Rut Proveed"]);
          const supplier = getRowValue(row, ["NOMBRE", "Nombre", "Proveedor", "Razón Social", "Razon Social", "Razon Social Proveedor", "Razón Social Proveedor", "Nombre Beneficiario"]);
          const bank = getRowValue(row, ["BANCO", "Banco", "Banco proveedor", "Nombre Banco"]);
          const accountType = getRowValue(row, ["TIPO_CUENTA", "Tipo Cuenta", "Tipo cuenta", "Tipo de cuenta", "Cuenta tipo", "Medio de Pago"]);
          const accountNumber = getRowValue(row, ["NUMERO", "Número", "Numero", "Cuenta Corriente", "Cuenta corriente o vista", "N° cuenta", "Numero cuenta", "Número cuenta", "Cuenta", "Cuenta Bancaria"]);
          const email = getRowValue(row, ["EMAIL", "Email", "Correo", "Email proveedor", "Email Beneficiario"]);

          const account = { bank, accountType, accountNumber, email };

          if (rut) map.set(normalizeRutNumberOnly(rut), account);
          if (supplier) map.set(normalizeText(supplier), account);
        });
      });
    });

  return map;
}

function findBankAccountForLine(
  bankMap: Map<string, { bank: string; accountType: string; accountNumber: string; email: string }>,
  rut: string,
  supplier: string,
) {
  return bankMap.get(normalizeRutNumberOnly(rut)) || bankMap.get(normalizeText(supplier)) || null;
}

function normalizeDigitsOnly(value?: string | null) {
  return String(value || "").replace(/\D+/g, "").replace(/^0+/, "");
}

type BankStatementMovement = {
  date: string | null;
  description: string;
  amount: number;
  rut: string;
  document: string;
  bank: string;
  accountNumber: string;
  status: string;
  rejectionReason: string;
  sourceFile: string;
  sourceRowNumber?: number | null;
  paymentMethod?: string;
  rawRow?: Record<string, unknown> | null;
};

function parseBankStatementAmountFromLine(line: string) {
  const cleaned = String(line || "")
    .replace(/\u00a0/g, " ")
    .replace(/CLP/gi, " ")
    .replace(/\$/g, " ");

  const candidates = Array.from(cleaned.matchAll(/(?:^|[^\d])([0-9]{1,3}(?:[.\s][0-9]{3})+|[0-9]{4,})(?:[^\d]|$)/g))
    .map((match) => parseMoneyCandidate(match[1]))
    .filter((amount) => amount >= 1000 && amount <= 50000000);

  if (candidates.length === 0) return 0;

  // En cartolas/TXT Banco Chile el monto suele venir al final de la línea.
  return candidates[candidates.length - 1] || 0;
}

function extractTextStatementMovementFromLine(line: string, sourceFile: string): BankStatementMovement | null {
  const amount = parseBankStatementAmountFromLine(line);
  const cleaned = String(line || "").trim();

  if (!amount || cleaned.length < 3) return null;

  const cells = cleaned
    .split(/\t|;|\|/)
    .map((cell) => cell.trim())
    .filter(Boolean);

  const statusCandidate = cells.find((cell) => /efectuad|pagad|rechaz|pendient|proceso/i.test(cell)) || "";
  const rejectionCandidate = cells.find((cell) => /rechaz|inval|invál|error|motivo|cuenta|rut/i.test(cell)) || "";

  return {
    date: parseDateFromPdf(cleaned),
    description: cells.length > 1 ? cells.join(" ") : cleaned,
    amount,
    rut: normalizeRutFromText(cleaned),
    document: firstMatchValue(cleaned, [/\b(?:F-|FAC|Factura|Nro|N°)?\s*([0-9]{3,})\b/i]),
    bank: firstMatchValue(cleaned, [/\b(BANCO\s+[A-ZÁÉÍÓÚÑ ]{3,40}|BCI|SANTANDER|SCOTIABANK|ITAU|ITAÚ|BANCOESTADO|ESTADO)\b/i]),
    accountNumber: firstMatchValue(cleaned, [/\b(?:cuenta|cta|ctacte|corriente|vista)[^\d]{0,20}([0-9]{5,20})\b/i]),
    status: statusCandidate,
    rejectionReason: rejectionCandidate,
    sourceFile,
  };
}

function getStatementDescription(row: Record<string, unknown>) {
  return getRowValue(row, [
    "Nombre / Razón social",
    "Nombre / Razon social",
    "Razón Social",
    "Razon Social",
    "Nombre",
    "Beneficiario",
    "Proveedor",
    "Glosa",
    "Descripción",
    "Descripcion",
    "Detalle",
    "Referencia",
    "Movimiento",
    "Concepto",
  ]);
}

function getStatementAmount(row: Record<string, unknown>) {
  const entries = Object.entries(row);

  const explicitAmountEntry = entries.find(([key]) => {
    const normalizedKey = normalizeColumnKey(key);

    return (
      normalizedKey.includes("monto") ||
      normalizedKey.includes("importe") ||
      normalizedKey === "cargo" ||
      normalizedKey === "abono" ||
      normalizedKey === "debe" ||
      normalizedKey === "haber" ||
      normalizedKey === "valor"
    );
  });

  if (explicitAmountEntry) {
    const amount = parseMoneyCandidate(cleanCellValue(explicitAmountEntry[1]));

    if (amount) return Math.abs(Number(amount || 0));
  }

  const amount = getRowAmount(row, [
    "Monto($)",
    "Monto",
    "Monto Pagado",
    "Monto Total",
    "Cargo",
    "Abono",
    "Valor",
    "Importe",
    "Debe",
    "Haber",
    "Monto Transferencia",
    "Valor Transferencia",
  ]);

  if (amount) return Math.abs(Number(amount || 0));

  const rowText = Object.values(row).map(cleanCellValue).join(" ");
  return Math.abs(Number(parseBankStatementAmountFromLine(rowText) || 0));
}

function getStatementBank(row: Record<string, unknown>) {
  return getRowValue(row, ["Institución", "Institucion", "Banco", "Banco destino"]);
}

function getStatementAccount(row: Record<string, unknown>) {
  return getRowValue(row, [
    "Cuenta",
    "Cuenta destino",
    "Cuenta bancaria",
    "N° Cuenta",
    "Nro Cuenta",
    "Número Cuenta",
    "Numero Cuenta",
  ]);
}

function getStatementStatus(row: Record<string, unknown>) {
  return getRowValue(row, ["Estado", "Status", "Estatus"]);
}

function getStatementRejectionReason(row: Record<string, unknown>) {
  return getRowValue(row, [
    "Motivo del rechazo",
    "Motivo rechazo",
    "Observación rechazo",
    "Observacion rechazo",
    "Depuración por rechazo",
    "Depuracion por rechazo",
  ]);
}

function extractBankStatementMovementsFromDraft(draft: PackageFileDraft): BankStatementMovement[] {
  const movements: BankStatementMovement[] = [];

  getExcelSheetsFromDraft(draft).forEach((sheet) => {
    sheet.rows.forEach((row, rowIndex) => {
      const amount = getStatementAmount(row);
      const description = getStatementDescription(row);
      const rut = getRowValue(row, ["Rut", "RUT", "RUT Beneficiario", "RUT_BENEFICIARIO", "Rut proveedor"]);
      const document = getRowValue(row, ["Folio", "Documento", "Nro Documento", "N° Documento", "Numero documento", "Factura"]);
      const date = toIsoDateFromCell(getRowValue(row, ["Fecha", "Fecha Pago", "Fecha de Pago", "Fecha movimiento", "Fecha Transferencia", "Fecha Abono", "Fecha Cargo", "Fecha Contable"]));
      const bank = getStatementBank(row);
      const accountNumber = getStatementAccount(row);
      const status = getStatementStatus(row);
      const rejectionReason = getStatementRejectionReason(row);
      const paymentMethod = getRowValue(row, ["Medio de Pago", "Medio Pago", "Tipo Pago", "Tipo de Pago"]);

      if (!amount || (!description && !rut && !document && !accountNumber)) return;

      movements.push({
        date,
        description,
        amount,
        rut,
        document,
        bank,
        accountNumber,
        status,
        rejectionReason,
        sourceFile: draft.file_name,
        sourceRowNumber: rowIndex + 1,
        paymentMethod,
        rawRow: row,
      });
    });
  });

  const extracted = (draft.raw_metadata?.extracted || {}) as Record<string, any>;
  const text = String(extracted.text || extracted.full_text || "");

  if (movements.length === 0 && text) {
    text.split(/\r?\n/).forEach((line) => {
      const movement = extractTextStatementMovementFromLine(line, draft.file_name);

      if (movement) movements.push(movement);
    });
  }

  return movements;
}

function normalizePaymentStatusFromMovement(movement: BankStatementMovement, score: number) {
  const statusText = normalizeText(`${movement.status} ${movement.rejectionReason}`);

  if (statusText.includes("rechaz")) return "rechazado";
  if (statusText.includes("pendiente") || statusText.includes("proceso") || statusText.includes("por revisar")) return "pendiente";
  if (statusText.includes("abono efectuado") || statusText.includes("pagado") || statusText.includes("efectuado")) {
    return score >= 80 ? "pagado_cartola" : "pendiente";
  }

  if (score >= 82) return "pagado_cartola";

  return score >= 85 ? "pagado_cartola" : "pendiente";
}

function suggestPaymentSolution(paymentStatus: string, reason: string) {
  const normalized = normalizeText(reason);

  if (paymentStatus === "pagado_cartola") {
    return "Sin acción pendiente. Solo revisar si el resto de los datos está correcto.";
  }

  if (paymentStatus === "rechazado") {
    if (normalized.includes("cuenta") && (normalized.includes("no valida") || normalized.includes("invalida") || normalized.includes("inválida"))) {
      return "Corregir la cuenta bancaria del proveedor en el maestro y volver a ejecutar el pago.";
    }

    if (normalized.includes("rut")) {
      return "Revisar el RUT del beneficiario y volver a cargar la cuenta correcta.";
    }

    return "Revisar el motivo de rechazo, corregir los datos bancarios del proveedor y reprocesar el pago.";
  }

  if (paymentStatus === "pendiente") {
    return "Revisar la cartola y validar manualmente si el pago quedó en proceso o si corresponde volver a cargar una cartola actualizada.";
  }

  return "Verificar si el pago fue ejecutado desde otra cuenta o si aún no ha sido procesado por banco.";
}

function scorePaymentMatch(line: PaymentPackageLine, movement: BankStatementMovement) {
  const amount = getSafeLineAmount(line);
  if (!amount || amount !== movement.amount) return 0;

  let score = 50;
  const lineRut = normalizeRutNumberOnly(line.supplier_rut || "");
  const movementRut = normalizeRutNumberOnly(movement.rut || "");
  const desc = normalizeText(`${movement.description} ${movement.document}`);
  const supplier = normalizeText(line.supplier_name || "");
  const folio = normalizeText(line.document_folio || "");
  const lineAccount = normalizeDigitsOnly(line.supplier_account_number || "");
  const movementAccount = normalizeDigitsOnly(movement.accountNumber || "");
  const lineBank = normalizeText(line.supplier_bank || "");
  const movementBank = normalizeText(movement.bank || "");

  if (lineRut && movementRut && lineRut === movementRut) score += 40;
  if (lineAccount && movementAccount && lineAccount === movementAccount) score += 35;
  if (folio && desc.includes(folio)) score += 20;
  if (lineBank && movementBank && (lineBank.includes(movementBank) || movementBank.includes(lineBank))) score += 10;

  const supplierTokens = supplier
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 6);

  const supplierMatches = supplierTokens.filter((token) => desc.includes(token)).length;

  if (supplierMatches >= 2) score += 30;
  else if (supplierMatches === 1) score += 18;

  return Math.min(score, 100);
}

function buildPaymentMatchDetail(movement: BankStatementMovement, score: number) {
  const parts = [
    `Cartola: ${movement.sourceFile}`,
    movement.date ? `fecha ${formatDate(movement.date)}` : "",
    `monto ${formatMoney(movement.amount)}`,
    movement.bank ? `banco ${movement.bank}` : "",
    movement.accountNumber ? `cuenta ${movement.accountNumber}` : "",
    movement.status ? `estado ${movement.status}` : "",
    movement.rejectionReason ? `motivo ${movement.rejectionReason}` : "",
    movement.description ? `glosa ${movement.description.slice(0, 80)}` : "",
    `confianza ${score}%`,
  ];

  return parts.filter(Boolean).join(" · ");
}

function findUniqueAmountFallbackMatch(
  line: PaymentPackageLine,
  lineIndex: number,
  lines: PaymentPackageLine[],
  movements: BankStatementMovement[],
  usedMovementIndexes: Set<number>,
) {
  const lineAmount = getSafeLineAmount(line);

  if (!lineAmount) {
    return {
      index: -1,
      movement: null as BankStatementMovement | null,
      score: 0,
    };
  }

  const sameAmountLines = lines.filter((candidate) => getSafeLineAmount(candidate) === lineAmount);
  const sameAmountMovements = movements
    .map((movement, index) => ({ movement, index }))
    .filter((item) => !usedMovementIndexes.has(item.index) && item.movement.amount === lineAmount);

  // Si el monto aparece una sola vez en facturas y una sola vez en cartola, es una coincidencia segura.
  // Este caso cubre Banco Chile cuando Excel entrega encabezados o glosas incompletas, pero el monto es exacto.
  if (sameAmountLines.length === 1 && sameAmountMovements.length === 1) {
    return {
      index: sameAmountMovements[0].index,
      movement: sameAmountMovements[0].movement,
      score: 82,
    };
  }

  const lineAccount = normalizeDigitsOnly(line.supplier_account_number || "");
  const lineRut = normalizeRutNumberOnly(line.supplier_rut || "");

  const accountOrRutMatch = sameAmountMovements.find(({ movement }) => {
    const movementAccount = normalizeDigitsOnly(movement.accountNumber || "");
    const movementRut = normalizeRutNumberOnly(movement.rut || "");

    return (
      Boolean(lineAccount && movementAccount && lineAccount === movementAccount) ||
      Boolean(lineRut && movementRut && lineRut === movementRut)
    );
  });

  if (accountOrRutMatch) {
    return {
      index: accountOrRutMatch.index,
      movement: accountOrRutMatch.movement,
      score: 90,
    };
  }

  return {
    index: -1,
    movement: null as BankStatementMovement | null,
    score: 0,
  };
}

function statementMovementToDbPayload(
  movement: BankStatementMovement,
  packageId: number,
  organizationId: number,
  fileId: number | null,
) {
  return {
    package_id: packageId,
    file_id: fileId,
    organization_id: organizationId,
    source_file_name: movement.sourceFile,
    source_row_number: movement.sourceRowNumber || null,
    beneficiary_rut: movement.rut || null,
    beneficiary_name: movement.description || null,
    amount: Number(movement.amount || 0),
    payment_method: movement.paymentMethod || null,
    payment_date: movement.date || null,
    bank_name: movement.bank || null,
    account_number: movement.accountNumber || null,
    bank_status: movement.status || null,
    rejection_reason: movement.rejectionReason || null,
    match_status: "sin_cruzar",
    matched_line_id: null,
    match_score: null,
    raw_row: movement.rawRow || null,
  };
}

function dbMovementToStatementMovement(movement: PaymentPackageBankMovement): BankStatementMovement {
  return {
    date: movement.payment_date,
    description: movement.beneficiary_name || "",
    amount: Number(movement.amount || 0),
    rut: movement.beneficiary_rut || "",
    document: "",
    bank: movement.bank_name || "",
    accountNumber: movement.account_number || "",
    status: movement.bank_status || "",
    rejectionReason: movement.rejection_reason || "",
    sourceFile: movement.source_file_name || "Cartola bancaria",
    sourceRowNumber: movement.source_row_number,
    paymentMethod: movement.payment_method || "",
    rawRow: movement.raw_row || null,
  };
}

function buildPaymentHistoryDedupeKey(movement: BankStatementMovement) {
  const rut = normalizeRutNumberOnly(movement.rut || "");
  const account = normalizeDigitsOnly(movement.accountNumber || "");
  const amount = Math.round(Number(movement.amount || 0));
  const date = movement.date || "sin_fecha";
  const status = normalizeText(movement.status || "");
  const bank = normalizeText(movement.bank || "");
  const name = normalizeText(movement.description || "").slice(0, 80);

  return [rut || name, amount, date, account || bank, status].join("|");
}

function statementMovementToHistoryPayload(
  movement: BankStatementMovement,
  organizationId: number,
  packageId: number | null,
  fileId: number | null,
  createdByName: string,
  createdByEmail: string,
) {
  return {
    organization_id: organizationId,
    package_id: packageId,
    file_id: fileId,
    dedupe_key: buildPaymentHistoryDedupeKey(movement),
    source_file_name: movement.sourceFile || null,
    source_row_number: movement.sourceRowNumber || null,
    beneficiary_rut: movement.rut || null,
    beneficiary_name: movement.description || null,
    amount: Number(movement.amount || 0),
    payment_method: movement.paymentMethod || null,
    payment_date: movement.date || null,
    bank_name: movement.bank || null,
    account_number: movement.accountNumber || null,
    bank_status: movement.status || null,
    rejection_reason: movement.rejectionReason || null,
    raw_row: movement.rawRow || null,
    created_by_name: createdByName || null,
    created_by_email: createdByEmail || null,
  };
}

function historyMovementToStatementMovement(movement: PaymentBankHistoryMovement): BankStatementMovement {
  return {
    date: movement.payment_date,
    description: movement.beneficiary_name || "",
    amount: Number(movement.amount || 0),
    rut: movement.beneficiary_rut || "",
    document: "",
    bank: movement.bank_name || "",
    accountNumber: movement.account_number || "",
    status: movement.bank_status || "",
    rejectionReason: movement.rejection_reason || "",
    sourceFile: movement.source_file_name ? `Histórico · ${movement.source_file_name}` : "Histórico nómina bancaria",
    sourceRowNumber: movement.source_row_number || null,
    paymentMethod: movement.payment_method || "",
    rawRow: movement.raw_row || null,
  };
}

function mergeStatementMovements(primary: BankStatementMovement[], historical: BankStatementMovement[]) {
  const seen = new Set<string>();
  const merged: BankStatementMovement[] = [];

  [...primary, ...historical].forEach((movement) => {
    const key = buildPaymentHistoryDedupeKey(movement);

    if (seen.has(key)) return;

    seen.add(key);
    merged.push(movement);
  });

  return merged;
}

async function upsertPaymentHistoryMovements(
  movements: BankStatementMovement[],
  organizationId: number,
  packageId: number | null,
  fileId: number | null,
  createdByName: string,
  createdByEmail: string,
) {
  const payload = movements
    .filter((movement) => Number(movement.amount || 0) > 0)
    .map((movement) =>
      statementMovementToHistoryPayload(
        movement,
        organizationId,
        packageId,
        fileId,
        createdByName,
        createdByEmail,
      ),
    );

  if (payload.length === 0) return;

  const { error } = await supabase
    .from("payment_bank_history")
    .upsert(payload, { onConflict: "organization_id,dedupe_key" });

  if (error) throw error;
}

async function loadPaymentHistoryStatementMovements(organizationId: number) {
  const { data, error } = await supabase
    .from("payment_bank_history")
    .select("*")
    .eq("organization_id", organizationId)
    .order("payment_date", { ascending: false })
    .limit(5000);

  if (error) throw error;

  return ((data || []) as PaymentBankHistoryMovement[]).map(historyMovementToStatementMovement);
}

function buildBankMovementMatchPatch(line: PaymentPackageLine, movement: BankStatementMovement | null, score: number, sourceFile: string) {
  const currentRaw = (line.raw_data || {}) as Record<string, unknown>;

  let paymentStatus = "no_pagado";
  let paymentReason = "No se encontró este pago en la cartola cargada.";
  let paymentSolution = suggestPaymentSolution(paymentStatus, paymentReason);
  let paymentDetail = `Cartola: ${sourceFile} · sin coincidencia clara.`;
  let paymentSourceFile = sourceFile;
  let paymentMatchAmount: number | null = null;
  let paymentMatchDate: string | null = null;
  let paymentMatchBank = "";
  let paymentMatchAccount = "";
  let paymentMatchState = "";

  if (movement && score >= 70) {
    paymentStatus = normalizePaymentStatusFromMovement(movement, score);
    paymentDetail = buildPaymentMatchDetail(movement, score);
    paymentSourceFile = movement.sourceFile;
    paymentMatchAmount = movement.amount;
    paymentMatchDate = movement.date;
    paymentMatchBank = movement.bank || "";
    paymentMatchAccount = movement.accountNumber || "";
    paymentMatchState = movement.status || "";

    if (paymentStatus === "pagado_cartola") {
      paymentReason = "Pago encontrado en cartola y coincide con el documento.";
    } else if (paymentStatus === "rechazado") {
      paymentReason = movement.rejectionReason || movement.status || "La transferencia fue rechazada por el banco.";
    } else {
      paymentReason = movement.status || `Coincidencia parcial en cartola (${score}%). Revisar antes de marcar como pagado.`;
    }

    paymentSolution = suggestPaymentSolution(paymentStatus, paymentReason);
  } else if (!line.supplier_account_number || !line.supplier_bank || !line.supplier_account_type) {
    paymentReason = "Faltan datos bancarios del proveedor para validar o ejecutar el pago.";
    paymentSolution = "Agregar banco, tipo de cuenta, número de cuenta y correo del beneficiario para continuar.";
  }

  return {
    paymentStatus,
    raw_data: {
      ...currentRaw,
      payment_status: paymentStatus,
      payment_reason: paymentReason,
      payment_solution: paymentSolution,
      payment_match_score: score,
      payment_match_detail: paymentDetail,
      payment_match_source_file: paymentSourceFile,
      payment_match_amount: paymentMatchAmount,
      payment_match_date: paymentMatchDate,
      payment_match_bank: paymentMatchBank,
      payment_match_account: paymentMatchAccount,
      payment_match_state: paymentMatchState,
    },
  };
}

function extractBankAccountsFromDrafts(
  drafts: PackageFileDraft[],
  organizationId: number,
  actorName?: string | null,
  actorEmail?: string | null,
) {
  const accounts = new Map<string, Omit<SupplierBankAccount, "id" | "created_at" | "updated_at">>();

  drafts
    .filter((draft) => draft.file_category === "cuentas_bancarias")
    .forEach((draft) => {
      getExcelSheetsFromDraft(draft).forEach((sheet) => {
        sheet.rows.forEach((row) => {
          const rut = getRowValue(row, ["RUT_BENEFICIARIO", "Rut Beneficiario", "RUT Beneficiario", "Rut", "RUT", "Rut proveedor", "RUT proveedor", "RUT Proveedor", "RUT Proveed", "Rut Proveed"]);
          const supplier = getRowValue(row, ["NOMBRE", "Nombre", "Proveedor", "Razón Social", "Razon Social", "Razon Social Proveedor", "Razón Social Proveedor", "Nombre Beneficiario"]);
          const bank = getRowValue(row, ["BANCO", "Banco", "Banco proveedor", "Nombre Banco"]);
          const accountType = getRowValue(row, ["TIPO_CUENTA", "Tipo Cuenta", "Tipo cuenta", "Tipo de cuenta", "Cuenta tipo", "Medio de Pago"]);
          const accountNumber = getRowValue(row, ["NUMERO", "Número", "Numero", "Cuenta Corriente", "Cuenta corriente o vista", "N° cuenta", "Numero cuenta", "Número cuenta", "Cuenta", "Cuenta Bancaria"]);
          const email = getRowValue(row, ["EMAIL", "Email", "Correo", "Email proveedor", "Email Beneficiario"]);

          const normalizedRut = normalizeRutNumberOnly(rut);

          if (!normalizedRut || !accountNumber) return;

          accounts.set(normalizedRut, {
            organization_id: organizationId,
            supplier_rut: rut,
            supplier_name: supplier || null,
            bank: bank || null,
            account_type: accountType || null,
            account_number: accountNumber || null,
            beneficiary_email: email || null,
            active: true,
            source: `archivo_cuentas:${draft.file_name}`,
            notes: `Importado desde hoja ${sheet.name || "sin hoja"}`,
            created_by_name: actorName || null,
            created_by_email: actorEmail || null,
            updated_by_name: actorName || null,
            updated_by_email: actorEmail || null,
          });
        });
      });
    });

  return Array.from(accounts.values());
}


function buildValidationResult(input: {
  supplier: string;
  rut: string;
  company: string;
  documentType: string;
  folio: string;
  issueDate: string | null;
  dueDate: string | null;
  totalAmount: number;
  accountNumber?: string;
  duplicate: boolean;
}) {
  let score = 100;
  let status = "ok";
  const observations: string[] = [];
  const checks: Record<string, boolean> = {
    proveedor: Boolean(input.supplier),
    rut: Boolean(input.rut),
    sociedad: Boolean(input.company && input.company !== "Por definir"),
    documento: Boolean(input.documentType),
    folio: Boolean(input.folio),
    fecha_emision: Boolean(input.issueDate),
    fecha_vencimiento: Boolean(input.dueDate),
    monto_total: input.totalAmount > 0,
    cuenta_bancaria: Boolean(input.accountNumber),
    duplicado: !input.duplicate,
  };

  const missingCritical: string[] = [];

  if (!checks.proveedor) {
    score -= 20;
    missingCritical.push("proveedor");
  }

  if (!checks.rut) {
    score -= 20;
    missingCritical.push("RUT");
  }

  if (!checks.folio && !["comprobante", "registro", "caja"].some((word) => normalizeText(input.documentType).includes(word))) {
    score -= 20;
    missingCritical.push("folio");
  }

  if (!checks.monto_total) {
    score -= 30;
    missingCritical.push("monto total");
  }

  if (!checks.fecha_emision) {
    score -= 8;
    observations.push("Falta fecha de emisión.");
  }

  if (!checks.fecha_vencimiento) {
    score -= 8;
    observations.push("Falta fecha de vencimiento.");
  }

  if (!checks.cuenta_bancaria && input.totalAmount > 0) {
    score -= 15;
    observations.push("Falta cuenta bancaria del proveedor.");
  }

  if (input.duplicate) {
    score -= 35;
    observations.push("Posible duplicado: mismo RUT, sociedad y folio.");
  }

  if (missingCritical.length > 0) {
    status = "datos_incompletos";
    observations.unshift(`Falta ${missingCritical.join(", ")}.`);
  } else if (input.duplicate) {
    status = "posible_duplicado";
  } else if (!checks.cuenta_bancaria && input.totalAmount > 0) {
    status = "sin_cuenta_bancaria";
  } else if (score < 90) {
    status = "baja_confianza";
    observations.unshift("Revisar lectura antes de enviar a revisión.");
  }

  return {
    status,
    score: Math.max(0, Math.min(100, score)),
    observations,
    checks,
  };
}

function buildDuplicateKey(rut: string, company: string, folio: string) {
  const rutKey = normalizeRutNumberOnly(rut);
  const companyKey = normalizeText(company);
  const folioKey = normalizeText(folio);

  if (!rutKey || !folioKey) return "";

  return `${rutKey}|${companyKey}|${folioKey}`;
}

function buildLinesFromStructuredExcel(
  drafts: PackageFileDraft[],
  insertedFiles: PaymentPackageFile[],
  organizationId: number,
  packageId: number,
  masterAccounts: SupplierBankAccount[] = [],
) {
  const bankMap = buildBankAccountMap(drafts, masterAccounts);
  const lines: Omit<PaymentPackageLine, "id" | "created_at" | "updated_at">[] = [];
  const duplicateMap = new Map<string, number>();

  drafts
    .filter((draft) => ["xlsx", "xls", "xlsm", "csv"].includes((draft.file_type || "").toLowerCase()))
    .filter((draft) => !["cuentas_bancarias", "banco_chile_macro", "banco_chile_txt", "cartola_pagos", "cartola"].includes(draft.file_category))
    .filter((draft) => !isBankStatementDraft(draft))
    .forEach((draft) => {
      const relatedFile = insertedFiles.find((file) => file.file_name === draft.file_name);

      getExcelSheetsFromDraft(draft).forEach((sheet) => {
        sheet.rows.forEach((row, rowIndex) => {
          if (isBankStatementRow(row)) return;
          if (!rowLooksLikeInvoice(row)) return;

          const isSiiRow = isSiiRcvRow(row);
          if (isSiiRow && !isSupportedSiiPaymentDocument(row)) return;
          const supplier = getStructuredSupplier(row);
          const rut = getStructuredRut(row);
          const company =
            getRowValue(row, ["Empresa", "Sociedad", "Compañía", "Compania"]) ||
            (isSiiRow ? inferCompanyFromSiiFile(draft.file_name) : "Por definir");
          const documentType = isSiiRow
            ? getSiiDocumentType(row)
            : getStructuredDocumentType(row) || getCategoryLabel(draft.file_category);
          const folio = getStructuredFolio(row);
          const issueDate = toIsoDateFromCell(
            getRowValue(row, [
              "Fecha facturación",
              "Fecha facturacion",
              "Fecha emisión",
              "Fecha emision",
              "Fecha documento",
              "Fecha Docto",
              "Fecha Documento",
            ]),
          );
          const dueDate = toIsoDateFromCell(
            getRowValue(row, ["Vencimiento / fecha propuesta", "Vencimiento", "Fecha vence", "Fecha Acuse", "Fecha Recepcion", "Fecha Recepción"]),
          );
          const absoluteTotalAmount = isSiiRow
            ? getSiiPaymentTotal(row, rut)
            : getRowAmount(row, ["Monto total", "Monto Total", "Total", "Total factura", "Monto Factura"], rut);
          const totalAmount = isSiiRow ? getSignedSiiPaymentTotal(row, rut) : absoluteTotalAmount;
          const netAmountRaw = getRowAmount(row, ["Monto neto", "Monto Neto", "Neto"], rut);
          const ivaAmountRaw = getRowAmount(row, ["Monto IVA Recuperable", "Monto IVA Rec", "IVA Recuperable", "IVA"], rut);
          const exemptAmountRaw = getRowAmount(row, ["Monto Exento", "Monto exento"], rut);
          const netAmount = isSiiRow && isSiiCreditNoteRow(row) ? -Math.abs(netAmountRaw) : netAmountRaw;
          const ivaAmount = isSiiRow && isSiiCreditNoteRow(row) ? -Math.abs(ivaAmountRaw) : ivaAmountRaw;
          const exemptAmount = isSiiRow && isSiiCreditNoteRow(row) ? -Math.abs(exemptAmountRaw) : exemptAmountRaw;
          const article =
            getRowValue(row, ["Artículo", "Articulo", "Glosa", "Detalle", "Descripción", "Descripcion"]) ||
            (isSiiRow ? getSiiArticle(row) : "");
          const account = findBankAccountForLine(bankMap, rut, supplier);

          const duplicateKey = buildDuplicateKey(rut, company, folio);
          const isDuplicate = Boolean(duplicateKey && duplicateMap.has(duplicateKey));

          if (duplicateKey) {
            duplicateMap.set(duplicateKey, (duplicateMap.get(duplicateKey) || 0) + 1);
          }

          const validation = buildValidationResult({
            supplier,
            rut,
            company,
            documentType,
            folio,
            issueDate,
            dueDate,
            totalAmount: Math.abs(totalAmount),
            accountNumber: account?.accountNumber || "",
            duplicate: isDuplicate,
          });

          const validationStatus = validation.status;
          const observations = validation.observations;

          lines.push({
            package_id: packageId,
            file_id: relatedFile?.id || null,
            organization_id: organizationId,
            line_type: "documento_pago",
            supplier_name: supplier || "Sin proveedor",
            supplier_rut: rut || null,
            supplier_bank: account?.bank || null,
            supplier_account_type: account?.accountType || null,
            supplier_account_number: account?.accountNumber || null,
            supplier_email: account?.email || null,
            company_name: company,
            document_type: documentType,
            document_folio: folio || null,
            issue_date: issueDate,
            due_date: dueDate,
            payment_date: null,
            invoice_amount: totalAmount,
            payment_amount: totalAmount,
            credit_note_amount: isSiiRow && isSiiCreditNoteRow(row) ? Math.abs(totalAmount) : normalizeText(documentType).includes("nota") ? Math.abs(totalAmount) : 0,
            approved_amount: 0,
            validation_status: validationStatus,
            reviewer_decision: "pendiente",
            observation:
              observations.join(" ") ||
              (isSiiRow
                ? `Lectura directa desde Registro de Compras SII con confianza ${validation.score}%.`
                : `Lectura estructurada con confianza ${validation.score}%. Revisar antes de enviar a revisión.`),
            raw_data: {
              source_file: draft.file_name,
              source_sheet: sheet.name,
              source_row: rowIndex + 1,
              source_type: isSiiRow ? "sii_registro_compras" : "excel_estructurado",
              sii_tipo_doc: isSiiRow ? getRowValue(row, ["Tipo Doc", "Tipo Documento", "Tipo DTE"]) : "",
              sii_tipo_compra: isSiiRow ? getRowValue(row, ["Tipo Compra"]) : "",
              sii_fecha_recepcion: isSiiRow ? getRowValue(row, ["Fecha Recepcion", "Fecha Recepción"]) : "",
              extraction_confidence: validation.score,
              validation_checks: validation.checks,
              extracted_net_amount: netAmount,
              extracted_iva_amount: ivaAmount,
              extracted_exempt_amount: exemptAmount,
              extracted_total_amount: totalAmount,
              extracted_absolute_total_amount: Math.abs(totalAmount),
              signed_payment_amount: totalAmount,
              article,
              original_row: row,
            },
          });
        });
      });
    });

  return lines;
}


function extractPdfInvoiceValues(text: string) {
  const normalized = String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const badContextWords = [
    "rut",
    "r.u.t",
    "resolucion",
    "resolución",
    "sii",
    "giro",
    "direccion",
    "dirección",
    "comuna",
    "telefono",
    "teléfono",
    "casilla",
    "codigo",
    "código",
    "folio",
    "factura n",
    "factura nº",
    "fecha",
    "emision",
    "emisión",
    "vencimiento",
  ];

  const strongTotalLabels = [
    "monto total",
    "total a pagar",
    "total factura",
    "total documento",
    "total boleta",
    "total exento",
  ];

  const softTotalLabels = [
    "total",
    "monto",
    "valor",
    "importe",
  ];

  const netLabels = [
    "monto neto",
    "neto",
    "valor neto",
    "subtotal",
  ];

  const ivaLabels = [
    "iva",
    "monto iva",
    "19%",
  ];

  const extractCandidates = (labels: string[], labelStrength: number) => {
    const candidates: Array<{
      amount: number;
      label: string;
      score: number;
      context: string;
    }> = [];

    labels.forEach((label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const patterns = [
        new RegExp(`(.{0,80}${escaped}.{0,120})`, "gi"),
        new RegExp(`(${escaped}.{0,160})`, "gi"),
      ];

      patterns.forEach((pattern) => {
        Array.from(normalized.matchAll(pattern)).forEach((match) => {
          const context = match[1] || "";
          const amounts = Array.from(
            context.matchAll(/(?:CLP\s*)?\$?\s*([0-9]{1,3}(?:[.\s][0-9]{3})+|[0-9]{4,})/gi),
          )
            .map((amountMatch) => parseMoneyCandidate(amountMatch[1]))
            .filter((amount) => amount > 0);

          amounts.forEach((amount) => {
            if (amountLooksLikeRut(amount, "")) return;
            if (amount > 50000000) return;

            const contextNorm = normalizeText(context);
            const badContextPenalty = badContextWords.some((word) => contextNorm.includes(normalizeText(word))) ? 45 : 0;
            const moneyFormatBonus = /(\$|CLP)/i.test(context) ? 12 : 0;
            const totalBonus = normalizeText(label).includes("total") ? 25 : 0;
            const netPenalty = normalizeText(label).includes("neto") ? 8 : 0;

            const score = labelStrength + moneyFormatBonus + totalBonus - netPenalty - badContextPenalty;

            candidates.push({
              amount,
              label,
              score,
              context: context.trim().slice(0, 180),
            });
          });
        });
      });
    });

    return candidates;
  };

  const totalCandidates = [
    ...extractCandidates(strongTotalLabels, 80),
    ...extractCandidates(softTotalLabels, 55),
  ].sort((a, b) => b.score - a.score || b.amount - a.amount);

  const netCandidates = extractCandidates(netLabels, 70).sort((a, b) => b.score - a.score || b.amount - a.amount);
  const ivaCandidates = extractCandidates(ivaLabels, 65).sort((a, b) => b.score - a.score || b.amount - a.amount);

  const bestNet = netCandidates.find((candidate) => candidate.score >= 55)?.amount || 0;
  const bestIva = ivaCandidates.find((candidate) => candidate.score >= 50)?.amount || 0;

  let bestTotal = 0;
  let bestScore = 0;
  let bestContext = "";

  for (const candidate of totalCandidates) {
    if (candidate.score < 55) continue;

    // Si aparece neto + IVA, exigimos consistencia contra total.
    if (bestNet > 0 && bestIva > 0) {
      const delta = Math.abs(candidate.amount - (bestNet + bestIva));
      const allowedDelta = Math.max(5, Math.round(candidate.amount * 0.01));

      if (delta <= allowedDelta) {
        bestTotal = candidate.amount;
        bestScore = Math.min(100, candidate.score + 20);
        bestContext = candidate.context;
        break;
      }

      // Si no calza con neto + IVA, no se acepta como total.
      continue;
    }

    // Si solo hay etiqueta blanda como "Monto" o "Total", exigimos mejor score.
    if (candidate.score >= 70) {
      bestTotal = candidate.amount;
      bestScore = candidate.score;
      bestContext = candidate.context;
      break;
    }
  }

  return {
    net: bestTotal > 0 ? bestNet || estimateNetAmount(bestTotal) : 0,
    total: bestTotal,
    iva: bestTotal > 0 ? bestIva : 0,
    confidence: bestScore,
    context: bestContext,
  };
}

function isPdfInvoiceCategory(category: string) {
  return ["factura", "nota_credito"].includes(category);
}


type PumayPdfDocumentRead = {
  template: string;
  supplierName: string;
  supplierRut: string;
  companyName: string;
  documentType: string;
  documentFolio: string;
  issueDate: string | null;
  dueDate: string | null;
  documentDate: string | null;
  netAmount: number;
  ivaAmount: number;
  totalAmount: number;
  article: string;
  confidence: number;
  observation: string;
};

function firstMatchValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanCellValue(match[1]);
  }
  return "";
}

function parseDateFromPdf(value: string) {
  const raw = cleanCellValue(value);
  if (!raw) return null;

  const numeric = raw.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
  if (numeric) {
    const normalized = normalizeDateForDb(numeric[0]);
    if (normalized) return normalized;
  }

  const monthNames: Record<string, string> = {
    enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
    julio: "07", agosto: "08", septiembre: "09", setiembre: "09", octubre: "10",
    noviembre: "11", diciembre: "12",
  };

  const spanish = normalizeText(raw).match(/(\d{1,2})\s+de\s+([a-z]+)\s+del?\s+(\d{4})/);
  if (spanish) {
    const month = monthNames[spanish[2]];
    if (month) return `${spanish[3]}-${month}-${spanish[1].padStart(2, "0")}`;
  }

  return null;
}

function extractDateAfterLabel(text: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s*[:\\-]?\\s*([^\\n\\r]{6,45})`, "i"));
  return match?.[1] ? parseDateFromPdf(match[1]) : null;
}

function extractMoneyAfterLabel(text: string, labels: string[]) {
  const normalized = String(text || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`${escaped}\\s*[:\\-]?\\s*(?:CLP)?\\s*\\$?\\s*([0-9]{1,3}(?:[\\.\\s][0-9]{3})+|[0-9]{4,})`, "i"),
      new RegExp(`${escaped}[^0-9$]{0,120}(?:CLP)?\\s*\\$?\\s*([0-9]{1,3}(?:[\\.\\s][0-9]{3})+|[0-9]{4,})`, "i"),
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      const amount = match?.[1] ? parseMoneyCandidate(match[1]) : 0;
      if (amount > 0 && !amountLooksLikeRut(amount, "") && amount <= 50000000) return amount;
    }
  }

  return 0;
}

function splitSupplierCodeAndDv(value: string) {
  const clean = String(value || "").trim().toUpperCase();
  const match = clean.match(/^([0-9]{6,9})([0-9K])?P?$/);
  if (!match) return clean;
  return match[2] ? `${match[1]}-${match[2]}` : clean;
}

function extractPumayPaymentVoucher(text: string): PumayPdfDocumentRead | null {
  if (!/Comprobante\s+de\s+Pago/i.test(text)) return null;

  const supplierCode = firstMatchValue(text, [
    /C[oó]d\.?\s*Proveedor\s*[:\-]?\s*([A-Z0-9.\-]+)/i,
    /Codigo\s*Proveedor\s*[:\-]?\s*([A-Z0-9.\-]+)/i,
  ]);
  const supplierName = firstMatchValue(text, [/Raz[oó]n\s+Social\s*[:\-]?\s*([^\n\r]+)/i]);
  const voucherNumber = firstMatchValue(text, [/Comprobante\s+de\s+Pago\s+Nro\.?\s*[:\-]?\s*([0-9]+)/i]);
  const documentFolio = firstMatchValue(text, [
    /Nro\.?\s*Docto\.?\s+[^0-9]*([0-9]+[-–][0-9]+)/i,
    /Nro\.?\s*Docto\.?\s*[:\-]?\s*([0-9]+[-–][0-9]+)/i,
  ]);

  const accountingDate = extractDateAfterLabel(text, "Fecha Contabilización");
  const dueDate = extractDateAfterLabel(text, "Fecha Vencimiento");
  const documentDate = extractDateAfterLabel(text, "Fecha Documento");
  const totalAmount = extractMoneyAfterLabel(text, ["Total General", "Total Transferencias", "Total Docto"]);

  return {
    template: "comprobante_pago_pumay",
    supplierName,
    supplierRut: splitSupplierCodeAndDv(supplierCode),
    companyName: "Por definir",
    documentType: "Comprobante",
    documentFolio: documentFolio || voucherNumber,
    issueDate: documentDate || accountingDate,
    dueDate,
    documentDate,
    netAmount: 0,
    ivaAmount: 0,
    totalAmount,
    article: documentFolio ? `Pago documento ${documentFolio}` : "Comprobante de pago",
    confidence: supplierName && totalAmount ? 95 : 70,
    observation: "Comprobante de pago: usar Total General / Total Transferencias. No genera pago nuevo; sirve para cruzar pagos ya realizados.",
  };
}

function extractPumayAccountingEntry(text: string): PumayPdfDocumentRead | null {
  if (!/Asiento\s+Contable/i.test(text)) return null;

  const companyName =
    firstMatchValue(text, [/^\s*(Pumay\s+S\.?A\.?|Pumay\s+SpA)[^\n\r]*/im]) ||
    "Por definir";
  const glosa = firstMatchValue(text, [/Glosa\s*[:\-]?\s*([^\n\r]+)/i]);
  const entryNumber = firstMatchValue(text, [/Asiento\s+Contable\s+Nro\.?\s*[:\-]?\s*([0-9]+)/i]);

  const accountingDate = extractDateAfterLabel(text, "Fecha Contabilización");
  const dueDate = extractDateAfterLabel(text, "Fecha Vencimiento");
  const documentDate = extractDateAfterLabel(text, "Fecha Documento");

  const creditValues = Array.from(
    String(text || "").matchAll(/Cr[eé]dito[^A-Z0-9]*(?:CLP)?\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,})/gi),
  ).map((match) => parseMoneyCandidate(match[1]));

  const generalTotal = extractMoneyAfterLabel(text, ["Total General"]);
  const totalAmount = creditValues.filter((amount) => amount > 0 && amount <= 50000000)[0] || generalTotal;

  return {
    template: "asiento_contable_pumay",
    supplierName: glosa || "Registro contable",
    supplierRut: "",
    companyName,
    documentType: "Registro contable",
    documentFolio: entryNumber,
    issueDate: documentDate || accountingDate,
    dueDate,
    documentDate,
    netAmount: 0,
    ivaAmount: 0,
    totalAmount,
    article: glosa,
    confidence: glosa && totalAmount ? 90 : 65,
    observation: "Registro contable: usar Glosa, fechas y Crédito/Total General para revisión; no genera pago directo sin validación.",
  };
}

function extractPumayPurchaseOrder(text: string): PumayPdfDocumentRead | null {
  if (!/Orden\s+de\s+compra/i.test(text)) return null;

  const companyRut = firstMatchValue(text, [/Rut\s*[:\-]?\s*([0-9.\-Kk]+)/i]);
  const companyName = firstMatchValue(text, [/Raz[oó]n\s+Social\s*[:\-]?\s*([^\n\r]+)/i]) || "Pumay S.A.";
  const supplierName = firstMatchValue(text, [/Proveedor\s*[:\-]?\s*([^\n\r]+)/i]);
  const orderNumber = firstMatchValue(text, [/Orden\s+de\s+compra\s*[:\-]?\s*([A-Z0-9.\-]+)/i]);

  const issueDate = extractDateAfterLabel(text, "Fecha");
  const totalAmount = extractMoneyAfterLabel(text, ["Total", "TOTAL Neto"]);
  const netAmount = extractMoneyAfterLabel(text, ["TOTAL Neto", "Subtotal"]);
  const ivaAmount = extractMoneyAfterLabel(text, ["I.V.A", "IVA"]);

  return {
    template: "orden_compra_pumay",
    supplierName,
    supplierRut: "",
    companyName,
    documentType: "Orden de compra",
    documentFolio: orderNumber,
    issueDate,
    dueDate: null,
    documentDate: issueDate,
    netAmount,
    ivaAmount,
    totalAmount,
    article: "Orden de compra",
    confidence: supplierName && totalAmount ? 90 : 65,
    observation: `Orden de compra: proveedor y total marcados. RUT empresa receptora: ${companyRut || "sin RUT"}.`,
  };
}

function extractSiiInvoice(text: string): PumayPdfDocumentRead | null {
  const isInvoice = /FACTURA\s+ELECTRONICA|FACTURA\s+ELECTR[ÓO]NICA/i.test(text);
  const isCreditNote = /NOTA\s+DE\s+CREDITO|NOTA\s+DE\s+CR[ÉE]DITO/i.test(text);
  if (!isInvoice && !isCreditNote) return null;

  const supplierRut = firstMatchValue(text, [/R\.?U\.?T\.?\s*[:\-]?\s*([0-9.\-Kk]+)/i]);
  const supplierName = firstMatchValue(text, [
    /^([A-ZÁÉÍÓÚÑ0-9 .,&\-]+(?:SPA|S\.A\.|LIMITADA|LTDA|FACTORY|ASESORIAS|CAPITAL|BICE|VIDA)[^\n\r]*)/im,
  ]);

  const customerName = firstMatchValue(text, [
    /SE[NÑ]OR\(ES\)\s*[:\-]?\s*([^\n\r]+)/i,
    /Cliente\s*[:\-]?\s*([^\n\r]+)/i,
  ]);
  const customerRut = firstMatchValue(text, [
    /SE[NÑ]OR\(ES\)[\s\S]{0,180}?R\.?U\.?T\.?\s*[:\-]?\s*([0-9.\-Kk]+)/i,
    /INFORMACION\s+DEL\s+CLIENTE[\s\S]{0,250}?RUT\s*[:\-]?\s*([0-9.\-Kk]+)/i,
  ]);

  const folio = firstMatchValue(text, [
    /N[°º]\s*([0-9]+)/i,
    /FACTURA\s+ELECTRONICA\s+N[°º]\s*([0-9]+)/i,
    /FACTURA\s+ELECTR[ÓO]NICA\s+N[°º]\s*([0-9]+)/i,
  ]);

  const issueDate =
    extractDateAfterLabel(text, "Fecha Emision") ||
    extractDateAfterLabel(text, "Fecha Emisión") ||
    extractDateAfterLabel(text, "Fecha Emis");
  const dueDate = extractDateAfterLabel(text, "Fecha Venc") || extractDateAfterLabel(text, "Fecha Vencimiento");

  const netAmount = extractMoneyAfterLabel(text, ["MONTO NETO", "Monto Neto", "NETO"]);
  const ivaAmount = extractMoneyAfterLabel(text, ["I.V.A. 19%", "IVA 19%", "I.V.A", "IVA"]);
  const totalAmount = extractMoneyAfterLabel(text, ["MONTO TOTAL", "Monto Total", "VALOR A PAGAR", "TOTAL", "Total"]);

  const companyName = normalizeText(customerName).includes("pumay")
    ? "Pumay"
    : customerName || "Por definir";

  return {
    template: isCreditNote ? "nota_credito_sii" : "factura_sii",
    supplierName,
    supplierRut,
    companyName,
    documentType: isCreditNote ? "Nota de crédito" : "Factura",
    documentFolio: folio,
    issueDate,
    dueDate,
    documentDate: issueDate,
    netAmount,
    ivaAmount,
    totalAmount,
    article: firstMatchValue(text, [
      /Descripci[oó]n\s+[^A-Z0-9]*([^\n\r]{4,160})/i,
      /Detalle\s+de\s+productos\s+([^\n\r]{4,160})/i,
    ]),
    confidence: supplierName && supplierRut && folio && totalAmount ? 95 : 70,
    observation: `Factura SII: usar emisor, RUT emisor, folio y Monto Total/Total. Receptor: ${customerName || "sin receptor"} ${customerRut || ""}`.trim(),
  };
}

function extractPumayKnownPdfDocument(text: string): PumayPdfDocumentRead | null {
  return (
    extractPumayPaymentVoucher(text) ||
    extractPumayAccountingEntry(text) ||
    extractPumayPurchaseOrder(text) ||
    extractSiiInvoice(text)
  );
}

function buildReportLinesFromDrafts(
  drafts: PackageFileDraft[],
  insertedFiles: PaymentPackageFile[],
  organizationId: number,
  packageId: number,
  masterAccounts: SupplierBankAccount[] = [],
): Omit<PaymentPackageLine, "id" | "created_at" | "updated_at">[] {
  const structuredExcelLines = buildLinesFromStructuredExcel(drafts, insertedFiles, organizationId, packageId, masterAccounts);

  if (structuredExcelLines.length > 0) {
    return structuredExcelLines;
  }

  // Fallback conservador:
  // Solo se usa si no existe Excel estructurado. En PDF nunca se debe inventar monto.
  const relevantCategories = new Set(["factura", "nota_credito", "caja_chica", "iva"]);

  return drafts
    .filter((draft) => relevantCategories.has(draft.file_category))
    .map((draft) => {
      const relatedFile = insertedFiles.find((file) => file.file_name === draft.file_name);
      const text = extractTextFromDraft(draft);
      const hasText = text.trim().length > 0;
      const knownPdf = draft.file_type === "pdf" ? extractPumayKnownPdfDocument(text) : null;

      const folio = knownPdf?.documentFolio || findDocumentFolio(draft.file_name, text);
      const supplier = knownPdf?.supplierName || findSupplierName(draft.file_name, text);
      const rut = knownPdf?.supplierRut || findBestRut(text);
      const company = knownPdf?.companyName || findCompanyName(text, draft.file_name);
      const extractedAmount = knownPdf?.totalAmount || findBestAmount(text);
      const safeAmount = sanitizeDisplayAmount(extractedAmount, rut);
      const amount = safeAmount;
      const netAmount = amount > 0 ? knownPdf?.netAmount || findNetAmount(text, amount) : 0;
      const amountObservation = knownPdf
        ? `${knownPdf.observation} Plantilla detectada: ${knownPdf.template}.`
        : buildAmountObservation(extractedAmount, rut);

      const isCreditNote = knownPdf?.documentType === "Nota de crédito" || draft.file_category === "nota_credito";
      const isSupportOnly = ["comprobante_pago", "registro_contable", "banco_security"].includes(draft.file_category);
      const issueDate = knownPdf?.issueDate || findBestDate(text, ["Fecha Emisi[oó]n", "Fecha", "Emisi[oó]n"]);
      const dueDate = knownPdf?.dueDate || findBestDate(text, ["Fecha Vencimiento", "Vencimiento", "Vence"]);
      const documentType = knownPdf?.documentType || (isCreditNote
        ? "Nota de crédito"
        : draft.file_category === "factura"
          ? "Factura"
          : getCategoryLabel(draft.file_category));

      let validationStatus = "pendiente_revision";
      let observation = "Revisar datos extraídos antes de enviar a aprobación.";

      if (!hasText) {
        validationStatus = "datos_incompletos";
        observation = "No se pudo leer texto del archivo. Revisar manualmente o cargar PDF con texto seleccionable.";
      } else if (!amount && !isSupportOnly) {
        validationStatus = "datos_incompletos";
        observation = "No se encontró monto total con seguridad.";
      } else if (!folio && !isSupportOnly) {
        validationStatus = "datos_incompletos";
        observation = "No se encontró folio con seguridad.";
      }

      return {
        package_id: packageId,
        file_id: relatedFile?.id || null,
        organization_id: organizationId,
        line_type: isSupportOnly ? "respaldo" : "documento_pago",
        supplier_name: supplier,
        supplier_rut: rut || null,
        supplier_bank: null,
        supplier_account_type: null,
        supplier_account_number: null,
        supplier_email: null,
        company_name: company,
        document_type: documentType,
        document_folio: folio || null,
        issue_date: issueDate,
        due_date: dueDate,
        payment_date: null,
        invoice_amount: isCreditNote ? 0 : amount,
        payment_amount: isCreditNote ? 0 : amount,
        credit_note_amount: isCreditNote ? amount : 0,
        approved_amount: 0,
        validation_status: validationStatus,
        reviewer_decision: "pendiente",
        observation,
        raw_data: {
          source_file: draft.file_name,
          source_category: draft.file_category,
          extraction_text_available: hasText,
          extraction_preview: text.slice(0, 1600),
          extracted_net_amount: netAmount,
          extracted_total_amount: amount,
          discarded_amount_candidate: extractedAmount !== amount ? extractedAmount : 0,
          discarded_amount_reason: extractedAmount !== amount ? amountObservation : "",
          pdf_template: knownPdf?.template || "",
          pdf_amount_net: knownPdf?.netAmount || 0,
          pdf_amount_iva: knownPdf?.ivaAmount || 0,
          pdf_amount_total: knownPdf?.totalAmount || 0,
          pdf_amount_confidence: knownPdf?.confidence || 0,
          pdf_amount_context: knownPdf?.observation || "",
          pre_macro_status: validationStatus,
        },
      };
    });
}



type ProposalPeriodKey = "este_viernes" | "proxima_semana" | "semana_futura" | "sin_vencimiento";
type ProposalPeriodFilter = ProposalPeriodKey | "todos" | "programados";

function isoDateFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToIsoDate(value: string, days: number) {
  const base = new Date(`${value}T00:00:00`);
  if (Number.isNaN(base.getTime())) return value;

  base.setDate(base.getDate() + days);
  return isoDateFromDate(base);
}

function getPackagePaymentDateIso(packageItem?: PaymentPackage | null) {
  return normalizeDateForDb(packageItem?.payment_date || "") || isoDateFromDate(new Date());
}

function getExplicitDueDateFromLine(line: PaymentPackageLine) {
  const raw = (line.raw_data || {}) as Record<string, unknown>;
  const originalRow = (raw.original_row || {}) as Record<string, unknown>;
  const explicitFromRow = normalizeDateForDb(
    getRowValue(originalRow, [
      "Vencimiento / fecha propuesta",
      "Fecha Vencimiento",
      "Vencimiento",
      "Fecha vence",
      "Fecha Vence",
    ]),
  );

  if (explicitFromRow) return explicitFromRow;

  const due = normalizeDateForDb(line.due_date);
  const issue = normalizeDateForDb(line.issue_date);
  // Si el vencimiento queda antes de la emisión, no es vencimiento real.
  if (due && issue && due < issue) return null;

  // Si viene un vencimiento válido, se usa para planificar.
  // El formato visible se muestra como dd-mm-aaaa para evitar confusiones.
  return due;
}

function getPlanningDateForLine(line: PaymentPackageLine) {
  return getLineScheduledPaymentDate(line) || getExplicitDueDateFromLine(line);
}

function getProposalPeriodKey(dateIso: string | null, packageItem?: PaymentPackage | null): ProposalPeriodKey {
  if (!dateIso) return "sin_vencimiento";

  const paymentDate = getPackagePaymentDateIso(packageItem);
  const nextWeekEnd = addDaysToIsoDate(paymentDate, 7);

  if (dateIso <= paymentDate) return "este_viernes";
  if (dateIso <= nextWeekEnd) return "proxima_semana";

  return "semana_futura";
}

function getProposalPeriodLabel(period: ProposalPeriodKey) {
  if (period === "este_viernes") return "Pagar este viernes";
  if (period === "proxima_semana" || period === "semana_futura") return "Otra fecha programada";
  return "Sin vencimiento informado";
}

function getProposalPeriodClass(period: ProposalPeriodKey) {
  if (period === "este_viernes") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (period === "proxima_semana" || period === "semana_futura") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

type WeeklyPaymentProposalGroup = {
  key: string;
  companyName: string;
  supplierName: string;
  supplierRut: string;
  invoicesTotal: number;
  creditNotesTotal: number;
  amountToPay: number;
  approvedAmount: number;
  documentCount: number;
  creditNoteCount: number;
  hasBankAccount: boolean;
  bank: string;
  accountType: string;
  accountNumber: string;
  email: string;
  nearestDueDate: string | null;
  proposalPeriod: ProposalPeriodKey;
  proposalPeriodLabel: string;
  proposalPeriodClass: string;
  plannedPaymentDate: string | null;
  statusLabel: string;
  statusClass: string;
  sourceLines: PaymentPackageLine[];
};

function buildWeeklyPaymentProposalGroups(
  lines: PaymentPackageLine[],
  packageItem?: PaymentPackage | null,
) {
  const groups = new Map<string, WeeklyPaymentProposalGroup>();

  lines.forEach((line) => {
    const shouldInclude = isLineCreditNote(line) || (!isLinePaidByBank(line) && !isLineRejectedByBank(line));

    if (!shouldInclude) return;
    if (isLinePaidByBank(line) || isLineRejectedByBank(line)) return;

    const companyName = line.company_name || "Por definir";
    const supplierRut = line.supplier_rut || "SIN_RUT";
    const supplierName = line.supplier_name || "Sin proveedor";
    const linePlanningDate = getPlanningDateForLine(line);
    const lineProposalPeriod = getProposalPeriodKey(linePlanningDate, packageItem);
    const key = `${normalizeText(companyName)}|${normalizeRutNumberOnly(supplierRut)}|${normalizeText(supplierName)}|${lineProposalPeriod}`;
    const amount = Math.abs(getSafeLineAmount(line));
    const isCredit = isLineCreditNote(line);

    if (!groups.has(key)) {
      const hasBankAccount = Boolean(line.supplier_bank && line.supplier_account_type && line.supplier_account_number);

      groups.set(key, {
        key,
        companyName,
        supplierName,
        supplierRut,
        invoicesTotal: 0,
        creditNotesTotal: 0,
        amountToPay: 0,
        approvedAmount: 0,
        documentCount: 0,
        creditNoteCount: 0,
        hasBankAccount,
        bank: line.supplier_bank || "",
        accountType: line.supplier_account_type || "",
        accountNumber: line.supplier_account_number || "",
        email: line.supplier_email || "",
        nearestDueDate: null,
        proposalPeriod: lineProposalPeriod,
        proposalPeriodLabel: getProposalPeriodLabel(lineProposalPeriod),
        proposalPeriodClass: getProposalPeriodClass(lineProposalPeriod),
        plannedPaymentDate: null,
        statusLabel: "",
        statusClass: "",
        sourceLines: [],
      });
    }

    const group = groups.get(key)!;

    if (isCredit) {
      group.creditNotesTotal += amount;
      group.creditNoteCount += 1;
    } else {
      group.invoicesTotal += amount;
      group.documentCount += 1;
    }

    if (!group.hasBankAccount && line.supplier_account_number) {
      group.hasBankAccount = Boolean(line.supplier_bank && line.supplier_account_type && line.supplier_account_number);
      group.bank = line.supplier_bank || group.bank;
      group.accountType = line.supplier_account_type || group.accountType;
      group.accountNumber = line.supplier_account_number || group.accountNumber;
      group.email = line.supplier_email || group.email;
    }

    group.sourceLines.push(line);

    if (!isCredit) {
      const planningDate = getPlanningDateForLine(line);

      if (planningDate && (!group.nearestDueDate || planningDate < group.nearestDueDate)) {
        group.nearestDueDate = planningDate;
      }
    }
  });

  return Array.from(groups.values())
    .map((group) => {
      const amountToPay = group.invoicesTotal - group.creditNotesTotal;
      const payableLines = group.sourceLines.filter((line) => !isLineCreditNote(line));
      const approvedLines = payableLines.filter((line) => line.reviewer_decision === "aprobar");
      const hasObservedLines = payableLines.some((line) => ["observado", "datos_incompletos", "sin_cuenta_bancaria", "baja_confianza"].includes(normalizeText(line.validation_status)));
      const hasRejectedLines = payableLines.some((line) => ["rechazado", "excluir"].includes(normalizeText(line.validation_status)) || ["rechazar", "excluir"].includes(normalizeText(line.reviewer_decision || "")));
      const hasManualPaidLines = payableLines.some((line) => getLinePaymentStatus(line) === "pagado_manual");

      let statusLabel = "Listo para revisión";
      let statusClass = "border-slate-200 bg-slate-50 text-slate-700";

      if (hasManualPaidLines) {
        statusLabel = "Pagado manual";
        statusClass = "border-purple-200 bg-purple-50 text-purple-800";
      } else if (!group.hasBankAccount) {
        statusLabel = "Falta cuenta bancaria";
        statusClass = "border-amber-200 bg-amber-50 text-amber-800";
      } else if (hasRejectedLines) {
        statusLabel = "Con líneas excluidas/rechazadas";
        statusClass = "border-rose-200 bg-rose-50 text-rose-800";
      } else if (hasObservedLines) {
        statusLabel = "Requiere revisión";
        statusClass = "border-amber-200 bg-amber-50 text-amber-800";
      } else if (payableLines.length > 0 && approvedLines.length === payableLines.length) {
        statusLabel = "Listo para pago";
        statusClass = "border-emerald-200 bg-emerald-50 text-emerald-800";
      } else if (group.hasBankAccount) {
        statusLabel = "Listo para pago";
        statusClass = "border-sky-200 bg-sky-50 text-sky-800";
      }

      const groupPlanningDate = payableLines
        .map((line) => getPlanningDateForLine(line))
        .filter(Boolean)
        .sort()[0] || null;
      const proposalPeriod = getProposalPeriodKey(groupPlanningDate, packageItem);

      return {
        ...group,
        nearestDueDate: groupPlanningDate,
        plannedPaymentDate: groupPlanningDate,
        proposalPeriod,
        proposalPeriodLabel: getProposalPeriodLabel(proposalPeriod),
        proposalPeriodClass: getProposalPeriodClass(proposalPeriod),
        amountToPay,
        approvedAmount: payableLines.reduce((sum, line) => {
          if (line.reviewer_decision === "aprobar") return sum + getSafeLineAmount(line);
          return sum;
        }, 0),
        statusLabel,
        statusClass,
      };
    })
    .filter((group) => group.amountToPay > 0)
    .sort((a, b) => b.amountToPay - a.amountToPay);
}

export default function PagosProveedoresPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);
  const [packageFiles, setPackageFiles] = useState<PaymentPackageFile[]>([]);
  const [packageLines, setPackageLines] = useState<PaymentPackageLine[]>([]);
  const [bankMovements, setBankMovements] = useState<PaymentPackageBankMovement[]>([]);
  const [packageObservations, setPackageObservations] = useState<PaymentPackageObservation[]>([]);
  const [accountModal, setAccountModal] = useState<{
    open: boolean;
    line: PaymentPackageLine | null;
    supplierName: string;
    supplierRut: string;
    bank: string;
    accountType: string;
    accountNumber: string;
    email: string;
  }>({
    open: false,
    line: null,
    supplierName: "",
    supplierRut: "",
    bank: "",
    accountType: "",
    accountNumber: "",
    email: "",
  });
  const [movePaymentModal, setMovePaymentModal] = useState<{
    open: boolean;
    line: PaymentPackageLine | null;
    scheduledDate: string;
    reason: string;
  }>({
    open: false,
    line: null,
    scheduledDate: "",
    reason: "",
  });
  const [fileProcessingProgress, setFileProcessingProgress] = useState<FileProcessingProgress[]>([]);
  const [showProcessingProgress, setShowProcessingProgress] = useState(false);
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    nextStatus: "observado" | "rechazado" | "";
    title: string;
    action: string;
  }>({ open: false, nextStatus: "", title: "", action: "" });
  const [reviewComment, setReviewComment] = useState("");
  const [macroMessage, setMacroMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processingAction, setProcessingAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [contentSearch, setContentSearch] = useState("");
  const [packageName, setPackageName] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [dataPercentSort, setDataPercentSort] = useState<"none" | "asc" | "desc">("none");
  const [paymentStatusSort, setPaymentStatusSort] = useState<"none" | "asc" | "desc">("none");
  const [lineSearchTerm, setLineSearchTerm] = useState("");
  const [lineSortKey, setLineSortKey] = useState<PackageLineSortKey>("none");
  const [lineSortDirection, setLineSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedProposalGroups, setExpandedProposalGroups] = useState<Record<string, boolean>>({});
  const [showOperationalSummary, setShowOperationalSummary] = useState(false);
  const [showPreMacroTable, setShowPreMacroTable] = useState(false);
  const [proposalDueSortDirection, setProposalDueSortDirection] = useState<"asc" | "desc">("asc");
  const [proposalPeriodFilter, setProposalPeriodFilter] = useState<ProposalPeriodFilter>("todos");

  function toggleLineSort(key: PackageLineSortKey) {
    setLineSortKey((currentKey) => {
      if (currentKey === key) {
        setLineSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
        return key;
      }

      setLineSortDirection("asc");
      return key;
    });

    setDataPercentSort("none");
    setPaymentStatusSort("none");
  }

  function toggleDataPercentSort() {
    toggleLineSort("percent");
    setDataPercentSort((current) => {
      if (current === "none") return "asc";
      if (current === "asc") return "desc";
      return "none";
    });
  }

  function togglePaymentStatusSort() {
    toggleLineSort("payment");
    setPaymentStatusSort((current) => {
      if (current === "none") return "asc";
      if (current === "asc") return "desc";
      return "none";
    });
  }
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bankAccountsInputRef = useRef<HTMLInputElement | null>(null);
  const bankStatementInputRef = useRef<HTMLInputElement | null>(null);

  const today = useMemo(() => new Date(), []);
  const currentWeek = useMemo(() => getWeekPeriod(today), [today]);

  const normalizedRole = normalizeRole(userProfile?.role);
  const isAccountsPayableUser = ["cuentas_por_pagar", "proveedores", "facturacion", "facturación"].includes(normalizedRole);
  const canReviewPackages = ["owner", "gerencia_control", "planificacion_control", "aprobador_pagos", "finanzas"].includes(normalizedRole);
  const canExecutePackages = ["gerencia_general", "ejecucion_pagos"].includes(normalizedRole);
  const roleLabel = getWorkflowRoleLabel(userProfile);

  useEffect(() => {
    const savedProfile = getSavedProfileSession();
    setUserProfile(savedProfile);

    if (!savedProfile || !canAccessPayments(savedProfile)) {
      setLoading(false);
      return;
    }

    loadPackages(savedProfile);
  }, []);

  async function loadPackages(profile = userProfile) {
    if (!profile?.organization_id) return;

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("payment_packages")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(`No se pudieron cargar los paquetes. Detalle: ${error.message}`);
      setPackages([]);
    } else {
      setPackages((data || []) as PaymentPackage[]);
    }

    setLoading(false);
  }

  async function loadPackageDetail(pkg: PaymentPackage) {
    setSelectedPackage(pkg);
    setPackageFiles([]);
    setPackageLines([]);
    setBankMovements([]);
    setPackageObservations([]);
    setErrorMessage("");
    setSuccessMessage("");

    const [filesResult, linesResult, movementsResult, observationsResult] = await Promise.all([
      supabase
        .from("payment_package_files")
        .select("*")
        .eq("package_id", pkg.id)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("payment_package_lines")
        .select("*")
        .eq("package_id", pkg.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("payment_package_bank_movements")
        .select("*")
        .eq("package_id", pkg.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payment_package_observations")
        .select("*")
        .eq("package_id", pkg.id)
        .order("created_at", { ascending: false }),
    ]);

    if (filesResult.error) {
      setErrorMessage(`No se pudieron cargar archivos del paquete: ${filesResult.error.message}`);
      setPackageFiles([]);
    } else {
      setPackageFiles((filesResult.data || []) as PaymentPackageFile[]);
    }

    if (linesResult.error) {
      setErrorMessage(`No se pudieron cargar líneas del paquete: ${linesResult.error.message}`);
      setPackageLines([]);
    } else {
      setPackageLines((linesResult.data || []) as PaymentPackageLine[]);
    }

    if (movementsResult.error) {
      setBankMovements([]);
    } else {
      setBankMovements(
        ((movementsResult.data || []) as PaymentPackageBankMovement[]).filter((movement) => {
          const source = normalizeText(movement.source_file_name || "");
          return !source.includes("ctas") && !source.includes("cuentas bancarias") && !source.includes("proveedores.xlsx");
        }),
      );
    }

    if (observationsResult.error) {
      setErrorMessage(`No se pudieron cargar observaciones del paquete: ${observationsResult.error.message}`);
      setPackageObservations([]);
    } else {
      setPackageObservations((observationsResult.data || []) as PaymentPackageObservation[]);
    }
  }

  async function createPackageFromFiles() {
    if (!userProfile?.organization_id) return;

    const files = Array.from(fileInputRef.current?.files ?? []) as File[];

    if (!packageName.trim()) {
      setErrorMessage("Debes indicar el nombre del paquete.");
      return;
    }

    if (files.length === 0) {
      setErrorMessage("Debes seleccionar al menos un ZIP o archivo.");
      return;
    }

    setCreating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const selectedPaymentDate = normalizeDateForDb(paymentDate) || today.toISOString().slice(0, 10);
      const paymentDateObject = new Date(`${selectedPaymentDate}T00:00:00`);
      const week = getWeekPeriod(paymentDateObject);
      setShowProcessingProgress(true);
      setFileProcessingProgress([]);
      const drafts = await buildPackageFileDrafts(files, setFileProcessingProgress);

      const { data: packageData, error: packageError } = await supabase
        .from("payment_packages")
        .insert({
          organization_id: userProfile.organization_id,
          package_name: packageName.trim(),
          payment_date: selectedPaymentDate,
          week_year: week.monday.getFullYear(),
          week_number: week.weekNumber,
          week_start: week.monday.toISOString().slice(0, 10),
          week_end: week.sunday.toISOString().slice(0, 10),
          status: "borrador",
          prepared_by_name: roleLabel,
          prepared_by_email: userProfile.email,
          notes: "Paquete creado desde módulo Cuentas por pagar.",
        })
        .select("*")
        .single();

      if (packageError) throw packageError;

      const newPackage = packageData as PaymentPackage;

      let insertedFiles: PaymentPackageFile[] = [];
      let insertedBankMovements: PaymentPackageBankMovement[] = [];
      let insertedPackageLines: PaymentPackageLine[] = [];

      if (drafts.length > 0) {
        const { data: filesData, error: filesError } = await supabase
          .from("payment_package_files")
          .insert(
            drafts.map((draft) => ({
              package_id: newPackage.id,
              organization_id: userProfile.organization_id,
              file_name: draft.file_name,
              file_type: draft.file_type,
              file_category: draft.file_category,
              source: draft.source,
              file_size: draft.file_size,
              uploaded_by_name: roleLabel,
              uploaded_by_email: userProfile.email,
              parse_status: draft.file_type === "error" ? "error" : "pendiente",
              parse_message: draft.file_type === "error" ? "No se pudo procesar este archivo." : null,
              raw_metadata: draft.raw_metadata,
            })),
          )
          .select("*");

        if (filesError) throw filesError;

        insertedFiles = (filesData || []) as PaymentPackageFile[];
      }

      const bankStatementDrafts = drafts.filter(
        (draft) =>
          draft.file_category !== "cuentas_bancarias" &&
          draft.file_category !== "registro_sii" &&
          isBankStatementDraft(draft),
      );
      const bankMovementPayload = bankStatementDrafts.flatMap((draft) => {
        const relatedFile = insertedFiles.find((file) => file.file_name === draft.file_name);
        return extractBankStatementMovementsFromDraft(draft).map((movement) =>
          statementMovementToDbPayload(
            movement,
            newPackage.id,
            userProfile.organization_id,
            relatedFile?.id || null,
          ),
        );
      });

      if (bankMovementPayload.length > 0) {
        const { data: movementsData, error: movementsError } = await supabase
          .from("payment_package_bank_movements")
          .insert(bankMovementPayload)
          .select("*");

        if (movementsError) throw movementsError;

        insertedBankMovements = (movementsData || []) as PaymentPackageBankMovement[];

        await upsertPaymentHistoryMovements(
          insertedBankMovements.map(dbMovementToStatementMovement),
          userProfile.organization_id,
          newPackage.id,
          null,
          roleLabel,
          userProfile.email,
        );
      }

      const importedBankAccounts = extractBankAccountsFromDrafts(
        drafts,
        userProfile.organization_id,
        roleLabel,
        userProfile.email,
      );

      if (importedBankAccounts.length > 0) {
        const { error: accountsError } = await supabase
          .from("supplier_bank_accounts")
          .upsert(importedBankAccounts, { onConflict: "organization_id,supplier_rut" });

        if (accountsError) throw accountsError;
      }

      const { data: masterAccountsData, error: masterAccountsError } = await supabase
        .from("supplier_bank_accounts")
        .select("*")
        .eq("organization_id", userProfile.organization_id)
        .eq("active", true);

      if (masterAccountsError) throw masterAccountsError;

      const packageLineDrafts = buildReportLinesFromDrafts(
        drafts,
        insertedFiles,
        userProfile.organization_id,
        newPackage.id,
        (masterAccountsData || []) as SupplierBankAccount[],
      );

      if (packageLineDrafts.length > 0) {
        const { data: linesData, error: linesError } = await supabase
          .from("payment_package_lines")
          .insert(packageLineDrafts)
          .select("*");

        if (linesError) throw linesError;

        insertedPackageLines = (linesData || []) as PaymentPackageLine[];

        const totalRequested = insertedPackageLines.reduce(
          (sum, line) => sum + Number(line.payment_amount || 0),
          0,
        );

        const { error: totalsError } = await supabase
          .from("payment_packages")
          .update({
            total_requested: totalRequested,
            payment_count: packageLineDrafts.length,
          })
          .eq("id", newPackage.id);

        if (totalsError) throw totalsError;

        newPackage.total_requested = totalRequested;
        newPackage.payment_count = packageLineDrafts.length;
      }

      if (insertedPackageLines.length > 0) {
        const currentStatementMovements = insertedBankMovements.map(dbMovementToStatementMovement);
        const historicalStatementMovements = await loadPaymentHistoryStatementMovements(userProfile.organization_id);
        const statementMovements = mergeStatementMovements(currentStatementMovements, historicalStatementMovements);
        const usedMovementIndexes = new Set<number>();

        for (const line of insertedPackageLines) {
          const bestMatch = statementMovements.reduce<{
            index: number;
            movement: BankStatementMovement | null;
            score: number;
          }>(
            (current, movement, index) => {
              if (usedMovementIndexes.has(index)) return current;

              const score = scorePaymentMatch(line, movement);

              if (score > current.score) {
                return { index, movement, score };
              }

              return current;
            },
            { index: -1, movement: null, score: 0 },
          );

          const fallbackMatch =
            bestMatch.score >= 70
              ? bestMatch
              : findUniqueAmountFallbackMatch(line, insertedPackageLines.indexOf(line), insertedPackageLines, statementMovements, usedMovementIndexes);

          const patch = buildBankMovementMatchPatch(
            line,
            fallbackMatch.movement,
            fallbackMatch.score,
            fallbackMatch.movement?.sourceFile || "Cartola bancaria",
          );

          const { error: linePatchError } = await supabase
            .from("payment_package_lines")
            .update({ raw_data: patch.raw_data })
            .eq("id", line.id);

          if (linePatchError) throw linePatchError;

          if (fallbackMatch.movement && fallbackMatch.score >= 70 && fallbackMatch.index >= 0) {
            usedMovementIndexes.add(fallbackMatch.index);

            const movementId = insertedBankMovements[fallbackMatch.index]?.id;

            if (movementId) {
              const { error: movementPatchError } = await supabase
                .from("payment_package_bank_movements")
                .update({
                  match_status: patch.paymentStatus,
                  matched_line_id: line.id,
                  match_score: fallbackMatch.score,
                })
                .eq("id", movementId);

              if (movementPatchError) throw movementPatchError;
            }
          }
        }
      }

      const { error: logError } = await supabase.from("payment_package_approvals").insert({
        package_id: newPackage.id,
        organization_id: userProfile.organization_id,
        action: "creado",
        previous_status: null,
        new_status: "borrador",
        actor_name: roleLabel,
        actor_email: userProfile.email,
        actor_role: userProfile.role,
        message: `Paquete creado con ${drafts.length} archivo(s) detectados.`,
      });

      if (logError) throw logError;

      setPackageName("");
      setPaymentDate("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMessage(
        insertedBankMovements.length > 0
          ? "Paquete creado. La cartola bancaria quedó guardada como Cartola leída y no se mezcló con las facturas."
          : "Paquete creado. Ahora puedes revisar facturas y avanzar el flujo.",
      );
      await loadPackages();
      await loadPackageDetail(newPackage);
    } catch (error) {
      console.error("Error creando paquete de pagos:", error);
      const detail =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String((error as { message?: unknown }).message)
            : "Error desconocido.";

      setErrorMessage(`No se pudo crear el paquete: ${detail}`);
    } finally {
      setCreating(false);
    }
  }

  async function updatePackageStatus(
    nextStatus: string,
    action: string,
    message: string,
    extraFields: Record<string, unknown> = {},
    observationMessage = "",
  ) {
    if (!selectedPackage || !userProfile?.organization_id) return;

    setProcessingAction(action);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase
        .from("payment_packages")
        .update({
          status: nextStatus,
          ...extraFields,
        })
        .eq("id", selectedPackage.id)
        .select("*")
        .single();

      if (error) throw error;

      const { error: logError } = await supabase.from("payment_package_approvals").insert({
        package_id: selectedPackage.id,
        organization_id: userProfile.organization_id,
        action,
        previous_status: selectedPackage.status,
        new_status: nextStatus,
        actor_name: roleLabel,
        actor_email: userProfile.email,
        actor_role: userProfile.role,
        message,
      });

      if (logError) throw logError;

      if (observationMessage.trim()) {
        const { data: observationData, error: observationError } = await supabase
          .from("payment_package_observations")
          .insert({
            package_id: selectedPackage.id,
            organization_id: userProfile.organization_id,
            observation_type: action,
            message: observationMessage.trim(),
            created_by_name: roleLabel,
            created_by_email: userProfile.email,
          })
          .select("*")
          .single();

        if (observationError) throw observationError;

        setPackageObservations((current) => [
          observationData as PaymentPackageObservation,
          ...current,
        ]);
      }

      const updated = data as PaymentPackage;
      setSelectedPackage(updated);
      setPackages((current) => current.map((pkg) => (pkg.id === updated.id ? updated : pkg)));
      setSuccessMessage(message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar el paquete.");
    } finally {
      setProcessingAction("");
    }
  }

  async function submitPackageReviewDecision() {
    if (!reviewModal.nextStatus || !selectedPackage || !userProfile) return;

    if (!reviewComment.trim()) {
      setErrorMessage("Debes escribir el motivo u observación antes de continuar.");
      return;
    }

    const now = new Date().toISOString();

    if (reviewModal.nextStatus === "observado") {
      await updatePackageStatus(
        "observado",
        "observado",
        "Paquete observado. Se solicitó corrección antes de enviar a revisión.",
        {
          reviewed_by_name: roleLabel,
          reviewed_by_email: userProfile.email,
          reviewed_at: now,
          notes: reviewComment.trim(),
        },
        reviewComment,
      );
    }

    if (reviewModal.nextStatus === "rechazado") {
      await updatePackageStatus(
        "rechazado",
        "rechazado",
        "Paquete rechazado por revisión.",
        {
          rejected_by_name: roleLabel,
          rejected_by_email: userProfile.email,
          rejected_at: now,
          rejection_reason: reviewComment.trim(),
          notes: reviewComment.trim(),
        },
        reviewComment,
      );
    }

    setReviewModal({ open: false, nextStatus: "", title: "", action: "" });
    setReviewComment("");
  }

  async function deleteSelectedPackage() {
    if (!selectedPackage || !userProfile?.organization_id) return;

    const confirmed = window.confirm(
      `¿Eliminar el paquete "${selectedPackage.package_name}"? Esta acción elimina archivos, líneas y observaciones asociadas al paquete.`,
    );

    if (!confirmed) return;

    setProcessingAction("delete-package");
    setErrorMessage("");
    setSuccessMessage("");
    setMacroMessage("");

    try {
      const { error } = await supabase
        .from("payment_packages")
        .delete()
        .eq("id", selectedPackage.id)
        .eq("organization_id", userProfile.organization_id);

      if (error) throw error;

      setPackages((current) => current.filter((pkg) => pkg.id !== selectedPackage.id));
      setSelectedPackage(null);
      setPackageFiles([]);
      setPackageLines([]);
      setPackageObservations([]);
      setSuccessMessage("Paquete eliminado. Puedes crear uno nuevo con los archivos corregidos.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar el paquete.");
    } finally {
      setProcessingAction("");
    }
  }

  function splitRutForBancoChile(value: string) {
    const clean = String(value || "")
      .replace(/\./g, "")
      .replace(/-/g, "")
      .replace(/\s/g, "")
      .toUpperCase();

    if (clean.length < 2) {
      return { number: "", dv: "" };
    }

    return {
      number: clean.slice(0, -1),
      dv: clean.slice(-1),
    };
  }

  function cleanBancoChileCell(value: string, maxLength = 80) {
    return String(value || "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  async function generatePreliminaryBchMacroReview() {
    if (!selectedPackage) return;

    setMacroMessage("");
    setErrorMessage("");

    const payableLines = packageLines.filter((line) => {
      const amount = getSafeLineAmount(line);
      return amount > 0 && line.reviewer_decision !== "rechazado";
    });

    if (payableLines.length === 0) {
      setErrorMessage(
        "Todavía no hay líneas válidas para generar el archivo Banco Chile. Primero debe existir el detalle de pago con proveedor, monto y cuenta.",
      );
      return;
    }

    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const totalAmount = payableLines.reduce(
      (sum, line) => sum + Number(line.payment_amount || line.invoice_amount || 0),
      0,
    );

    const paymentDate = selectedPackage.payment_date
      ? formatDate(selectedPackage.payment_date)
      : formatDate(new Date().toISOString());

    const rutEmpresaRaw = "79587660";
    const dvEmpresa = "K";
    const codigoConvenio = "602";

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Rut Empresa Num",
          "Rut Empresa DV",
          "Código Convenio",
          "Nombre Nomina",
          "Monto Total del Pago",
          "Fecha de Pago (dd/mm/aaaa)",
          "Tipo Pago",
          "",
          "N° Registros",
          "Sumatoria Monto Nomina",
        ],
        [
          rutEmpresaRaw,
          dvEmpresa,
          codigoConvenio,
          "Proveedores",
          totalAmount,
          paymentDate,
          "Proveedores",
          "",
          payableLines.length,
          totalAmount,
        ],
        [],
        [
          "Rut Beneficiario",
          "Dv",
          "Nombre Beneficiario",
          "Medio de Pago",
          "Banco",
          "Cuenta Corriente o vista",
          "Monto",
          "Descripcion del Pago",
          "Email Beneficiario",
          "Acumula Vale Vista",
        ],
      ],
      { origin: "A1" },
    );

    const rows = payableLines.map((line) => {
      const rutParts = splitRutForBancoChile(line.supplier_rut || "");
      const bank = line.supplier_bank || "";
      const normalizedBank = normalizeText(bank);
      const paymentMethod = normalizedBank.includes("chile")
        ? "Abono en Cuenta Corriente del Banco de Chile"
        : "Abono en Cuenta Corriente de Otros Bancos";

      const beneficiaryName = cleanBancoChileCell(line.supplier_name || "Proveedor sin nombre", 80);
      const description = cleanBancoChileCell(
        [
          line.document_folio || "",
          line.observation || "",
        ]
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
        80,
      );

      return [
        rutParts.number,
        rutParts.dv,
        beneficiaryName,
        paymentMethod,
        bank,
        line.supplier_account_number || "",
        Number(line.payment_amount || line.invoice_amount || 0),
        description,
        line.supplier_email || "",
        "No",
      ];
    });

    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A5" });

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 14 },
      { wch: 34 },
      { wch: 42 },
      { wch: 28 },
      { wch: 24 },
      { wch: 16 },
      { wch: 30 },
      { wch: 30 },
      { wch: 20 },
      { wch: 4 },
      { wch: 24 },
    ];

    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, worksheet, "Macro Banco Chile");

    const fileName = `macro_banco_chile_${safeFileName(selectedPackage.package_name)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setMacroMessage(
      "Archivo Banco Chile generado con el formato actualizado: RUT empresa, convenio, RUT/DV beneficiario, nombre, medio de pago, banco, cuenta, monto, descripción, email y vale vista.",
    );
  }

  function openSupplierAccountModal(line: PaymentPackageLine) {
    setAccountModal({
      open: true,
      line,
      supplierName: line.supplier_name || "",
      supplierRut: line.supplier_rut || "",
      bank: line.supplier_bank || "",
      accountType: line.supplier_account_type || "",
      accountNumber: line.supplier_account_number || "",
      email: line.supplier_email || "",
    });
  }

  async function importBankAccountsFromFile(event: ChangeEvent<HTMLInputElement>) {
    if (!userProfile?.organization_id) return;

    const file = event.target.files?.[0];

    if (!file) return;

    setProcessingAction("importar_cuentas");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const draft = await buildBankAccountFileDraft(file);
      const accounts = extractBankAccountsFromDrafts(
        [draft],
        userProfile.organization_id,
        roleLabel,
        userProfile.email,
      );

      if (accounts.length === 0) {
        setErrorMessage("No se encontraron cuentas bancarias válidas. Revisa que el archivo tenga RUT, banco y cuenta.");
        return;
      }

      const { error: accountsError } = await supabase
        .from("supplier_bank_accounts")
        .upsert(accounts, { onConflict: "organization_id,supplier_rut" });

      if (accountsError) throw accountsError;

      let appliedLines = 0;

      if (packageLines.length > 0) {
        for (const account of accounts) {
          const matchingLines = packageLines.filter(
            (line) => normalizeRutNumberOnly(line.supplier_rut || "") === normalizeRutNumberOnly(account.supplier_rut),
          );

          if (matchingLines.length === 0) continue;

          appliedLines += matchingLines.length;

          const { error: linesError } = await supabase
            .from("payment_package_lines")
            .update({
              supplier_bank: account.bank || null,
              supplier_account_type: account.account_type || null,
              supplier_account_number: account.account_number || null,
              supplier_email: account.beneficiary_email || null,
              validation_status: "pendiente_revision",
              observation: "Cuenta bancaria encontrada en maestro de proveedores. Revisar antes de enviar a revisión.",
            })
            .in("id", matchingLines.map((line) => line.id));

          if (linesError) throw linesError;
        }
      }

      setSuccessMessage(
        `Se importaron ${accounts.length} cuenta(s) al maestro de proveedores y se aplicaron ${appliedLines} línea(s) del paquete actual.`,
      );

      if (selectedPackage) await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo importar el archivo de cuentas bancarias.");
    } finally {
      setProcessingAction("");
      if (event.target) event.target.value = "";
    }
  }

  async function reprocessBankStatementMatch(movementsInput?: BankStatementMovement[], sourceFileName = "Cartola bancaria") {
    if (!selectedPackage) return;

    const currentMovements = movementsInput || bankMovements.map(dbMovementToStatementMovement);
    const historicalMovements = userProfile?.organization_id
      ? await loadPaymentHistoryStatementMovements(userProfile.organization_id)
      : [];
    const movements = mergeStatementMovements(currentMovements, historicalMovements);

    if (movements.length === 0) {
      setErrorMessage("No hay nómina/cartola en el histórico. Primero importa la nómina del banco.");
      return;
    }

    setProcessingAction("reprocesar_cartola");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let paidCount = 0;
      let pendingCount = 0;
      let rejectedCount = 0;
      let unpaidCount = 0;
      const usedMovementIndexes = new Set<number>();

      for (const line of packageLines) {
        const bestMatch = movements.reduce<{
          index: number;
          movement: BankStatementMovement | null;
          score: number;
        }>(
          (current, movement, index) => {
            if (usedMovementIndexes.has(index)) return current;

            const score = scorePaymentMatch(line, movement);

            if (score > current.score) {
              return { index, movement, score };
            }

            return current;
          },
          { index: -1, movement: null, score: 0 },
        );

        const fallbackMatch =
          bestMatch.score >= 70
            ? bestMatch
            : findUniqueAmountFallbackMatch(line, packageLines.indexOf(line), packageLines, movements, usedMovementIndexes);

        const bestMovement = fallbackMatch.movement;
        const bestScore = fallbackMatch.score;
        const bestMovementIndex = fallbackMatch.index;
        const patch = buildBankMovementMatchPatch(line, bestMovement, bestScore, sourceFileName);

        if (bestMovement && bestScore >= 70 && bestMovementIndex >= 0) usedMovementIndexes.add(bestMovementIndex);

        if (patch.paymentStatus === "pagado_cartola") paidCount += 1;
        else if (patch.paymentStatus === "rechazado") rejectedCount += 1;
        else if (patch.paymentStatus === "pendiente") pendingCount += 1;
        else unpaidCount += 1;

        const { error: updateError } = await supabase
          .from("payment_package_lines")
          .update({ raw_data: patch.raw_data })
          .eq("id", line.id);

        if (updateError) throw updateError;

        if (bestMovement && bestScore >= 70) {
          await supabase
            .from("payment_package_bank_movements")
            .update({
              match_status: patch.paymentStatus,
              matched_line_id: line.id,
              match_score: bestScore,
            })
            .eq("package_id", selectedPackage.id)
            .eq("amount", bestMovement.amount)
            .eq("source_file_name", bestMovement.sourceFile)
            .is("matched_line_id", null);
        }
      }

      setSuccessMessage(
        `Cruce reprocesado. Pagado: ${paidCount} · Pendiente: ${pendingCount} · Rechazado: ${rejectedCount} · No encontrado: ${unpaidCount}.`,
      );

      await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo reprocesar el cruce con la cartola.");
    } finally {
      setProcessingAction("");
    }
  }

  function openMovePaymentModal(line: PaymentPackageLine) {
    const currentScheduled = getLineScheduledPaymentDate(line);
    const currentRaw = (line.raw_data || {}) as Record<string, unknown>;

    setMovePaymentModal({
      open: true,
      line,
      scheduledDate: currentScheduled || line.due_date || selectedPackage?.payment_date || "",
      reason: String(currentRaw.reschedule_reason || "Programación manual desde detalle de factura."),
    });
  }

  async function saveMovePaymentWeek() {
    if (!selectedPackage || !userProfile?.organization_id || !movePaymentModal.line) return;

    const scheduledDate = normalizeDateForDb(movePaymentModal.scheduledDate);

    if (!scheduledDate) {
      setErrorMessage("Debes indicar una fecha válida para mover el pago.");
      return;
    }

    if (!movePaymentModal.reason.trim()) {
      setErrorMessage("Debes indicar el motivo de la programación.");
      return;
    }

    setProcessingAction("mover_pago");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const line = movePaymentModal.line;
      const currentRaw = (line.raw_data || {}) as Record<string, unknown>;
      const updatedRaw = {
        ...currentRaw,
        scheduled_payment_date: scheduledDate,
        reschedule_reason: movePaymentModal.reason.trim(),
        rescheduled_by_name: roleLabel,
        rescheduled_by_email: userProfile.email,
        rescheduled_by_role: userProfile.role,
        rescheduled_at: new Date().toISOString(),
      };

      const { error: lineError } = await supabase
        .from("payment_package_lines")
        .update({
          raw_data: updatedRaw,
          observation: [
            line.observation || "",
            `Pago programado para ${formatDate(scheduledDate)}. Motivo: ${movePaymentModal.reason.trim()}`,
          ]
            .filter(Boolean)
            .join(" | "),
        })
        .eq("id", line.id);

      if (lineError) throw lineError;

      const { error: observationError } = await supabase.from("payment_package_observations").insert({
        package_id: selectedPackage.id,
        line_id: line.id,
        organization_id: userProfile.organization_id,
        observation_type: "reprogramacion_pago",
        message: [
          `Pago programado en otra fecha por ${roleLabel}.`,
          `Proveedor: ${line.supplier_name || "Sin proveedor"}`,
          `Factura: ${line.document_folio || "-"}`,
          `Monto: ${formatMoney(getSafeLineAmount(line))}`,
          `Nueva fecha propuesta: ${formatDate(scheduledDate)}`,
          `Motivo: ${movePaymentModal.reason.trim()}`,
        ].join("\n"),
        created_by_name: roleLabel,
        created_by_email: userProfile.email,
      });

      if (observationError) throw observationError;

      setMovePaymentModal({ open: false, line: null, scheduledDate: "", reason: "" });
      setSuccessMessage("Pago programado en otra fecha y registrado para revisión.");
      await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo programar la fecha del pago.");
    } finally {
      setProcessingAction("");
    }
  }

  async function importBankStatementFromFile(event: ChangeEvent<HTMLInputElement>) {
    if (!userProfile?.organization_id || !selectedPackage) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingAction("importar_cartola");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const draft = await buildBankStatementFileDraft(file);

      const { data: insertedFile, error: fileError } = await supabase
        .from("payment_package_files")
        .insert({
          package_id: selectedPackage.id,
          organization_id: userProfile.organization_id,
          file_name: draft.file_name,
          file_type: draft.file_type,
          file_category: draft.file_category,
          source: draft.source,
          file_size: draft.file_size,
          uploaded_by_name: roleLabel,
          uploaded_by_email: userProfile.email,
          parse_status: "procesado",
          parse_message: "Cartola de pagos importada para cruce.",
          raw_metadata: draft.raw_metadata,
        })
        .select("id")
        .single();

      if (fileError) throw fileError;

      const movements = extractBankStatementMovementsFromDraft(draft);

      if (movements.length === 0) {
        setErrorMessage(
          "No se encontraron pagos válidos en la cartola. La app necesita ver una tabla con Rut, Nombre/Razón social, Monto($), Fecha de Pago, Institución, Cuenta y Estado.",
        );
        return;
      }

      const { error: deleteOldMovementsError } = await supabase
        .from("payment_package_bank_movements")
        .delete()
        .eq("package_id", selectedPackage.id);

      if (deleteOldMovementsError) throw deleteOldMovementsError;

      const movementPayload = movements.map((movement) =>
        statementMovementToDbPayload(
          movement,
          selectedPackage.id,
          userProfile.organization_id,
          insertedFile?.id || null,
        ),
      );

      const { data: insertedMovementsData, error: movementsError } = await supabase
        .from("payment_package_bank_movements")
        .insert(movementPayload)
        .select("*");

      if (movementsError) throw movementsError;

      const insertedMovements = (insertedMovementsData || []) as PaymentPackageBankMovement[];

      await upsertPaymentHistoryMovements(
        insertedMovements.map(dbMovementToStatementMovement),
        userProfile.organization_id,
        selectedPackage.id,
        insertedFile?.id || null,
        roleLabel,
        userProfile.email,
      );

      setSuccessMessage(`Cartola leída y guardada en histórico: ${movements.length} movimiento(s). Ejecutando cruce contra facturas...`);

      await reprocessBankStatementMatch(movements, draft.file_name);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo importar la cartola de pagos.");
    } finally {
      setProcessingAction("");
      if (event.target) event.target.value = "";
    }
  }

  async function saveSupplierAccount() {
    if (!userProfile?.organization_id || !accountModal.line) return;

    if (!accountModal.supplierRut.trim()) {
      setErrorMessage("Falta el RUT del proveedor para guardar la cuenta.");
      return;
    }

    if (!accountModal.accountNumber.trim()) {
      setErrorMessage("Debes ingresar la cuenta corriente o vista.");
      return;
    }

    setProcessingAction("guardar_cuenta");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const accountPayload = {
        organization_id: userProfile.organization_id,
        supplier_rut: accountModal.supplierRut.trim(),
        supplier_name: accountModal.supplierName.trim() || null,
        bank: accountModal.bank.trim() || null,
        account_type: accountModal.accountType.trim() || null,
        account_number: accountModal.accountNumber.trim(),
        beneficiary_email: accountModal.email.trim() || null,
        active: true,
        source: "manual_app",
        updated_by_name: roleLabel,
        updated_by_email: userProfile.email,
        created_by_name: roleLabel,
        created_by_email: userProfile.email,
      };

      const { error: accountError } = await supabase
        .from("supplier_bank_accounts")
        .upsert(accountPayload, { onConflict: "organization_id,supplier_rut" });

      if (accountError) throw accountError;

      const matchingLines = packageLines.filter(
        (line) => normalizeRutNumberOnly(line.supplier_rut || "") === normalizeRutNumberOnly(accountModal.supplierRut),
      );

      if (matchingLines.length > 0) {
        const ids = matchingLines.map((line) => line.id);
        const { error: linesError } = await supabase
          .from("payment_package_lines")
          .update({
            supplier_bank: accountModal.bank.trim() || null,
            supplier_account_type: accountModal.accountType.trim() || null,
            supplier_account_number: accountModal.accountNumber.trim(),
            supplier_email: accountModal.email.trim() || null,
            validation_status: "pendiente_revision",
            observation: "Cuenta bancaria agregada desde maestro de proveedores. Revisar antes de enviar a revisión.",
          })
          .in("id", ids);

        if (linesError) throw linesError;
      }

      setAccountModal({
        open: false,
        line: null,
        supplierName: "",
        supplierRut: "",
        bank: "",
        accountType: "",
        accountNumber: "",
        email: "",
      });

      setSuccessMessage("Cuenta bancaria guardada y aplicada al paquete actual.");
      if (selectedPackage) await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la cuenta bancaria.");
    } finally {
      setProcessingAction("");
    }
  }

  async function generatePaymentReviewExcel() {
    if (!selectedPackage) return;

    setErrorMessage("");
    setMacroMessage("");

    if (packageLines.length === 0 && extractedContentRows.length === 0) {
      setErrorMessage("No hay información procesada para exportar. Primero carga y analiza los archivos del paquete.");
      return;
    }

    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();

    const packageDate = selectedPackage.created_at || selectedPackage.prepared_at || new Date().toISOString();
    const weekNumber = selectedPackage.week_number || getIsoWeekNumber(new Date(packageDate));

    const detailRows = packageLines.map((line) => {
      const raw = (line.raw_data || {}) as Record<string, unknown>;
      const extractedTotal = Number(raw.extracted_total_amount || 0);
      const extractedNet = Number(raw.extracted_net_amount || 0);
      const rawTotalAmount = Number(line.payment_amount || line.invoice_amount || extractedTotal || 0);
      const sourceType = String(raw.source_type || "");
      const totalAmount = sanitizeDisplayAmountBySource(rawTotalAmount, line.supplier_rut, sourceType);
      const netAmount = totalAmount !== 0
        ? sourceType === "sii_registro_compras"
          ? Number(extractedNet || 0)
          : sanitizeDisplayAmount(extractedNet || estimateNetAmount(Math.abs(totalAmount)), line.supplier_rut)
        : 0;
      const amountWarning = sourceType === "sii_registro_compras" ? "" : buildAmountObservation(rawTotalAmount, line.supplier_rut);

      return {
        "Fecha carga": formatExcelDate(packageDate),
        "Week": weekNumber,
        "Proveedor": line.supplier_name || "Sin proveedor",
        "Rut": line.supplier_rut || "",
        "Empresa": line.company_name || "Por definir",
        "Tipo de documento": line.document_type || "Por definir",
        "Número de factura": line.document_folio || "",
        "Fecha facturación": formatExcelDate(line.issue_date),
        "Vencimiento / fecha propuesta": formatExcelDate(line.due_date),
        "Moneda": "CLP",
        "Monto neto": netAmount,
        "IVA": Number(raw.extracted_iva_amount || 0),
        "Monto exento": Number(raw.extracted_exempt_amount || 0),
        "Monto total": totalAmount,
        "Artículo": extractArticleFromLine(line),
        "Fuente": String(raw.source_type || ""),
        "Banco": line.supplier_bank || "",
        "Tipo cuenta": line.supplier_account_type || "",
        "Cuenta corriente o vista": line.supplier_account_number || "",
        "Email proveedor": line.supplier_email || "",
        "Plan de pago": getLinePaymentPlanLabel(line, selectedPackage),
        "Fecha programada": getLineScheduledPaymentDate(line) ? formatExcelDate(getLineScheduledPaymentDate(line)) : "",
        "Pago banco": getLinePaymentStatusLabel(line),
        "Detalle pago banco": getLinePaymentDetail(line),
        "Criterio": getLinePaymentPlanObservation(line, selectedPackage),
        "Estado revisión": getLineStatusLabel(line.validation_status),
        "% Datos correctos": `${getLineConfidence(line)}%`,
        "Observación": [buildLineMissingDataText(line), line.observation || "", amountWarning].filter(Boolean).join(" | "),
        "Archivo origen": String(raw.source_file || ""),
      };
    });

    const rawRows = extractedContentRows.map((row) => ({
      "Archivo": row.fileName,
      "Tipo": getCategoryLabel(row.category),
      "Hoja": row.sheet || "",
      "Fila / línea": row.rowNumber || "",
      "Columna": row.column || "",
      "Valor leído": row.value,
    }));

    const byCompany = Array.from(
      packageLines.reduce((map, line) => {
        const company = line.company_name || "Por definir";
        const current = map.get(company) || {
          Empresa: company,
          "Documentos": 0,
          "Monto total": 0,
          "Monto neto estimado": 0,
        };

        const amount = Number(line.invoice_amount || line.payment_amount || 0);
        current.Documentos += 1;
        current["Monto total"] += amount;
        current["Monto neto estimado"] += estimateNetAmount(amount);

        map.set(company, current);
        return map;
      }, new Map<string, { Empresa: string; Documentos: number; "Monto total": number; "Monto neto estimado": number }>()).values(),
    ).sort((a, b) => b["Monto total"] - a["Monto total"]);

    const bySupplier = Array.from(
      packageLines.reduce((map, line) => {
        const supplier = line.supplier_name || "Sin proveedor";
        const current = map.get(supplier) || {
          Proveedor: supplier,
          "Razón social": supplier,
          Rut: line.supplier_rut || "",
          Documentos: 0,
          "Monto total": 0,
          Banco: line.supplier_bank || "",
          "Tipo cuenta": line.supplier_account_type || "",
          "Cuenta corriente o vista": line.supplier_account_number || "",
          "Email proveedor": line.supplier_email || "",
        };

        const amount = Number(line.invoice_amount || line.payment_amount || 0);
        current.Documentos += 1;
        current["Monto total"] += amount;

        if (!current.Rut && line.supplier_rut) current.Rut = line.supplier_rut;
        if (!current.Banco && line.supplier_bank) current.Banco = line.supplier_bank;
        if (!current["Tipo cuenta"] && line.supplier_account_type) current["Tipo cuenta"] = line.supplier_account_type;
        if (!current["Cuenta corriente o vista"] && line.supplier_account_number) {
          current["Cuenta corriente o vista"] = line.supplier_account_number;
        }
        if (!current["Email proveedor"] && line.supplier_email) current["Email proveedor"] = line.supplier_email;

        map.set(supplier, current);
        return map;
      }, new Map<string, {
        Proveedor: string;
        "Razón social": string;
        Rut: string;
        Documentos: number;
        "Monto total": number;
        Banco: string;
        "Tipo cuenta": string;
        "Cuenta corriente o vista": string;
        "Email proveedor": string;
      }>()).values(),
    ).sort((a, b) => b["Monto total"] - a["Monto total"]);

    const detailSheet = XLSX.utils.json_to_sheet(detailRows);
    const companySheet = XLSX.utils.json_to_sheet(byCompany);
    const supplierSheet = XLSX.utils.json_to_sheet(bySupplier);
    const rawSheet = XLSX.utils.json_to_sheet(rawRows);

    detailSheet["!cols"] = [
      { wch: 14 },
      { wch: 8 },
      { wch: 42 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 48 },
      { wch: 24 },
      { wch: 18 },
      { wch: 24 },
      { wch: 30 },
      { wch: 18 },
      { wch: 38 },
      { wch: 34 },
    ];

    detailSheet["!autofilter"] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(detailSheet["!ref"] || "A1:T1")) };
    detailSheet["!freeze"] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, detailSheet, "Detalle para Pago");
    XLSX.utils.book_append_sheet(workbook, companySheet, "Sociedades");
    XLSX.utils.book_append_sheet(workbook, supplierSheet, "Proveedores");
    XLSX.utils.book_append_sheet(workbook, rawSheet, "Contenido Leido");

    const fileName = `detalle_pago_previo_macro_${safeFileName(selectedPackage.package_name)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setMacroMessage("Excel generado con el formato solicitado: Detalle para Pago, Sociedades, Proveedores y Contenido Leído.");
  }

  async function returnPackageToDraft() {
    if (!selectedPackage || !userProfile) return;

    await updatePackageStatus(
      "borrador",
      "devuelto_borrador",
      "Paquete devuelto a borrador para corrección.",
      {
        reviewed_by_name: roleLabel,
        reviewed_by_email: userProfile.email,
        reviewed_at: new Date().toISOString(),
      },
    );
  }

  async function deletePackageFile(file: PaymentPackageFile) {
    const confirmed = window.confirm(
      `¿Eliminar el archivo "${file.file_name}" de este paquete? Esta acción no borra el archivo original del correo, solo lo saca de la revisión.`,
    );

    if (!confirmed) return;

    setProcessingAction(`delete-file-${file.id}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.from("payment_package_files").delete().eq("id", file.id);

      if (error) throw error;

      setPackageFiles((current) => current.filter((item) => item.id !== file.id));
      setSuccessMessage("Archivo eliminado del paquete.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar el archivo.");
    } finally {
      setProcessingAction("");
    }
  }

  async function updateLineDecision(line: PaymentPackageLine, decision: string) {
    if (!userProfile?.organization_id) return;

    const validationStatus =
      decision === "aprobar"
        ? "ok"
        : decision === "rechazar"
          ? "rechazado"
          : decision === "excluir"
            ? "excluir"
            : "observado";

    setProcessingAction(`line-${line.id}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase
        .from("payment_package_lines")
        .update({
          reviewer_decision: decision,
          validation_status: validationStatus,
        })
        .eq("id", line.id)
        .select("*")
        .single();

      if (error) throw error;

      setPackageLines((current) =>
        current.map((item) => (item.id === line.id ? (data as PaymentPackageLine) : item)),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar la línea.");
    } finally {
      setProcessingAction("");
    }
  }

  function toggleProposalGroup(groupKey: string) {
    setExpandedProposalGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  }

  async function updateProposalGroupDecision(group: WeeklyPaymentProposalGroup, decision: "aprobar" | "observar" | "rechazar" | "excluir") {
    const actionableLines = group.sourceLines.filter((line) => !isLineCreditNote(line));

    for (const line of actionableLines) {
      await updateLineDecision(line, decision);
    }
  }

  async function markProposalGroupAsPaidManual(group: WeeklyPaymentProposalGroup) {
    if (!selectedPackage || !userProfile?.organization_id) return;

    const confirmed = window.confirm(
      `¿Marcar como pagado manual el pago a ${group.supplierName} por ${formatMoney(group.amountToPay)}?`,
    );

    if (!confirmed) return;

    setProcessingAction(`paid-manual-${group.key}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payableLines = group.sourceLines.filter((line) => !isLineCreditNote(line));

      for (const line of payableLines) {
        const currentRaw = (line.raw_data || {}) as Record<string, unknown>;

        const { error } = await supabase
          .from("payment_package_lines")
          .update({
            raw_data: {
              ...currentRaw,
              payment_status: "pagado_manual",
              payment_reason: "Pago marcado manualmente desde propuesta semanal.",
              payment_solution: "Validar posteriormente con nómina/cartola bancaria.",
              payment_match_detail: `Pagado manual · ${roleLabel} · ${new Date().toISOString()}`,
            },
            validation_status: line.validation_status,
            reviewer_decision: line.reviewer_decision || "pendiente",
            observation: [
              line.observation || "",
              `Pagado manualmente por ${roleLabel}. Validar con cartola bancaria posterior.`,
            ].filter(Boolean).join(" | "),
          })
          .eq("id", line.id);

        if (error) throw error;
      }

      const { error: observationError } = await supabase.from("payment_package_observations").insert({
        package_id: selectedPackage.id,
        organization_id: userProfile.organization_id,
        observation_type: "pago_manual",
        message: [
          "Pago marcado manualmente desde propuesta semanal.",
          `Proveedor: ${group.supplierName}`,
          `RUT: ${group.supplierRut}`,
          `Sociedad: ${group.companyName}`,
          `Monto neto: ${formatMoney(group.amountToPay)}`,
          "Debe validarse luego con la nómina/cartola bancaria.",
        ].join("\n"),
        created_by_name: roleLabel,
        created_by_email: userProfile.email,
      });

      if (observationError) throw observationError;

      setSuccessMessage("Pago marcado manualmente. Quedó registro para revisión posterior con cartola bancaria.");
      await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo marcar el pago manual.");
    } finally {
      setProcessingAction("");
    }
  }

  async function scheduleProposalGroupPayment(group: WeeklyPaymentProposalGroup, scheduledDate: string, reason: string) {
    if (!selectedPackage || !userProfile?.organization_id) return;

    const normalizedDate = normalizeDateForDb(scheduledDate);

    if (!normalizedDate) {
      setErrorMessage("Debes indicar una fecha válida para mover el pago.");
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Debes indicar el motivo de la programación.");
      return;
    }

    const payableLines = group.sourceLines.filter((line) => !isLineCreditNote(line));

    setProcessingAction(`schedule-group-${group.key}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      for (const line of payableLines) {
        const currentRaw = (line.raw_data || {}) as Record<string, unknown>;
        const updatedRaw = {
          ...currentRaw,
          scheduled_payment_date: normalizedDate,
          reschedule_reason: reason.trim(),
          rescheduled_by_role_label: roleLabel,
          rescheduled_by_role: userProfile.role,
          rescheduled_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("payment_package_lines")
          .update({
            raw_data: updatedRaw,
            observation: [
              line.observation || "",
              `Pago programado para ${formatDate(normalizedDate)}. Motivo: ${reason.trim()}`,
            ].filter(Boolean).join(" | "),
          })
          .eq("id", line.id);

        if (error) throw error;
      }

      const { error: observationError } = await supabase.from("payment_package_observations").insert({
        package_id: selectedPackage.id,
        organization_id: userProfile.organization_id,
        observation_type: "reprogramacion_pago_grupo",
        message: [
          `Pago programado en otra fecha por ${roleLabel}.`,
          `Proveedor: ${group.supplierName}`,
          `RUT: ${group.supplierRut}`,
          `Sociedad: ${group.companyName}`,
          `Monto neto: ${formatMoney(group.amountToPay)}`,
          `Nueva fecha propuesta: ${formatDate(normalizedDate)}`,
          `Motivo: ${reason.trim()}`,
        ].join("\n"),
        created_by_name: roleLabel,
        created_by_email: userProfile.email,
      });

      if (observationError) throw observationError;

      setSuccessMessage(`Pago movido a ${formatDate(normalizedDate)}. Quedó registrado para revisión.`);
      await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo programar la fecha del pago.");
    } finally {
      setProcessingAction("");
    }
  }

  function moveProposalGroupToNextWeek(group: WeeklyPaymentProposalGroup) {
    if (!selectedPackage) return;

    const baseDate = getPackagePaymentDateIso(selectedPackage);
    const targetDate = addDaysToIsoDate(baseDate, 7);
    const confirmed = window.confirm(
      `¿Mover el pago de ${group.supplierName} por ${formatMoney(group.amountToPay)} a ${formatDate(targetDate)}?`,
    );

    if (!confirmed) return;

    scheduleProposalGroupPayment(group, targetDate, "Se mueve a otra fecha desde propuesta semanal.");
  }

  function moveProposalGroupToCustomDate(group: WeeklyPaymentProposalGroup) {
    const targetDate = window.prompt("Fecha de pago programada (aaaa-mm-dd):", group.plannedPaymentDate || selectedPackage?.payment_date || "");
    if (!targetDate) return;

    const reason = window.prompt("Motivo de la programación:", "Reprogramación manual desde propuesta semanal.");
    if (!reason) return;

    scheduleProposalGroupPayment(group, targetDate, reason);
  }

  async function schedulePaymentLine(line: PaymentPackageLine, scheduledDate: string, reason: string) {
    if (!selectedPackage || !userProfile?.organization_id) return;

    const normalizedDate = normalizeDateForDb(scheduledDate);

    if (!normalizedDate) {
      setErrorMessage("Debes indicar una fecha válida para mover el pago.");
      return;
    }

    if (!reason.trim()) {
      setErrorMessage("Debes indicar el motivo de la programación.");
      return;
    }

    setProcessingAction(`schedule-line-${line.id}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentRaw = (line.raw_data || {}) as Record<string, unknown>;
      const updatedRaw = {
        ...currentRaw,
        scheduled_payment_date: normalizedDate,
        reschedule_reason: reason.trim(),
        rescheduled_by_role_label: roleLabel,
        rescheduled_by_role: userProfile.role,
        rescheduled_at: new Date().toISOString(),
      };

      const { error: lineError } = await supabase
        .from("payment_package_lines")
        .update({
          raw_data: updatedRaw,
          observation: [
            line.observation || "",
            `Pago programado para ${formatDate(normalizedDate)}. Motivo: ${reason.trim()}`,
          ].filter(Boolean).join(" | "),
        })
        .eq("id", line.id);

      if (lineError) throw lineError;

      const { error: observationError } = await supabase.from("payment_package_observations").insert({
        package_id: selectedPackage.id,
        line_id: line.id,
        organization_id: userProfile.organization_id,
        observation_type: "reprogramacion_pago_linea",
        message: [
          `Pago programado en otra fecha por ${roleLabel}.`,
          `Proveedor: ${line.supplier_name || "Sin proveedor"}`,
          `Factura: ${line.document_folio || "-"}`,
          `Monto: ${formatMoney(getSafeLineAmount(line))}`,
          `Nueva fecha propuesta: ${formatDate(normalizedDate)}`,
          `Motivo: ${reason.trim()}`,
        ].join("\n"),
        created_by_name: roleLabel,
        created_by_email: userProfile.email,
      });

      if (observationError) throw observationError;

      setSuccessMessage(`Factura ${line.document_folio || "sin folio"} movida a ${formatDate(normalizedDate)}.`);
      await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo programar esta factura.");
    } finally {
      setProcessingAction("");
    }
  }

  function movePaymentLineToNextWeek(line: PaymentPackageLine) {
    if (!selectedPackage) return;

    const baseDate = getPackagePaymentDateIso(selectedPackage);
    const targetDate = addDaysToIsoDate(baseDate, 7);
    const confirmed = window.confirm(
      `¿Programar la factura ${line.document_folio || "sin folio"} de ${line.supplier_name || "este proveedor"} por ${formatMoney(getSafeLineAmount(line))} a ${formatDate(targetDate)}?`,
    );

    if (!confirmed) return;

    schedulePaymentLine(line, targetDate, "Se programa esta factura para otra fecha desde el detalle del proveedor.");
  }

  function movePaymentLineToCustomDate(line: PaymentPackageLine) {
    openMovePaymentModal(line);
  }

  async function markPaymentLineAsPaidManual(line: PaymentPackageLine) {
    if (!selectedPackage || !userProfile?.organization_id) return;

    const confirmed = window.confirm(
      `¿Marcar como pagada manualmente solo la factura ${line.document_folio || "sin folio"} por ${formatMoney(getSafeLineAmount(line))}?`,
    );

    if (!confirmed) return;

    setProcessingAction(`paid-manual-line-${line.id}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentRaw = (line.raw_data || {}) as Record<string, unknown>;

      const { error } = await supabase
        .from("payment_package_lines")
        .update({
          raw_data: {
            ...currentRaw,
            payment_status: "pagado_manual",
            payment_reason: "Factura marcada manualmente desde detalle del proveedor.",
            payment_solution: "Validar posteriormente con nómina/cartola bancaria.",
            payment_match_detail: `Pagado manual · ${roleLabel} · ${new Date().toISOString()}`,
          },
          validation_status: line.validation_status,
          reviewer_decision: line.reviewer_decision || "pendiente",
          observation: [
            line.observation || "",
            `Factura marcada como pagada manualmente por ${roleLabel}. Validar con cartola bancaria posterior.`,
          ].filter(Boolean).join(" | "),
        })
        .eq("id", line.id);

      if (error) throw error;

      const { error: observationError } = await supabase.from("payment_package_observations").insert({
        package_id: selectedPackage.id,
        line_id: line.id,
        organization_id: userProfile.organization_id,
        observation_type: "pago_manual_linea",
        message: [
          "Factura marcada manualmente desde detalle del proveedor.",
          `Proveedor: ${line.supplier_name || "Sin proveedor"}`,
          `RUT: ${line.supplier_rut || "-"}`,
          `Sociedad: ${line.company_name || "-"}`,
          `Factura: ${line.document_folio || "-"}`,
          `Monto: ${formatMoney(getSafeLineAmount(line))}`,
          "Debe validarse luego con la nómina/cartola bancaria.",
        ].join("\n"),
        created_by_name: roleLabel,
        created_by_email: userProfile.email,
      });

      if (observationError) throw observationError;

      setSuccessMessage("Factura marcada como pagada manualmente.");
      await loadPackageDetail(selectedPackage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo marcar esta factura como pagada manualmente.");
    } finally {
      setProcessingAction("");
    }
  }

  const filteredPackages = useMemo(() => {
    const text = searchTerm.toLowerCase().trim();

    return packages.filter((pkg) => {
      const matchesStatus = statusFilter === "Todos" || pkg.status === statusFilter;
      const search = `${pkg.package_name} ${pkg.prepared_by_name || ""} ${pkg.status}`.toLowerCase();

      return matchesStatus && (!text || search.includes(text));
    });
  }, [packages, searchTerm, statusFilter]);

  const visiblePackageFiles = useMemo(() => {
    return packageFiles.filter((file) => !["cuentas_bancarias", "zip"].includes(normalizeText(file.file_category)));
  }, [packageFiles]);

  const fileCategoryCounts = useMemo(() => {
    const map = new Map<string, number>();

    visiblePackageFiles.forEach((file) => {
      map.set(file.file_category, (map.get(file.file_category) || 0) + 1);
    });

    return Array.from(map.entries()).sort(
      (a, b) => getCategoryOrder(a[0]) - getCategoryOrder(b[0]) || b[1] - a[1],
    );
  }, [visiblePackageFiles]);

  const filteredFiles = useMemo(() => {
    return visiblePackageFiles
      .filter((file) => {
        return categoryFilter === "Todos" || file.file_category === categoryFilter;
      })
      .sort(
        (a, b) =>
          getCategoryOrder(a.file_category) - getCategoryOrder(b.file_category) ||
          a.file_name.localeCompare(b.file_name),
      );
  }, [visiblePackageFiles, categoryFilter]);

  const groupedFiles = useMemo(() => {
    const map = new Map<string, PaymentPackageFile[]>();

    filteredFiles.forEach((file) => {
      const current = map.get(file.file_category) || [];
      current.push(file);
      map.set(file.file_category, current);
    });

    return Array.from(map.entries()).sort(
      (a, b) => getCategoryOrder(a[0]) - getCategoryOrder(b[0]),
    );
  }, [filteredFiles]);

  const extractedContentRows = useMemo(() => {
    const rows: ExtractedFileRow[] = [];

    packageFiles.forEach((file) => {
      const extracted = (file.raw_metadata?.extracted || {}) as Record<string, any>;

      if (extracted.extraction_type === "excel") {
        rows.push(
          ...flattenExcelRows(
            file.file_name,
            file.file_category,
            (extracted.sheets || []) as Array<{ name: string; rows: Record<string, unknown>[] }>,
          ),
        );
      }

      if (extracted.extraction_type === "text") {
        rows.push(...flattenTextRows(file.file_name, file.file_category, String(extracted.text || "")));
      }

      if (extracted.extraction_type === "pdf") {
        rows.push(...flattenTextRows(file.file_name, file.file_category, String(extracted.full_text || extracted.text || "")));
      }
    });

    const search = normalizeText(contentSearch);

    return rows.filter((row) => {
      if (!search) return true;

      return normalizeText(`${row.fileName} ${row.sheet || ""} ${row.column || ""} ${row.value}`).includes(search);
    });
  }, [packageFiles, contentSearch]);

  const packageSummary = useMemo(() => {
    const activeLines = packageLines.filter((line) => !isLineCreditNote(line));
    const totalRegistry = activeLines.reduce((sum, line) => sum + Math.max(0, getSafeLineAmount(line)), 0);
    const paidByBank = activeLines.filter((line) => isLinePaidByBank(line));
    const rejectedByBank = activeLines.filter((line) => isLineRejectedByBank(line));
    const payableThisWeek = activeLines.filter((line) => lineShouldBePaidThisWeek(line, selectedPackage));
    const scheduledLater = activeLines.filter(
      (line) =>
        !isLinePaidByBank(line) &&
        !isLineRejectedByBank(line) &&
        !lineShouldBePaidThisWeek(line, selectedPackage),
    );
    const approvedByReview = activeLines.filter((line) => line.reviewer_decision === "aprobar");

    const paidByBankAmount = paidByBank.reduce((sum, line) => sum + Math.max(0, getSafeLineAmount(line)), 0);
    const rejectedByBankAmount = rejectedByBank.reduce((sum, line) => sum + Math.max(0, getSafeLineAmount(line)), 0);
    const payableThisWeekAmount = payableThisWeek.reduce((sum, line) => sum + Math.max(0, getSafeLineAmount(line)), 0);
    const scheduledLaterAmount = scheduledLater.reduce((sum, line) => sum + Math.max(0, getSafeLineAmount(line)), 0);

    return {
      totalRegistry,
      totalRequested: totalRegistry,
      lineCount: activeLines.length,
      paidByBankCount: paidByBank.length,
      paidByBankAmount,
      rejectedByBankCount: rejectedByBank.length,
      rejectedByBankAmount,
      payableThisWeekCount: payableThisWeek.length,
      payableThisWeekAmount,
      scheduledLaterCount: scheduledLater.length,
      scheduledLaterAmount,
      approvedCount: approvedByReview.length,
      approvedAmount: approvedByReview.reduce((sum, line) => sum + Math.max(0, getSafeLineAmount(line)), 0),
    };
  }, [packageLines, selectedPackage]);

  const weeklyPaymentProposalGroups = useMemo(() => {
    const groups = buildWeeklyPaymentProposalGroups(packageLines, selectedPackage);

    return [...groups].sort((a, b) => {
      const aDate = a.nearestDueDate || "9999-12-31";
      const bDate = b.nearestDueDate || "9999-12-31";
      const dateCompare = aDate.localeCompare(bDate);

      if (dateCompare !== 0) {
        return proposalDueSortDirection === "asc" ? dateCompare : -dateCompare;
      }

      return b.amountToPay - a.amountToPay;
    });
  }, [packageLines, selectedPackage, proposalDueSortDirection]);

  const visibleWeeklyPaymentProposalGroups = useMemo(() => {
    if (proposalPeriodFilter === "todos") return weeklyPaymentProposalGroups;

    if (proposalPeriodFilter === "programados") {
      return weeklyPaymentProposalGroups.filter((group) =>
        ["proxima_semana", "semana_futura"].includes(group.proposalPeriod),
      );
    }

    return weeklyPaymentProposalGroups.filter((group) => group.proposalPeriod === proposalPeriodFilter);
  }, [weeklyPaymentProposalGroups, proposalPeriodFilter]);

  const weeklyProposalSummary = useMemo(() => {
    const fridayGroups = weeklyPaymentProposalGroups.filter((group) => group.proposalPeriod === "este_viernes");

    return {
      totalToPay: visibleWeeklyPaymentProposalGroups.reduce((sum, group) => sum + group.amountToPay, 0),
      totalFriday: fridayGroups.reduce((sum, group) => sum + group.amountToPay, 0),
      supplierCount: visibleWeeklyPaymentProposalGroups.length,
      missingBankCount: visibleWeeklyPaymentProposalGroups.filter((group) => !group.hasBankAccount).length,
      approvedCount: visibleWeeklyPaymentProposalGroups.filter((group) => group.statusLabel === "Aprobado por rol revisor").length,
      creditNotesCount: visibleWeeklyPaymentProposalGroups.reduce((sum, group) => sum + group.creditNoteCount, 0),
    };
  }, [weeklyPaymentProposalGroups, visibleWeeklyPaymentProposalGroups]);

  const displayedPackageLines = useMemo(() => {
    const search = normalizeText(lineSearchTerm);

    const rows = packageLines.filter((line) => {
      if (!search) return true;

      const haystack = normalizeText([
        line.supplier_name || "",
        line.supplier_rut || "",
        line.company_name || "",
        line.document_folio || "",
        line.document_type || "",
        line.supplier_bank || "",
        line.supplier_account_number || "",
        line.supplier_email || "",
        getLinePaymentStatusLabel(line),
        getLineStatusLabel(line.validation_status),
      ].join(" "));

      return haystack.includes(search);
    });

    if (lineSortKey !== "none") {
      rows.sort((a, b) => {
        const aValue = getSortableLineValue(a, lineSortKey);
        const bValue = getSortableLineValue(b, lineSortKey);

        if (typeof aValue === "number" && typeof bValue === "number") {
          return lineSortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return lineSortDirection === "asc"
          ? String(aValue).localeCompare(String(bValue), "es")
          : String(bValue).localeCompare(String(aValue), "es");
      });

      return rows;
    }

    return rows;
  }, [packageLines, lineSearchTerm, lineSortKey, lineSortDirection]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-none rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando Cuentas por pagar...
          </div>
        </div>
      </main>
    );
  }

  if (!userProfile || !canAccessPayments(userProfile)) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Acceso restringido</h1>
          <p className="mt-2 text-slate-600">
            Este módulo está reservado para usuarios autorizados de Cuentas por pagar.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white"
          >
            Volver a módulos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-100 px-2 py-4 text-slate-950 sm:px-3 lg:px-4">
      <div className="w-full max-w-none space-y-5">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-800 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-44 items-center justify-center rounded-3xl bg-white p-3 shadow-sm">
                <img
                  src="/logo-pumay.png"
                  alt="Pumay"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-300">
                  Módulo proveedores
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                  Cuentas por pagar
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-100 sm:text-base">
                  En este módulo se trabaja por paquetes semanales: se cargan respaldos,
                  se revisan líneas de pago, se aprueba y luego se envía a ejecución.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-100">Sesión activa</p>
              <p className="text-lg font-black">{roleLabel}</p>
              <p className="mt-1 text-sm text-slate-100">Usuario autorizado</p>

              <Link
                href="/"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Módulos
              </Link>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            {successMessage}
          </div>
        )}

        {macroMessage && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-bold text-sky-800">
            {macroMessage}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard
            title="Paquetes"
            value={String(packages.length)}
            detail="Historial registrado"
            tone="slate"
          />
          <MetricCard
            title="En revisión"
            value={String(packages.filter((pkg) => pkg.status === "enviado_revision").length)}
            detail="Pendientes de aprobación"
            tone="sky"
          />
          <MetricCard
            title="Aprobados por revisión"
            value={String(packages.filter((pkg) => pkg.status === "aprobado").length)}
            detail="Aprobados por cargo revisor"
            tone="emerald"
          />
          <MetricCard
            title="Observados / rechazados"
            value={String(
              packages.filter((pkg) => ["observado", "rechazado"].includes(pkg.status)).length,
            )}
            detail="Requieren gestión"
            tone="amber"
          />
        </section>

        {isAccountsPayableUser && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
                  Crear paquete
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Paquete semanal de pago
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">
                  Sube el ZIP o los archivos de respaldo que normalmente se envían
                  para revisión. La app los clasifica y deja el paquete listo para trabajar.
                </p>
              </div>

              <button
                type="button"
                disabled={creating}
                onClick={createPackageFromFiles}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear paquete
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="text-sm font-bold text-slate-700">Nombre del paquete</label>
                <input
                  value={packageName}
                  onChange={(event) => setPackageName(event.target.value)}
                  placeholder="Transferencias semana 19-06-2026"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Fecha propuesta de pago</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(normalizeDateForDb(event.target.value) || event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">ZIP o archivos</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".zip,.pdf,.xlsx,.xls,.xlsm,.csv,.txt"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-black file:text-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              La app lee cada archivo, identifica facturas/cuentas y prepara el consolidado previo a macro.
            </div>

            {showProcessingProgress && fileProcessingProgress.length > 0 && (
              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                      <Search className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                        Lectura de archivos
                      </p>
                      <h3 className="mt-1 text-xl font-black text-slate-900">
                        Analizando documentos
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-500">
                    {fileProcessingProgress.filter((file) => file.status === "listo").length} de {fileProcessingProgress.length} listos
                  </p>
                </div>

                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {fileProcessingProgress.map((file) => (
                    <div key={file.fileName} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900" title={file.fileName}>
                            {file.fileName}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {getCategoryLabel(file.category)} · {file.message}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
                            file.status === "listo"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : file.status === "error"
                                ? "border-rose-200 bg-rose-50 text-rose-800"
                                : file.status === "leyendo"
                                  ? "border-sky-200 bg-sky-50 text-sky-800"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {file.status === "leyendo"
                            ? "Leyendo"
                            : file.status === "listo"
                              ? "Listo"
                              : file.status === "error"
                                ? "Error"
                                : "Pendiente"}
                        </span>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            file.status === "listo"
                              ? "bg-emerald-500"
                              : file.status === "error"
                                ? "bg-rose-500"
                                : "bg-sky-500"
                          }`}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                Historial
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Paquetes semanales
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar paquete"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:w-72"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                <option value="Todos">Todos</option>
                <option value="borrador">Borrador</option>
                <option value="enviado_revision">En revisión</option>
                <option value="observado">Observado</option>
                <option value="rechazado">Rechazado</option>
                <option value="aprobado">Aprobado</option>
                <option value="enviado_ejecucion">Enviado a ejecución</option>
                <option value="ejecutado">Ejecutado</option>
              </select>

              <button
                type="button"
                onClick={() => loadPackages()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredPackages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 lg:col-span-2">
                Todavía no hay paquetes registrados.
              </div>
            ) : (
              filteredPackages.map((pkg) => (
                <button
                  type="button"
                  key={pkg.id}
                  onClick={() => loadPackageDetail(pkg)}
                  className={`rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedPackage?.id === pkg.id
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-900">{pkg.package_name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Fecha pago: {formatDate(pkg.payment_date)} · Semana {pkg.week_number || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Preparado por cargo de carga · {formatDate(pkg.created_at)}
                      </p>
                    </div>

                    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${getStatusStyle(pkg.status)}`}>
                      {getStatusLabel(pkg.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-500">Solicitado</p>
                      <p className="mt-1 font-black text-slate-900">{formatMoney(pkg.total_requested)}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <p className="text-xs font-bold text-emerald-700">Aprobado por revisión</p>
                      <p className="mt-1 font-black text-emerald-900">{formatMoney(pkg.total_approved)}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-3">
                      <p className="text-xs font-bold text-amber-700">Observado por revisión</p>
                      <p className="mt-1 font-black text-amber-900">{formatMoney(pkg.total_observed)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {selectedPackage && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-600">
                  Paquete seleccionado
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  {selectedPackage.package_name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Fecha pago: {formatDate(selectedPackage.payment_date)} · Estado: {getStatusLabel(selectedPackage.status)}
                </p>
                <p className="mt-2 max-w-3xl text-xs font-bold text-slate-500">
                  Solicitado = total del Registro SII. Pagado = encontrado en nómina/cartola bancaria. Aprobado = solo cuando el rol revisor aprueba el paquete.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {isAccountsPayableUser && selectedPackage.status === "borrador" && (
                  <button
                    type="button"
                    disabled={processingAction === "enviado_revision"}
                    onClick={() =>
                      updatePackageStatus("enviado_revision", "enviado_revision", "Paquete enviado a revisión.", {
                        sent_for_review_at: new Date().toISOString(),
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-black text-white transition hover:bg-sky-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Enviar a revisión
                  </button>
                )}

                {canReviewPackages && ["enviado_revision", "observado"].includes(selectedPackage.status) && (
                  <>
                    <button
                      type="button"
                      disabled={processingAction === "aprobado"}
                      onClick={() =>
                        updatePackageStatus("aprobado", "aprobado", "Paquete aprobado y listo para enviar a ejecución.", {
                          approved_by_name: roleLabel,
                          approved_by_email: userProfile.email,
                          approved_at: new Date().toISOString(),
                          reviewed_by_name: roleLabel,
                          reviewed_by_email: userProfile.email,
                          reviewed_at: new Date().toISOString(),
                          total_approved: packageSummary.totalRequested,
                          approved_count: packageSummary.lineCount,
                        })
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Aprobar paquete
                    </button>

                    <button
                      type="button"
                      disabled={packageLines.length === 0}
                      onClick={generatePreliminaryBchMacroReview}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                    >
                      <FileText className="h-4 w-4" />
                      Generar archivo Banco Chile
                    </button>

                    <button
                      type="button"
                      disabled={processingAction === "observado"}
                      onClick={() => {
                        setErrorMessage("");
                        setMacroMessage("");
                        setReviewComment("");
                        setReviewModal({
                          open: true,
                          nextStatus: "observado",
                          title: "Observar paquete",
                          action: "observado",
                        });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Observar / comentar
                    </button>

                    <button
                      type="button"
                      disabled={processingAction === "rechazado"}
                      onClick={() => {
                        setErrorMessage("");
                        setMacroMessage("");
                        setReviewComment("");
                        setReviewModal({
                          open: true,
                          nextStatus: "rechazado",
                          title: "Rechazar paquete",
                          action: "rechazado",
                        });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </button>
                  </>
                )}

                {canReviewPackages && selectedPackage.status === "aprobado" && (
                  <button
                    type="button"
                    disabled={processingAction === "enviado_ejecucion"}
                    onClick={() =>
                      updatePackageStatus("enviado_ejecucion", "enviado_ejecucion", "Paquete enviado al rol de ejecución.", {
                        sent_to_execution_at: new Date().toISOString(),
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Enviar a ejecución
                  </button>
                )}

                {["observado", "rechazado"].includes(selectedPackage.status) && (canReviewPackages || isAccountsPayableUser) && (
                  <button
                    type="button"
                    disabled={processingAction === "devuelto_borrador"}
                    onClick={returnPackageToDraft}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Volver a borrador
                  </button>
                )}

                {(canReviewPackages || isAccountsPayableUser) && (
                  <button
                    type="button"
                    disabled={processingAction === "delete-package"}
                    onClick={deleteSelectedPackage}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar paquete
                  </button>
                )}

                {canExecutePackages && selectedPackage.status === "enviado_ejecucion" && (
                  <button
                    type="button"
                    disabled={processingAction === "ejecutado"}
                    onClick={() =>
                      updatePackageStatus("ejecutado", "ejecutado", "Pago ejecutado y registrado.", {
                        executed_by_name: roleLabel,
                        executed_by_email: userProfile.email,
                        executed_at: new Date().toISOString(),
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Registrar ejecución
                  </button>
                )}
              </div>
            </div>

            {selectedPackage.status === "observado" && packageObservations.length === 0 && (
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                <p className="font-black">Paquete marcado como observado</p>
                <p className="mt-1">
                  Este paquete fue observado antes de que existiera el comentario obligatorio.
                  Usa el botón <strong>Observar / comentar</strong> para dejar el detalle de lo que debe corregirse.
                </p>
              </div>
            )}

            {packageFiles.length > 0 && packageLines.length === 0 && (
              <div className="mt-5 rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">
                <p className="font-black">Archivos cargados, pero sin líneas de pago</p>
                <p className="mt-1">
                  La app clasificó los archivos, pero no encontró líneas válidas del Registro SII. Revisa que el archivo tenga Proveedor/RUT/Folio/Tipo de documento/Monto.
                  Para esta prueba, elimina el paquete y créalo nuevamente con el TXT Banco Chile usando la versión actual.
                </p>
              </div>
            )}

            {packageLines.length > 0 && (
              <div className="mt-5 rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black">Datos del paquete</p>
                    <p className="mt-1">
                      “Por revisar” significa que la línea aún no fue aprobada. “% Datos” indica si tiene proveedor, RUT, folio, monto, banco, tipo de cuenta, cuenta y email.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
                      <Upload className="h-4 w-4" />
                      {processingAction === "importar_cuentas" ? "Importando..." : "Importar cuentas"}
                      <input
                        ref={bankAccountsInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        disabled={processingAction === "importar_cuentas"}
                        onChange={importBankAccountsFromFile}
                      />
                    </label>

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800">
                      <Upload className="h-4 w-4" />
                      {processingAction === "importar_cartola" ? "Cruzando..." : "Importar cartola"}
                      <input
                        ref={bankStatementInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.txt"
                        className="hidden"
                        disabled={processingAction === "importar_cartola"}
                        onChange={importBankStatementFromFile}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => selectedPackage && loadPackageDetail(selectedPackage)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-sm font-black text-white hover:bg-sky-800"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Actualizar datos
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Resumen operativo</p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">
                    Totales del paquete
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Los montos usan la misma base del cuadro listo para aprobación.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOperationalSummary((current) => !current)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  {showOperationalSummary ? "Ocultar detalle" : "Ver más"}
                </button>
              </div>

              {showOperationalSummary && (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <MetricCard title="Facturas abiertas" value={formatMoney(weeklyProposalSummary.totalToPay)} detail={`${weeklyProposalSummary.supplierCount} proveedor(es) en propuesta`} tone="slate" />
                  <MetricCard title="Pagado banco" value={formatMoney(packageSummary.paidByBankAmount)} detail={`${packageSummary.paidByBankCount} línea(s) ya pagadas`} tone="emerald" />
                  <MetricCard title="Pagar viernes" value={formatMoney(weeklyProposalSummary.totalToPay)} detail="Mismo total del cuadro listo para aprobación" tone="amber" />
                  <MetricCard title="Movidas a futuro" value={formatMoney(Math.max(0, packageSummary.scheduledLaterAmount))} detail={`${packageSummary.scheduledLaterCount} reprogramada(s)`} tone="sky" />
                </div>
              )}
            </div>

            {packageObservations.length > 0 && (
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">
                  Observaciones del paquete
                </p>
                <div className="mt-3 space-y-3">
                  {packageObservations.map((observation) => (
                    <div key={observation.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-black text-slate-900">
                          {"Rol autorizado"}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {formatDate(observation.created_at)}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                        {observation.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-5">
              <details className="group rounded-3xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileArchive className="h-5 w-5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-900">Archivos cargados</h3>
                      <p className="mt-0.5 text-xs font-bold text-slate-500">
                        {visiblePackageFiles.length} archivo(s): {fileCategoryCounts.length > 0 ? fileCategoryCounts.map(([category, count]) => `${getCategoryLabel(category)} (${count})`).join(" · ") : "3 Registros SII de sociedades y nómina/cartola bancaria del viernes"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Las cuentas bancarias no se cargan semanalmente: quedan guardadas en el maestro de proveedores de la app.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 group-open:hidden">
                    Ver detalle
                  </span>
                  <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 group-open:inline-flex">
                    Ocultar
                  </span>
                </summary>

                <div className="border-t border-slate-100 px-5 pb-5">
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("Todos")}
                      className={`rounded-2xl border px-3 py-2 text-left text-xs font-black ${
                        categoryFilter === "Todos"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      Todos
                      <span className="float-right text-base">{visiblePackageFiles.length}</span>
                    </button>

                    {fileCategoryCounts.map(([category, count]) => (
                      <button
                        type="button"
                        key={category}
                        onClick={() => setCategoryFilter(category)}
                        className={`rounded-2xl border px-3 py-2 text-left text-xs font-black ${
                          categoryFilter === category
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {getCategoryLabel(category)}
                        <span className="float-right text-base">{count}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-1">
                    {filteredFiles.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                        No hay archivos visibles en esta categoría.
                      </div>
                    ) : (
                      groupedFiles.map(([category, files]) => (
                        <div key={category} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getCategoryStyle(category)}`}>
                              {getCategoryLabel(category)}
                            </span>
                            <span className="text-xs font-black text-slate-400">
                              {files.length}
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {files.map((file) => (
                              <div key={file.id} className="flex items-start justify-between gap-2 py-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-slate-900" title={file.file_name}>
                                    {file.file_name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatDate(file.uploaded_at)}
                                  </p>
                                </div>

                                {isAccountsPayableUser && selectedPackage.status === "borrador" && (
                                  <button
                                    type="button"
                                    disabled={processingAction === `delete-file-${file.id}`}
                                    onClick={() => deletePackageFile(file)}
                                    className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                    title="Eliminar archivo"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </details>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                      Propuesta de pago viernes
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">
                      Cuadro listo para aprobación
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm text-emerald-900">
                      La propuesta se resume por sociedad y proveedor, pero la decisión operativa se toma factura por factura desde el detalle. Las notas de crédito tipo 61 descuentan y no se muestran como pagos independientes.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:min-w-[620px]">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500">Total vista</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{formatMoney(weeklyProposalSummary.totalToPay)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500">Proveedores</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{weeklyProposalSummary.supplierCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500">Sin cuenta</p>
                      <p className="mt-1 text-lg font-black text-amber-700">{weeklyProposalSummary.missingBankCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500">NC aplicadas</p>
                      <p className="mt-1 text-lg font-black text-rose-700">{weeklyProposalSummary.creditNotesCount}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Planificador semanal</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Filtra por periodo para decidir qué entra al pago de este viernes y qué facturas fueron programadas manualmente para otra fecha.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["todos", "Todos"],
                        ["este_viernes", "Este viernes"],
                        ["programados", "Otra fecha"],
                        ["sin_vencimiento", "Sin vencimiento"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setProposalPeriodFilter(value as ProposalPeriodFilter)}
                          className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                            proposalPeriodFilter === value
                              ? "border-emerald-700 bg-emerald-700 text-white"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-white">
                  {visibleWeeklyPaymentProposalGroups.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      Aún no hay pagos en esta vista. Carga el ZIP SII o revisa si las líneas fueron pagadas, rechazadas o programadas para otra fecha.
                    </div>
                  ) : (
                    <div className="max-h-[760px] overflow-auto">
                      <table className="min-w-[2100px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-emerald-50">
                          <tr>
                            {[
                              "Estado",
                              "Sociedad",
                              "Proveedor",
                              "Vencimiento (dd-mm-aaaa)",
                              "Periodo sugerido",
                              "Facturas",
                              "Notas crédito",
                              "Total a pagar",
                              "Cuenta bancaria",
                              "Acciones",
                            ].map((header) => (
                              <th key={header} className={`border-b border-emerald-200 px-3 py-3 text-xs font-black uppercase tracking-wide text-emerald-800 ${header.includes("Total") || header.includes("Facturas") || header.includes("Notas") ? "text-right" : "text-left"}`}>
                                {header === "Vencimiento (dd-mm-aaaa)" ? (
                                  <button
                                    type="button"
                                    onClick={() => setProposalDueSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                                    className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-left hover:bg-emerald-100"
                                    title="Ordenar por fecha de vencimiento"
                                  >
                                    Vencimiento
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  header
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleWeeklyPaymentProposalGroups.map((group) => (
                            <Fragment key={group.key}>
                              <tr className="border-b border-slate-100 align-top hover:bg-emerald-50/40">
                                <td className="whitespace-nowrap px-3 py-3">
                                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${group.statusClass}`}>
                                    {group.statusLabel}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-slate-700">{group.companyName}</td>
                                <td className="max-w-xs px-3 py-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleProposalGroup(group.key)}
                                    className="text-left font-black text-slate-900 hover:underline"
                                  >
                                    {group.supplierName}
                                  </button>
                                  <p className="mt-1 text-xs font-bold text-slate-500">{group.supplierRut}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {group.documentCount} factura(s) · {group.creditNoteCount} NC
                                  </p>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 font-black text-slate-700">
                                  {group.nearestDueDate ? formatExcelDate(group.nearestDueDate) : "Sin vencimiento informado"}
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                  <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${group.proposalPeriodClass}`}>
                                    {group.proposalPeriodLabel}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 text-right font-black text-slate-900">{formatMoney(group.invoicesTotal)}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-right font-black text-rose-700">-{formatMoney(group.creditNotesTotal)}</td>
                                <td className="whitespace-nowrap px-3 py-3 text-right text-lg font-black text-slate-900">{formatMoney(group.amountToPay)}</td>
                                <td className="min-w-[220px] px-3 py-3 text-slate-700">
                                  {group.hasBankAccount ? (
                                    <div>
                                      <p className="font-black text-slate-900">{group.bank || "Banco no informado"}</p>
                                      <p className="text-xs text-slate-500">{group.accountType || "Tipo no informado"} · {group.accountNumber}</p>
                                      <p className="text-xs text-slate-500">{group.email || "Sin email"}</p>
                                    </div>
                                  ) : (
                                    <span className="font-black text-amber-700">Falta cuenta bancaria</span>
                                  )}
                                </td>
                                <td className="min-w-[330px] px-3 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleProposalGroup(group.key)}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50"
                                    >
                                      {expandedProposalGroups[group.key] ? "Ocultar detalle" : "Ver detalle"}
                                    </button>
                                    {canReviewPackages && (
                                      <button
                                        type="button"
                                        disabled={Boolean(processingAction)}
                                        onClick={() => updateProposalGroupDecision(group, "aprobar")}
                                        className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-50"
                                      >
                                        Aprobar grupo
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {expandedProposalGroups[group.key] && (
                                <tr className="border-b border-slate-100 bg-slate-50">
                                  <td colSpan={10} className="px-4 py-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                      <p className="font-black text-slate-900">Detalle documentos SII</p>
                                      <p className="mt-1 text-xs text-slate-500">Las acciones de pago se aplican por factura. La nota de crédito solo descuenta y no se mueve como pago.</p>
                                      <div className="mt-3 overflow-x-auto">
                                        <table className="min-w-full text-xs">
                                          <thead>
                                            <tr className="border-b border-slate-200 text-left text-slate-500">
                                              <th className="py-2 pr-4">Tipo</th>
                                              <th className="py-2 pr-4">Folio</th>
                                              <th className="py-2 pr-4">Emisión</th>
                                              <th className="py-2 pr-4">Vencimiento</th>
                                              <th className="py-2 pr-4">Plan</th>
                                              <th className="py-2 pr-4 text-right">Monto</th>
                                              <th className="py-2 pr-4">Acciones de línea</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {group.sourceLines.map((line) => (
                                              <tr key={line.id} className="border-b border-slate-100">
                                                <td className="py-2 pr-4">{line.document_type || "Documento"}</td>
                                                <td className="py-2 pr-4">{line.document_folio || "-"}</td>
                                                <td className="py-2 pr-4">{line.issue_date ? formatDate(line.issue_date) : "-"}</td>
                                                <td className="py-2 pr-4">{line.due_date ? formatDate(line.due_date) : "-"}</td>
                                                <td className="py-2 pr-4">
                                                  <span className={isLineCreditNote(line) ? "font-black text-rose-700" : "text-slate-700"}>
                                                    {isLineCreditNote(line) ? "Nota crédito descuenta" : getLinePaymentPlanLabel(line, selectedPackage)}
                                                  </span>
                                                </td>
                                                <td className={`py-2 pr-4 text-right font-black ${isLineCreditNote(line) ? "text-rose-700" : "text-slate-900"}`}>
                                                  {isLineCreditNote(line) ? "-" : ""}{formatMoney(Math.abs(getSafeLineAmount(line)))}
                                                </td>
                                                <td className="py-2 pr-4">
                                                  {isLineCreditNote(line) ? (
                                                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-800">
                                                      No se paga
                                                    </span>
                                                  ) : (
                                                    <div className="flex min-w-[420px] flex-wrap gap-2">
                                                      {canReviewPackages && (
                                                        <button
                                                          type="button"
                                                          disabled={Boolean(processingAction)}
                                                          onClick={() => updateLineDecision(line, "aprobar")}
                                                          className="rounded-lg bg-emerald-700 px-2 py-1 text-[11px] font-black text-white hover:bg-emerald-800 disabled:opacity-50"
                                                        >
                                                          Aprobar
                                                        </button>
                                                      )}
                                                      <button
                                                        type="button"
                                                        disabled={Boolean(processingAction)}
                                                        onClick={() => updateLineDecision(line, "observar")}
                                                        className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                                                      >
                                                        Observar
                                                      </button>
                                                      <button
                                                        type="button"
                                                        disabled={Boolean(processingAction)}
                                                        onClick={() => updateLineDecision(line, "excluir")}
                                                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-black text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                                                      >
                                                        Excluir
                                                      </button>
                                                      <button
                                                        type="button"
                                                        disabled={Boolean(processingAction)}
                                                        onClick={() => openMovePaymentModal(line)}
                                                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-black text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                                                      >
                                                        Programar fecha
                                                      </button>
                                                      <button
                                                        type="button"
                                                        disabled={Boolean(processingAction)}
                                                        onClick={() => markPaymentLineAsPaidManual(line)}
                                                        className="rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-black text-purple-800 hover:bg-purple-100 disabled:opacity-50"
                                                      >
                                                        Pagado manual
                                                      </button>
                                                    </div>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Informe previo a macro</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Bandeja de facturas abiertas del Registro SII. Aquí se planifica qué se paga esta semana y qué se mueve a otra semana.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-800">
                      Se cargan los 3 Registros SII de sociedades y la nómina/cartola bancaria del viernes.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPreMacroTable((current) => !current)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      {showPreMacroTable ? "Ocultar detalle" : "Ver más"}
                    </button>
                  </div>
                </div>

                {showPreMacroTable && (
                  <>
                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={lineSearchTerm}
                      onChange={(event) => setLineSearchTerm(event.target.value)}
                      placeholder="Buscar proveedor, RUT, folio, banco o estado"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-sky-400"
                    />
                  </div>

                  <p className="text-sm font-bold text-slate-500">
                    Mostrando {displayedPackageLines.length} de {packageLines.length} línea(s)
                  </p>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {packageLines.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      Aún no hay facturas procesadas. Carga los archivos para que se genere el informe previo a macro.
                    </div>
                  ) : (
                    <div className="max-h-[760px] overflow-auto">
                      <table className="min-w-[2100px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50">
                          <tr>
                            {[
                              ["supplier", "Proveedor"],
                              ["rut", "RUT"],
                              ["company", "Sociedad"],
                              ["type", "Tipo"],
                              ["folio", "Folio"],
                              ["issue", "Emisión"],
                              ["due", "Vencimiento"],
                              ["total", "Total"],
                              ["bank", "Banco"],
                              ["accountType", "Tipo cuenta"],
                              ["account", "Cuenta"],
                              ["email", "Email"],
                              ["payment", "Pago"],
                              ["none", "Plan semana"],
                              ["review", "Revisión"],
                              ["none", "Cuenta bancaria"],
                              ["none", "Mover"],
                              ["percent", "% Datos"],
                              ["none", "Observación"],
                            ].map(([key, label]) => (
                              <th
                                key={label}
                                className={`border-b border-slate-200 px-3 py-3 text-xs font-black uppercase tracking-wide text-slate-500 ${
                                  label === "Total" ? "text-right" : "text-left"
                                }`}
                              >
                                {key === "none" ? (
                                  label
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleLineSort(key as PackageLineSortKey)}
                                    className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-left hover:bg-slate-100"
                                    title={`Ordenar por ${label}`}
                                  >
                                    {label}
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {displayedPackageLines.map((line) => (
                            <tr key={line.id} className="border-b border-slate-100 align-top">
                              <td className="max-w-xs px-3 py-3 font-black text-slate-900">{line.supplier_name || "Sin proveedor"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.supplier_rut || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.company_name || "Por definir"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.document_type || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.document_folio || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.issue_date ? formatDate(line.issue_date) : "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.due_date ? formatDate(line.due_date) : "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-right text-lg font-black text-slate-900">{formatMoney(getSafeLineAmount(line))}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.supplier_bank || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.supplier_account_type || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.supplier_account_number || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">{line.supplier_email || "-"}</td>
                              <td className="whitespace-nowrap px-3 py-3">
                                <span title={getLinePaymentDetail(line)} className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${getLinePaymentStatusClass(line)}`}>
                                  {getLinePaymentStatusLabel(line)}
                                </span>
                              </td>
                              <td className="min-w-[180px] px-3 py-3">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${
                                  getLinePaymentPlanLabel(line, selectedPackage).includes("Nota crédito")
                                    ? "border-rose-200 bg-rose-50 text-rose-800"
                                    : getLinePaymentPlanLabel(line, selectedPackage).includes("Pagar")
                                      ? "border-amber-200 bg-amber-50 text-amber-800"
                                      : getLinePaymentPlanLabel(line, selectedPackage).includes("Reprogramado")
                                      ? "border-sky-200 bg-sky-50 text-sky-800"
                                      : getLinePaymentPlanLabel(line, selectedPackage).includes("pagado")
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-slate-200 bg-slate-50 text-slate-700"
                                }`}>
                                  {getLinePaymentPlanLabel(line, selectedPackage)}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${getLineStatusStyle(line.validation_status)}`}>
                                  {getLineStatusLabel(line.validation_status)}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => openSupplierAccountModal(line)}
                                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800 hover:bg-sky-100"
                                >
                                  {line.supplier_account_number ? "Cambiar cuenta" : "Agregar cuenta"}
                                </button>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3">
                                <button
                                  type="button"
                                  disabled={isLinePaidByBank(line) || isLineCreditNote(line)}
                                  onClick={() => openMovePaymentModal(line)}
                                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                  Programar fecha
                                </button>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3">
                                <span className={`rounded-full border px-3 py-1 text-xs font-black ${
                                  getLineConfidence(line) >= 90
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : getLineConfidence(line) >= 70
                                      ? "border-amber-200 bg-amber-50 text-amber-800"
                                      : "border-rose-200 bg-rose-50 text-rose-800"
                                }`}>
                                  {getLineConfidence(line)}%
                                </span>
                              </td>
                              <td className="min-w-[300px] px-3 py-3 text-slate-700">
                                {[getLinePaymentPlanObservation(line, selectedPackage), buildLineObservationSummary(line)]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">
                    Cartola leída
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    Movimientos bancarios detectados
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm text-emerald-900">
                    Esta tabla muestra solo la nómina/cartola bancaria del paquete. Además, cada nómina queda guardada en el histórico permanente para cruces de semanas futuras.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={bankMovements.length === 0 || packageLines.length === 0 || Boolean(processingAction)}
                  onClick={() => reprocessBankStatementMatch()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reprocesar cruce
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-200 bg-white">
                {bankMovements.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Aún no hay cartola leída. Usa Importar cartola para cargar el Excel de Banco Chile.
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-auto">
                    <table className="min-w-[1100px] border-collapse text-sm">
                      <thead className="sticky top-0 z-10 bg-emerald-50">
                        <tr>
                          {[
                            "RUT",
                            "Beneficiario",
                            "Monto",
                            "Fecha pago",
                            "Banco",
                            "Cuenta",
                            "Estado banco",
                            "Motivo rechazo",
                            "Cruce",
                          ].map((header) => (
                            <th key={header} className="border-b border-emerald-200 px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-emerald-800">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bankMovements.map((movement) => (
                          <tr key={movement.id} className="border-b border-slate-100 align-top">
                            <td className="whitespace-nowrap px-3 py-3 text-slate-700">{movement.beneficiary_rut || "-"}</td>
                            <td className="max-w-xs px-3 py-3 font-bold text-slate-900">{movement.beneficiary_name || "-"}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-black text-slate-900">{formatMoney(Number(movement.amount || 0))}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-slate-700">{movement.payment_date ? formatDate(movement.payment_date) : "-"}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-slate-700">{movement.bank_name || "-"}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-slate-700">{movement.account_number || "-"}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-slate-700">{movement.bank_status || "-"}</td>
                            <td className="min-w-[220px] px-3 py-3 text-slate-700">{movement.rejection_reason || "-"}</td>
                            <td className="whitespace-nowrap px-3 py-3">
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-700">
                                {movement.match_status || "sin_cruzar"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                    Detalle previo a macro
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    Excel simple de pago
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm text-slate-600">
                    La lectura completa no se muestra como miles de celdas en pantalla.
                    La app la cruza y deja un Excel simple con proveedor, RUT, empresa, tipo de documento, número de factura, fechas, moneda, montos y artículo.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={packageLines.length === 0 && extractedContentRows.length === 0}
                  onClick={generatePaymentReviewExcel}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  <FileText className="h-4 w-4" />
                  Generar único Excel de revisión
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                    Facturas / documentos
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-950">
                    {packageLines.filter((line) => line.line_type === "documento_pago").length}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Cargados al informe previo.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-700">
                    Respaldos
                  </p>
                  <p className="mt-2 text-3xl font-black text-sky-950">
                    {packageLines.filter((line) => line.line_type === "respaldo").length}
                  </p>
                  <p className="mt-1 text-sm text-sky-800">
                    Comprobantes, registros y otros.
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                    Datos leídos
                  </p>
                  <p className="mt-2 text-3xl font-black text-amber-950">
                    {extractedContentRows.length}
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Usados para armar el Excel.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Total propuesto
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatMoney(packageSummary.totalRequested)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Pendiente de revisión.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                El detalle completo queda en el Excel, con Detalle para Pago,
                Sociedades, Proveedores y Contenido Leído. En pantalla se mantiene solo
                el consolidado de trabajo para no saturar la vista del cargo de cuentas por pagar.
              </div>
            </div>
          </section>
        )}

        {!selectedPackage && (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <FolderOpen className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-2xl font-black text-slate-900">
              Selecciona un paquete
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Abre un paquete semanal para ver sus archivos, líneas, observaciones y estado de aprobación.
            </p>
          </section>
        )}
      </div>

      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                  Revisión del paquete
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  {reviewModal.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Escribe claramente qué debe corregirse o por qué se rechaza.
                  Esta observación quedará visible para Cuentas por pagar y en la bitácora del paquete.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setReviewModal({ open: false, nextStatus: "", title: "", action: "" });
                  setReviewComment("");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Ejemplo: Falta respaldar el pago de BUK y revisar diferencia de monto en Aramark antes de enviar a revisión."
              className="mt-5 min-h-40 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setReviewModal({ open: false, nextStatus: "", title: "", action: "" });
                  setReviewComment("");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={processingAction === reviewModal.action}
                onClick={submitPackageReviewDecision}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition disabled:opacity-50 ${
                  reviewModal.nextStatus === "rechazado"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                }`}
              >
                {processingAction === reviewModal.action ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : reviewModal.nextStatus === "rechazado" ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                Guardar decisión
              </button>
            </div>
          </div>
        </div>
      )}
      {accountModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-600">Maestro de proveedores</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Agregar cuenta bancaria</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Esta cuenta se guarda para este proveedor y quedará disponible para las próximas semanas.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAccountModal({
                    open: false,
                    line: null,
                    supplierName: "",
                    supplierRut: "",
                    bank: "",
                    accountType: "",
                    accountNumber: "",
                    email: "",
                  })
                }
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-slate-700">Proveedor</span>
                <input
                  value={accountModal.supplierName}
                  onChange={(event) => setAccountModal((current) => ({ ...current, supplierName: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">RUT proveedor</span>
                <input
                  value={accountModal.supplierRut}
                  onChange={(event) => setAccountModal((current) => ({ ...current, supplierRut: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">Banco</span>
                <input
                  value={accountModal.bank}
                  onChange={(event) => setAccountModal((current) => ({ ...current, bank: event.target.value }))}
                  placeholder="Banco de Chile / BCI / Santander..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">Tipo de cuenta</span>
                <input
                  value={accountModal.accountType}
                  onChange={(event) => setAccountModal((current) => ({ ...current, accountType: event.target.value }))}
                  placeholder="Cuenta corriente / Cuenta vista"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">Cuenta corriente o vista</span>
                <input
                  value={accountModal.accountNumber}
                  onChange={(event) => setAccountModal((current) => ({ ...current, accountNumber: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">Email beneficiario</span>
                <input
                  value={accountModal.email}
                  onChange={(event) => setAccountModal((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={saveSupplierAccount}
                disabled={processingAction === "guardar_cuenta"}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:bg-slate-300"
              >
                {processingAction === "guardar_cuenta" ? "Guardando..." : "Guardar y aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {movePaymentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-600">Planificación de pago</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Programar fecha de pago</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Este cambio queda registrado en la factura y servirá para el dashboard de pagos programados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMovePaymentModal({ open: false, line: null, scheduledDate: "", reason: "" })}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            {movePaymentModal.line && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-black text-slate-900">{movePaymentModal.line.supplier_name || "Sin proveedor"}</p>
                <p className="mt-1 text-slate-600">
                  Factura {movePaymentModal.line.document_folio || "-"} · {formatMoney(getSafeLineAmount(movePaymentModal.line))}
                </p>
                <p className="mt-1 text-slate-600">
                  Vencimiento actual: {movePaymentModal.line.due_date ? formatDate(movePaymentModal.line.due_date) : "Sin vencimiento"}
                </p>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4">
              <label className="block">
                <span className="text-sm font-black text-slate-700">Escoger día de pago en calendario</span>
                <input
                  type="date"
                  value={movePaymentModal.scheduledDate}
                  onChange={(event) => setMovePaymentModal((current) => ({ ...current, scheduledDate: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-700">Motivo del movimiento</span>
                <textarea
                  value={movePaymentModal.reason}
                  onChange={(event) => setMovePaymentModal((current) => ({ ...current, reason: event.target.value }))}
                  placeholder="Ej: No pagar esta semana por flujo de caja; programar para la fecha seleccionada."
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={saveMovePaymentWeek}
                disabled={processingAction === "mover_pago"}
                className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:bg-slate-300"
              >
                {processingAction === "mover_pago" ? "Guardando..." : "Guardar programación"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

function MetricCard(props: {
  title: string;
  value: string;
  detail: string;
  tone: "slate" | "sky" | "emerald" | "amber";
}) {
  let toneClass = "border-slate-200 bg-white text-slate-900";

  if (props.tone === "sky") {
    toneClass = "border-sky-200 bg-sky-50 text-sky-900";
  }

  if (props.tone === "emerald") {
    toneClass = "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (props.tone === "amber") {
    toneClass = "border-amber-200 bg-amber-50 text-amber-900";
  }

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">{props.title}</p>
      <p className="mt-3 text-3xl font-black">{props.value}</p>
      <p className="mt-1 text-sm opacity-75">{props.detail}</p>
    </div>
  );
}
