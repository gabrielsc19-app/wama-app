import { NextResponse } from "next/server";
import { getUserTenantContext, isTenantAdmin, requireWamaUser } from "../../../../src/lib/server/wamaAdmin";

const coordinators=(role:string)=>isTenantAdmin(role)||["manager","coordinator"].includes(role);
const message=(error:unknown)=>error instanceof Error?error.message:"No fue posible completar la solicitud.";

async function requireOperations(admin:ReturnType<typeof import("../../../../src/lib/server/wamaAdmin").getWamaAdmin>,tenantId:string){
  const {data}=await admin.from("wama_tenant_module_licenses").select("id,status,renews_at,wama_module_catalog!inner(module_key)").eq("tenant_id",tenantId).eq("wama_module_catalog.module_key","operations").in("status",["trial","active"]).maybeSingle();
  if(!data)throw new Error("Operations Hub no está activo para esta empresa.");
  return data;
}

export async function GET(request:Request){
  try{
    const user=await requireWamaUser(request); const {admin,profile,membership}=await getUserTenantContext(user.id); await requireOperations(admin,membership.tenant_id);
    const [{data:cases,error},{data:locations},{data:categories},{data:teams},{data:memberships}]=await Promise.all([
      admin.from("wama_operations_cases").select("*,location:wama_operations_locations(id,name,address),category:wama_operations_categories(id,name,sla_minutes),team:wama_operations_teams(id,name,color),reporter:wama_profiles!wama_operations_cases_reported_by_fkey(id,full_name,email),assignee:wama_profiles!wama_operations_cases_assigned_to_fkey(id,full_name,email),events:wama_operations_events(*),evidence:wama_operations_evidence(id,file_name,mime_type,file_size,created_at)").eq("tenant_id",membership.tenant_id).order("created_at",{ascending:false}),
      admin.from("wama_operations_locations").select("*").eq("tenant_id",membership.tenant_id).eq("status","active").order("name"),
      admin.from("wama_operations_categories").select("*").eq("tenant_id",membership.tenant_id).eq("status","active").order("name"),
      admin.from("wama_operations_teams").select("*,members:wama_operations_team_members(profile_id,team_role)").eq("tenant_id",membership.tenant_id).eq("status","active").order("name"),
      admin.from("wama_tenant_memberships").select("profile_id,role,status,wama_profiles(id,full_name,email)").eq("tenant_id",membership.tenant_id).eq("status","active")
    ]); if(error)throw error;
    return NextResponse.json({cases:cases||[],locations:locations||[],categories:categories||[],teams:teams||[],members:(memberships||[]).map(x=>({...x.wama_profiles,role:x.role})),profile,role:membership.role,canCoordinate:coordinators(membership.role)});
  }catch(error){return NextResponse.json({error:message(error)},{status:401});}
}

