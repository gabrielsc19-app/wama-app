import { NextResponse } from "next/server";
import { getUserTenantContext, isTenantAdmin, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";

const reviewer = (role:string) => isTenantAdmin(role) || ["manager","approver","finance"].includes(role);
const finance = (role:string) => isTenantAdmin(role) || ["finance","treasury"].includes(role);

function errorMessage(error:unknown, fallback="No fue posible completar la solicitud.") {
  if(error instanceof Error && error.message) return error.message;
  if(error && typeof error==="object") {
    const value=error as {message?:unknown;details?:unknown;hint?:unknown;code?:unknown};
    const parts=[value.message,value.details,value.hint].filter(item=>typeof item==="string"&&item.trim()) as string[];
    if(parts.length) return parts.join(" · ");
    if(typeof value.code==="string"&&value.code) return `${fallback} Código: ${value.code}`;
  }
  return fallback;
}

export async function GET(request:Request){
  try{
    const user=await requireWamaUser(request); const {admin,profile,membership}=await getUserTenantContext(user.id);
    const {data:reports,error}=await admin.from("wama_expense_reports").select("*,wama_projects(id,name,code),wama_profiles!wama_expense_reports_submitted_by_fkey(id,full_name,email),assignee:wama_profiles!wama_expense_reports_assigned_to_fkey(id,full_name,email),wama_expense_evidence(id,file_name,mime_type,file_size,storage_path,created_at),wama_expense_payments(*),wama_expense_events(*)").eq("tenant_id",membership.tenant_id).order("created_at",{ascending:false});
    if(error) throw error;
    const [{data:projects},{data:memberships}]=await Promise.all([
      admin.from("wama_projects").select("id,name,code").eq("tenant_id",membership.tenant_id).eq("status","active"),
      admin.from("wama_tenant_memberships").select("profile_id,role,status,wama_profiles(id,full_name,email)").eq("tenant_id",membership.tenant_id).eq("status","active")
    ]);
    return NextResponse.json({reports:reports||[],renditions:reports||[],projects:projects||[],members:(memberships||[]).map(x=>({...(x.wama_profiles as unknown as object),role:x.role})),role:membership.role,profile});
  }catch(error){return NextResponse.json({error:errorMessage(error,"No pudimos validar tu acceso.")},{status:401});}
}

export async function POST(request:Request){
  try{
    const user=await requireWamaUser(request); const {admin,profile,membership}=await getUserTenantContext(user.id);
    const body=await request.json() as {requestType?:string;merchant?:string;expenseDate?:string;category?:string;amountClp?:number;description?:string;costCenter?:string;projectId?:string;parentFundId?:string;dueDate?:string};
    const type=body.requestType||"expense_reimbursement"; const amount=Number(body.amountClp||0);
    if(!["expense_reimbursement","fund_request","fund_rendition"].includes(type)||amount<=0)return NextResponse.json({error:"Completa el tipo y el monto de la solicitud."},{status:400});
    if(type!=="fund_request"&&(!body.merchant||!body.expenseDate||!body.category))return NextResponse.json({error:"Completa comercio, fecha y categoría."},{status:400});
    if(type==="fund_rendition"&&!body.parentFundId)return NextResponse.json({error:"Selecciona el fondo que estás rindiendo."},{status:400});
    const {data:number}=await admin.rpc("wama_next_expense_number",{target_tenant_id:membership.tenant_id});
    const {data,error}=await admin.from("wama_expense_reports").insert({tenant_id:membership.tenant_id,project_id:body.projectId||null,submitted_by:profile.id,report_number:number,request_type:type,merchant:(body.merchant||(type==="fund_request"?"Solicitud de fondo":"Sin comercio")).trim(),expense_date:body.expenseDate||new Date().toISOString().slice(0,10),category:body.category||"Fondo por rendir",amount_clp:amount,requested_amount_clp:amount,description:body.description?.trim()||null,cost_center:body.costCenter?.trim()||null,parent_fund_id:body.parentFundId||null,due_date:body.dueDate||null,status:"submitted"}).select("*").single();
    if(error)throw error;
    await admin.from("wama_expense_events").insert({tenant_id:membership.tenant_id,report_id:data.id,event_type:"created",to_status:"submitted",comment:"Solicitud enviada",created_by:profile.id});
    return NextResponse.json({ok:true,report:data,rendition:data});
  }catch(error){
    console.error("expense/renditions POST",error);
    return NextResponse.json({error:errorMessage(error,"No fue posible guardar la solicitud.")},{status:500});
  }
}

export async function PATCH(request:Request){
  try{
    const user=await requireWamaUser(request); const {admin,profile,membership}=await getUserTenantContext(user.id);
    const body=await request.json() as {id?:string;action?:string;status?:string;comment?:string;assignedTo?:string;approvedAmount?:number;amount?:number;reference?:string;paymentType?:string};
    if(!body.action&&body.status) body.action=body.status==="approved"?"approve":body.status==="rejected"?"reject":body.status==="observed"?"observe":undefined;
    if(!body.id||!body.action)return NextResponse.json({error:"Datos incompletos."},{status:400});
    const {data:current}=await admin.from("wama_expense_reports").select("*").eq("id",body.id).eq("tenant_id",membership.tenant_id).single();
    if(!current)return NextResponse.json({error:"Solicitud no encontrada."},{status:404});
    let next=current.status; const update:Record<string,unknown>={updated_at:new Date().toISOString()};
    if(body.action==="assign"){
      if(!reviewer(membership.role))return NextResponse.json({error:"Sin permiso para asignar."},{status:403});
      next="assigned"; update.assigned_to=body.assignedTo||profile.id;
    }else if(body.action==="observe"||body.action==="reject"||body.action==="approve"){
      if(!reviewer(membership.role))return NextResponse.json({error:"Sin permiso para revisar."},{status:403});
      next=body.action==="observe"?"observed":body.action==="reject"?"rejected":current.request_type==="fund_request"?"approved":"pending_payment";
      update.reviewed_by=profile.id; update.reviewed_at=new Date().toISOString(); update.review_comment=body.comment||null;
      if(body.action==="approve")update.approved_amount_clp=Number(body.approvedAmount||current.amount_clp);
    }else if(body.action==="resubmit"){
      if(current.submitted_by!==profile.id)return NextResponse.json({error:"Solo el solicitante puede reenviar."},{status:403}); next="submitted";
    }else if(body.action==="pay"){
      if(!finance(membership.role))return NextResponse.json({error:"Sin permiso para registrar pagos."},{status:403});
      const amount=Number(body.amount||0); const target=Number(current.approved_amount_clp||current.amount_clp); if(amount<=0||Number(current.paid_amount_clp)+amount>target)return NextResponse.json({error:"El abono debe ser mayor a cero y no superar el saldo."},{status:400});
      await admin.from("wama_expense_payments").insert({tenant_id:membership.tenant_id,report_id:current.id,amount_clp:amount,payment_type:body.paymentType||"installment",reference:body.reference||null,note:body.comment||null,created_by:profile.id});
      const paid=Number(current.paid_amount_clp)+amount; update.paid_amount_clp=paid; next=paid>=target?(current.request_type==="fund_request"?"open":"paid"):"partially_paid";
    }else if(body.action==="close_fund"){
      if(!finance(membership.role))return NextResponse.json({error:"Sin permiso para cerrar fondos."},{status:403}); next="settled";
    }else return NextResponse.json({error:"Acción no válida."},{status:400});
    update.status=next;
    const {data,error}=await admin.from("wama_expense_reports").update(update).eq("id",body.id).eq("tenant_id",membership.tenant_id).select("*").single(); if(error)throw error;
    await admin.from("wama_expense_events").insert({tenant_id:membership.tenant_id,report_id:body.id,event_type:body.action,from_status:current.status,to_status:next,comment:body.comment||null,metadata:{amount:body.amount||null,reference:body.reference||null},created_by:profile.id});
    return NextResponse.json({ok:true,report:data});
  }catch(error){
    console.error("expense/renditions PATCH",error);
    return NextResponse.json({error:errorMessage(error,"No fue posible actualizar la solicitud.")},{status:500});
  }
}
