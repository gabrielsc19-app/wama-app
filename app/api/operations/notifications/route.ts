import { NextResponse } from "next/server";
import { getOperationsContext, operationsError } from "../../../../src/lib/server/operationsAccess";

const fail=(error:unknown)=>{const value=operationsError(error);return NextResponse.json({error:value.message},{status:value.status});};

export async function GET(request:Request){
  try{
    const context=await getOperationsContext(request);
    const{data,error}=await context.admin.from("wama_operations_notifications").select("*").eq("tenant_id",context.tenantId).eq("recipient_profile_id",context.profile.id).order("created_at",{ascending:false}).limit(60);
    if(error)throw error;
    return NextResponse.json({notifications:data||[]});
  }catch(error){return fail(error)}
}

export async function PATCH(request:Request){
  try{
    const context=await getOperationsContext(request);const body=await request.json() as {id?:string;all?:boolean};
    let query=context.admin.from("wama_operations_notifications").update({read_at:new Date().toISOString()}).eq("tenant_id",context.tenantId).eq("recipient_profile_id",context.profile.id).is("read_at",null);
    if(!body.all){if(!body.id)return NextResponse.json({error:"Falta la notificación."},{status:400});query=query.eq("id",body.id)}
    const{error}=await query;if(error)throw error;
    return NextResponse.json({ok:true});
  }catch(error){return fail(error)}
}