export async function POST(request:Request){
  try{
    const user=await requireWamaUser(request); const {admin,profile,membership}=await getUserTenantContext(user.id); await requireOperations(admin,membership.tenant_id);
    const body=await request.json() as {title?:string;description?:string;locationId?:string;categoryId?:string;teamId?:string;assignedTo?:string;priority?:string;isUrgent?:boolean;dueAt?:string};
    if(!body.title?.trim()||!body.description?.trim()||!body.locationId||!body.categoryId)return NextResponse.json({error:"Completa título, descripción, ubicación y categoría."},{status:400});
    const {data:category}=await admin.from("wama_operations_categories").select("id,default_team_id,sla_minutes,is_urgent_allowed").eq("id",body.categoryId).eq("tenant_id",membership.tenant_id).single(); if(!category)return NextResponse.json({error:"Categoría no válida."},{status:400});
    const urgent=Boolean(body.isUrgent&&category.is_urgent_allowed); const teamId=body.teamId||category.default_team_id||null; const status=body.assignedTo?"assigned":"unassigned";
    const dueAt=body.dueAt||new Date(Date.now()+Number(category.sla_minutes||1440)*60000).toISOString(); const caseNumber=`OPS-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
    const {data:created,error}=await admin.from("wama_operations_cases").insert({tenant_id:membership.tenant_id,case_number:caseNumber,title:body.title.trim(),description:body.description.trim(),location_id:body.locationId,category_id:body.categoryId,team_id:teamId,reported_by:profile.id,assigned_to:body.assignedTo||null,priority:urgent?"critical":body.priority||"medium",is_urgent:urgent,status,due_at:dueAt}).select("*").single(); if(error||!created)throw error;
    await admin.from("wama_operations_events").insert({tenant_id:membership.tenant_id,case_id:created.id,event_type:"created",to_status:status,comment:"Caso reportado",metadata:{urgent,team_id:teamId},created_by:profile.id});
    const recipients=new Set<string>(); if(teamId){const {data:teamMembers}=await admin.from("wama_operations_team_members").select("profile_id").eq("team_id",teamId);(teamMembers||[]).forEach(x=>recipients.add(x.profile_id));}
    if(urgent){const {data:urgentTeams}=await admin.from("wama_operations_teams").select("members:wama_operations_team_members(profile_id)").eq("tenant_id",membership.tenant_id).eq("receives_urgent",true);(urgentTeams||[]).forEach(t=>(t.members||[]).forEach((m:{profile_id:string})=>recipients.add(m.profile_id)));}
    recipients.delete(profile.id); if(recipients.size)await admin.from("wama_operations_notifications").insert([...recipients].map(recipient_profile_id=>({tenant_id:membership.tenant_id,case_id:created.id,recipient_profile_id,notification_type:urgent?"urgent_case":"new_case",title:urgent?`Alerta urgente ${caseNumber}`:`Nuevo caso ${caseNumber}`,body:body.title!.trim()})));
    return NextResponse.json({ok:true,case:created});
  }catch(error){return NextResponse.json({error:message(error)},{status:500});}
}

export async function PATCH(request:Request){
  try{
    const user=await requireWamaUser(request); const {admin,profile,membership}=await getUserTenantContext(user.id); await requireOperations(admin,membership.tenant_id);
    const body=await request.json() as {id?:string;action?:string;comment?:string;assignedTo?:string;teamId?:string;priority?:string;dueAt?:string}; if(!body.id||!body.action)return NextResponse.json({error:"Datos incompletos."},{status:400});
    const {data:current}=await admin.from("wama_operations_cases").select("*").eq("id",body.id).eq("tenant_id",membership.tenant_id).single(); if(!current)return NextResponse.json({error:"Caso no encontrado."},{status:404});
    const update:Record<string,unknown>={updated_at:new Date().toISOString()}; let next=current.status;
    if(body.action==="assign"){if(!coordinators(membership.role))return NextResponse.json({error:"Solo un coordinador puede asignar casos."},{status:403});if(!body.assignedTo)return NextResponse.json({error:"Selecciona un responsable."},{status:400});update.assigned_to=body.assignedTo;update.team_id=body.teamId||current.team_id;next="assigned";}
    else if(body.action==="take"){if(!["unassigned","assigned","reopened"].includes(current.status))return NextResponse.json({error:"Este caso ya fue tomado o cerrado."},{status:400});update.assigned_to=profile.id;update.taken_at=new Date().toISOString();next="taken";}
    else if(body.action==="start"){if(current.assigned_to!==profile.id&&!coordinators(membership.role))return NextResponse.json({error:"Solo el responsable o coordinador puede iniciar el trabajo."},{status:403});next="in_progress";}
    else if(body.action==="resolve"){if(current.assigned_to!==profile.id&&!coordinators(membership.role))return NextResponse.json({error:"Solo el responsable o coordinador puede resolver."},{status:403});if(!body.comment?.trim())return NextResponse.json({error:"Agrega un comentario de resolución."},{status:400});next="resolved";update.resolved_at=new Date().toISOString();}
    else if(body.action==="close"){if(!coordinators(membership.role)&&current.reported_by!==profile.id)return NextResponse.json({error:"Solo el creador o coordinador puede cerrar."},{status:403});next="closed";update.closed_at=new Date().toISOString();}
    else if(body.action==="reopen"){if(!coordinators(membership.role)&&current.reported_by!==profile.id)return NextResponse.json({error:"Sin permiso para reabrir."},{status:403});if(!body.comment?.trim())return NextResponse.json({error:"Indica el motivo de reapertura."},{status:400});next="reopened";update.resolved_at=null;update.closed_at=null;}
    else if(body.action==="comment"){}else if(body.action==="edit"){if(!coordinators(membership.role))return NextResponse.json({error:"Sin permiso para editar prioridad y plazo."},{status:403});if(body.priority)update.priority=body.priority;if(body.dueAt)update.due_at=body.dueAt;}
    else return NextResponse.json({error:"Acción no válida."},{status:400});
    update.status=next; const {data,error}=await admin.from("wama_operations_cases").update(update).eq("id",body.id).eq("tenant_id",membership.tenant_id).select("*").single();if(error)throw error;
    await admin.from("wama_operations_events").insert({tenant_id:membership.tenant_id,case_id:body.id,event_type:body.action,from_status:current.status,to_status:next,comment:body.comment?.trim()||null,metadata:{assigned_to:body.assignedTo||null,team_id:body.teamId||null},created_by:profile.id});
    const recipients=new Set<string>([current.reported_by,current.assigned_to,body.assignedTo].filter(Boolean));recipients.delete(profile.id);if(recipients.size)await admin.from("wama_operations_notifications").insert([...recipients].map(recipient_profile_id=>({tenant_id:membership.tenant_id,case_id:body.id,recipient_profile_id,notification_type:`case_${body.action}`,title:`${current.case_number} actualizado`,body:body.comment?.trim()||`Nuevo estado: ${next}`})));
    return NextResponse.json({ok:true,case:data});
  }catch(error){return NextResponse.json({error:message(error)},{status:500});}
}
