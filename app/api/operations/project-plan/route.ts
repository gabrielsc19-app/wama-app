import { NextResponse } from "next/server";
import {
  getOperationsContext,
  operationsError,
} from "../../../../src/lib/server/operationsAccess";

const fail = (error: unknown) => {
  const result = operationsError(error);
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : "";
  return NextResponse.json(
    { error: message || result.message },
    { status: result.status },
  );
};

export async function POST(request: Request) {
  try {
    const context = await getOperationsContext(request);

    if (!context.canAdmin) {
      return NextResponse.json(
        { error: "Solo un administrador puede cargar planos." },
        { status: 403 },
      );
    }

    const form = await request.formData();
    const projectId = String(form.get("projectId") || "");
    const sheetCode = String(form.get("sheetCode") || "").trim();
    const title = String(form.get("title") || "Plano del proyecto").trim();
    const revision = String(form.get("revision") || "").trim();
    const revisionDate = String(form.get("revisionDate") || "").trim();
    const scale = String(form.get("scale") || "").trim();
    const file = form.get("file");

    if (!projectId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Selecciona proyecto y archivo." },
        { status: 400 },
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El plano supera el máximo de 25 MB." },
        { status: 400 },
      );
    }

    if (
      ![
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      return NextResponse.json(
        { error: "Formato de plano no permitido." },
        { status: 400 },
      );
    }

    const { data: project } = await context.admin
      .from("wama_projects")
      .select("id")
      .eq("id", projectId)
      .eq("tenant_id", context.tenantId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no válido." },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${context.tenantId}/${projectId}/${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}.${ext}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await context.admin.storage
      .from("operations-plans")
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: plan, error: planError } = await context.admin
      .from("wama_operations_project_plans")
      .insert({
        tenant_id: context.tenantId,
        project_id: projectId,
        sheet_code: sheetCode || null,
        title,
        revision: revision || null,
        revision_date: revisionDate || null,
        scale: scale || null,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: context.profile.id,
      })
      .select("*")
      .single();

    if (planError) throw planError;

    return NextResponse.json({ ok: true, plan }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
