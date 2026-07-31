import { NextResponse } from "next/server";
import { getUserTenantContext, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireWamaUser(request);
    const { admin, profile, membership } = await getUserTenantContext(user.id);
    const form = await request.formData();
    const file = form.get("file");
    const renditionId = String(form.get("renditionId") || "");
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
    const {data:evidence,error:evidenceError}=await admin.from("wama_expense_evidence").insert({tenant_id:membership.tenant_id,report_id:renditionId,uploaded_by:profile.id,storage_path:path,file_name:file.name,mime_type:file.type,file_size:file.size}).select("*").single();
    if(evidenceError){await admin.storage.from("expense-evidence").remove([path]);throw evidenceError;}
    await admin.from("wama_expense_reports").update({document_url:path,updated_at:new Date().toISOString()}).eq("id",renditionId).eq("tenant_id",membership.tenant_id);
    return NextResponse.json({ok:true,evidence});
  } catch(error) { return NextResponse.json({error:error instanceof Error?error.message:"No se pudo guardar la evidencia."},{status:500}); }
}
