import { NextResponse } from "next/server";
import { requireModuleAccess } from "../../../../src/lib/server/moduleAccess";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { admin, membership } = await requireModuleAccess(request, "expense");
    const url = new URL(request.url);
    const renditionId = url.searchParams.get("renditionId");
    if (!renditionId) return NextResponse.json({error:"Falta la rendición."},{status:400});

    const {data:report} = await admin
      .from("wama_expense_reports")
      .select("id,document_url")
      .eq("id", renditionId)
      .eq("tenant_id", membership.tenant_id)
      .single();
    if (!report) return NextResponse.json({error:"Rendición no encontrada."},{status:404});

    const {data:evidence, error} = await admin
      .from("wama_expense_evidence")
      .select("id,file_name,mime_type,file_size,storage_path,created_at,is_current,evidence_type")
      .eq("report_id", renditionId)
      .eq("tenant_id", membership.tenant_id)
      .order("created_at", {ascending:false});
    if (error) throw error;

    const files = await Promise.all((evidence || []).map(async (item) => {
      const {data:signed, error:signedError} = await admin.storage
        .from("expense-evidence")
        .createSignedUrl(item.storage_path, 900);
      return {...item, url:signedError ? null : signed.signedUrl};
    }));

    // Compatibilidad con rendiciones creadas antes de la tabla de evidencias.
    // Esas versiones guardaban el respaldo únicamente en document_url.
    if (files.length === 0 && report.document_url) {
      const legacyPath = String(report.document_url);
      let legacyUrl: string | null = null;

      if (/^https?:\/\//i.test(legacyPath) || legacyPath.startsWith("data:")) {
        legacyUrl = legacyPath;
      } else {
        const normalizedPath = legacyPath
          .replace(/^expense-evidence\//, "")
          .replace(/^\//, "");
        const {data:signed, error:signedError} = await admin.storage
          .from("expense-evidence")
          .createSignedUrl(normalizedPath, 900);
        if (!signedError) legacyUrl = signed.signedUrl;
      }

      const cleanPath = legacyPath.split("?")[0].toLowerCase();
      const mimeType = cleanPath.endsWith(".pdf") ? "application/pdf" : "image/jpeg";
      files.push({
        id:`legacy-${report.id}`,
        file_name:cleanPath.split("/").pop() || "evidencia-original",
        mime_type:mimeType,
        file_size:0,
        storage_path:legacyPath,
        created_at:new Date(0).toISOString(),
        is_current:true,
        evidence_type:"expense_document",
        url:legacyUrl,
      });
    }
    return NextResponse.json({evidence:files});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"No se pudo abrir la evidencia."},{status:500});
  }
}

export async function POST(request: Request) {
  try {
    const { admin, profile, membership } = await requireModuleAccess(request, "expense");
    const form = await request.formData();
    const file = form.get("file");
    const renditionId = String(form.get("renditionId") || "");
    const evidenceType = String(form.get("evidenceType") || "expense_document");
    if (!(file instanceof File) || !renditionId) return NextResponse.json({error:"Falta la evidencia o la rendición."},{status:400});
    if (file.size > 12*1024*1024) return NextResponse.json({error:"El archivo supera el máximo de 12 MB."},{status:413});
    const allowed=["image/jpeg","image/png","image/webp","application/pdf"];
    if(!allowed.includes(file.type)) return NextResponse.json({error:"Formato no compatible."},{status:415});
    const {data:report}=await admin.from("wama_expense_reports").select("id").eq("id",renditionId).eq("tenant_id",membership.tenant_id).single();
    if(!report) return NextResponse.json({error:"Rendición no encontrada."},{status:404});
    const extension=file.name.split(".").pop()?.toLowerCase()||"bin";
    const path=`${membership.tenant_id}/${renditionId}/${crypto.randomUUID()}.${extension}`;
    const bytes=Buffer.from(await file.arrayBuffer());
    const {error:storageError}=await admin.storage.from("expense-evidence").upload(path,bytes,{contentType:file.type,upsert:false});
    if(storageError) throw storageError;
    if(!["expense_document","transfer_receipt","return_receipt"].includes(evidenceType)) return NextResponse.json({error:"Tipo de comprobante no válido."},{status:400});
    const {data:evidence,error:evidenceError}=await admin.from("wama_expense_evidence").insert({tenant_id:membership.tenant_id,report_id:renditionId,uploaded_by:profile.id,storage_path:path,file_name:file.name,mime_type:file.type,file_size:file.size,evidence_type:evidenceType}).select("*").single();
    if(evidenceError){await admin.storage.from("expense-evidence").remove([path]);throw evidenceError;}
    await admin.from("wama_expense_reports").update({document_url:path,updated_at:new Date().toISOString()}).eq("id",renditionId).eq("tenant_id",membership.tenant_id);
    return NextResponse.json({ok:true,evidence});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"No se pudo guardar la evidencia."},{status:500}); }
}
