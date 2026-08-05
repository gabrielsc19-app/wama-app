import { NextResponse } from "next/server";
import { getUserTenantContext, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";

export async function GET(request:Request){
  try{
    const user=await requireWamaUser(request);
    const {admin,profile,membership}=await getUserTenantContext(user.id);
    const moduleKey=new URL(request.url).searchParams.get("moduleKey");
    if(!moduleKey)return NextResponse.json({error:"Falta el módulo."},{status:400});
    if(membership.role==="owner")return NextResponse.json({role:"module_admin"});
    const {data,error}=await admin.from("wama_module_user_assignments")
      .select("module_role,wama_tenant_module_licenses!inner(tenant_id,wama_module_catalog!inner(module_key))")
      .eq("profile_id",profile.id).eq("status","active")
      .eq("wama_tenant_module_licenses.tenant_id",membership.tenant_id)
      .eq("wama_tenant_module_licenses.wama_module_catalog.module_key",moduleKey).maybeSingle();
    if(error)throw error;
    return NextResponse.json({role:data?.module_role||""});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo cargar el perfil."},{status:500});}
}
