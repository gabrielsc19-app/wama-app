import { NextResponse } from "next/server";
import { createOperationsNotifications } from "../../../../src/lib/server/operationsNotifications";
import { getOperationsContext, operationsError } from "../../../../src/lib/server/operationsAccess";

const allowedPriorities=["low","medium","high","critical"];
const allowedActions=["assign","take","start","comment","resolve","close","reopen","edit","delete","restore"];
const responseError=(error:unknown)=>{const value=operationsError(error);return NextResponse.json({error:value.message},{status:value.status});};

async function teamRecipients(admin:Awaited<ReturnType<typeof getOperationsContext>>["admin"],teamId:string|null,kind:"new"|"update"|"urgent"){
  if(!teamId)return [];
  const column=kind==="new"?"notify_new_cases":kind==="urgent"?"notify_urgent":"notify_updates";
  const {data}=await admin.from("wama_operations_team_members").select(`profile_id,${column}`).eq("team_id",teamId).eq(column,true);
  return (data||[]).map(row=>row.profile_id);
}

export async function GET(request:Request){
  try{
    const context=await getOperationsContext(request);const{admin,profile,tenantId}=context;
    const includeArchived=new URL(request.url).searchParams.get("archived")==="true"&&context.canAdmin;
    let query=admin.from("wama_operations_cases").select("*,location:wama_operations_locations(id,name,address),category:wama_operations_categories(id,name,sla_minutes),team:wama_operations_teams(id,name,color),reporter:wama_profiles!wama_operations_cases_reported_by_fkey(id,full_name,email),assignee:wama_profiles!wama_operations_cases_assigned_to_fkey(id,full_name,email),events:wama_operations_events(*),evidence:wama_operations_evidence(id,file_name,mime_type,file_size,created_at)").eq("tenant_id",tenantId).order("created_at",{ascending:false});
    query=includeArchived?query.not("deleted_at","is",null):query.is("deleted_at",null);
    const [{data:cases,error},{data:locations},{data:categories},{data:teams},{data:setup},{data:notifications},{count:usedSeats}]=await Promise.all([
      query,
      admin.from("wama_operations_locations").select("*").eq("tenant_id",tenantId).eq("status","active").order("name"),
      admin.from("wama_operations_categories").select("*").eq("tenant_id",tenantId).eq("status","active").order("name"),
      admin.from("wama_operations_teams").select("*,members:wama_operations_team_members(profile_id,team_role,notify_new_cases,notify_updates,notify_urgent,notify_email,notify_push)").eq("tenant_id",tenantId).eq("status","active").order("name"),
      admin.from("wama_operations_setup").select("*").eq("tenant_id",tenantId).maybeSingle(),
      admin.from("wama_operations_notifications").select("*").eq("tenant_id",tenantId).eq("recipient_profile_id",profile.id).is("read_at",null).order("created_at",{ascending:false}).limit(30),
      admin.from("wama_module_user_assignments").select("id",{count:"exact",head:true}).eq("tenant_module_license_id",context.license.id).eq("status","active"),
    ]);if(error)throw error;
    const {data:assignments}=await admin.from("wama_module_user_assignments").select("profile_id,module_role,wama_profiles(id,full_name,email)").eq("tenant_module_license_id",context.license.id).eq("status","active");
    const members=(assignments||[]).map(row=>({...row.wama_profiles,role:row.module_role}));
    const capacity=context.license.included_seats+context.license.extra_seat_blocks*context.license.extra_block_size;
    return NextResponse.json({cases:cases||[],locations:locations||[],categories:categories||[],teams:teams||[],members,notifications:notifications||[],setup,profile,moduleRole:context.moduleRole,canAdmin:context.canAdmin,canCoordinate:context.canCoordinate,canWork:context.canWork,license:{used:usedSeats||0,capacity,blocks:1+context.license.extra_seat_blocks,status:context.license.status}});
  }catch(error){return responseError(error)}
}

export async function POST(request:Request){
  try{
    const{admin,profile,tenantId}=await getOperationsContext(request);
    const body=await request.json() as {title?:string;description?:string;locationId?:string;categoryId?:string;teamId?:string;priority?:string;isUrgent?:boolean;dueAt?:string};
    if(!body.title?.trim()||!body.description?.trim()||!body.locationId||!body.categoryId)return NextResponse.json({error:"Completa título, descripción, ubicación y categoría."},{status:400});
    if(body.title.trim().length>140||body.description.trim().length>4000)return NextResponse.json({error:"El título o la descripción superan el máximo permitido."},{status:400});
    const [{data:location},{data:category}]=await Promise.all([
      admin.from("wama_operations_locations").select("id").eq("id",body.locationId).eq("tenant_id",tenantId).eq("status","active").maybeSingle(),
      admin.from("wama_operations_categories").select("id,default_team_id,sla_minutes,is_urgent_allowed").eq("id",body.categoryId).eq("tenant_id",tenantId).eq("status","active").maybeSingle(),
    ]);if(!location||!category)return NextResponse.json({error:"La ubicación o categoría no pertenece a tu empresa."},{status:400});
    const teamId=body.teamId||category.default_team_id||null;if(teamId){const{data:team}=await admin.from("wama_operations_teams").select("id").eq("id",teamId).eq("tenant_id",tenantId).eq("status","active").maybeSingle();if(!team)return NextResponse.json({error:"El equipo seleccionado no es válido."},{status:400});}
    const urgent=Boolean(body.isUrgent&&category.is_urgent_allowed);const priority=urgent?"critical":allowedPriorities.includes(body.priority||"")?body.priority:"medium";
    const dueAt=body.dueAt&&Number.isFinite(Date.parse(body.dueAt))?new Date(body.dueAt).toISOString():new Date(Date.now()+Number(category.sla_minutes||1440)*60000).toISOString();
    const caseNumber=`OPS-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
    const{data:created,error}=await admin.from("wama_operations_cases").insert({tenant_id:tenantId,case_number:caseNumber,title:body.title.trim(),description:body.description.trim(),location_id:body.locationId,category_id:body.categoryId,team_id:teamId,reported_by:profile.id,priority,is_urgent:urgent,status:"unassigned",due_at:dueAt}).select("*").single();if(error||!created)throw error;
    await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:created.id,event_type:"created",to_status:"unassigned",comment:"Caso reportado",metadata:{urgent,team_id:teamId},created_by:profile.id});
    const regular=await teamRecipients(admin,teamId,urgent?"urgent":"new");
    let urgentIds:string[]=[];if(urgent){const{data:urgentTeams}=await admin.from("wama_operations_teams").select("id").eq("tenant_id",tenantId).eq("receives_urgent",true).eq("status","active");urgentIds=(await Promise.all((urgentTeams||[]).map(team=>teamRecipients(admin,team.id,"urgent")))).flat();}
    await createOperationsNotifications(admin,{tenantId,caseId:created.id,actorId:profile.id,recipientIds:[...regular,...urgentIds],type:urgent?"urgent_case":"new_case",title:urgent?`Alerta urgente ${caseNumber}`:`Nuevo caso ${caseNumber}`,body:created.title});
    return NextResponse.json({ok:true,case:created},{status:201});
  }catch(error){return responseError(error)}
}

export async function PATCH(request:Request){
  try{
    const context=await getOperationsContext(request);const{admin,profile,tenantId}=context;
    const body=await request.json() as {id?:string;action?:string;comment?:string;assignedTo?:string;teamId?:string;priority?:string;dueAt?:string};
    if(!body.id||!body.action||!allowedActions.includes(body.action))return NextResponse.json({error:"Acción no válida."},{status:400});
    const{data:current}=await admin.from("wama_operations_cases").select("*").eq("id",body.id).eq("tenant_id",tenantId).maybeSingle();if(!current)return NextResponse.json({error:"Caso no encontrado."},{status:404});
    if(body.action==="restore"){if(!context.canAdmin)return NextResponse.json({error:"Solo el administrador puede restaurar casos."},{status:403});await admin.from("wama_operations_cases").update({deleted_at:null,deleted_by:null,deletion_reason:null}).eq("id",current.id);await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:current.id,event_type:"restore",comment:body.comment?.trim()||"Caso restaurado",created_by:profile.id});return NextResponse.json({ok:true});}
    if(current.deleted_at)return NextResponse.json({error:"Este caso está archivado."},{status:409});
    if(body.action==="delete"){if(!context.canAdmin)return NextResponse.json({error:"Solo el owner o administrador puede eliminar casos."},{status:403});if(!body.comment?.trim()||body.comment.trim().length<5)return NextResponse.json({error:"Indica un motivo de eliminación de al menos 5 caracteres."},{status:400});await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:current.id,event_type:"delete",from_status:current.status,to_status:"archived",comment:body.comment.trim(),created_by:profile.id});await admin.from("wama_operations_cases").update({deleted_at:new Date().toISOString(),deleted_by:profile.id,deletion_reason:body.comment.trim(),updated_at:new Date().toISOString()}).eq("id",current.id);return NextResponse.json({ok:true});}
    const update:Record<string,unknown>={updated_at:new Date().toISOString()};let next=current.status;
    if(body.action==="assign"){if(!context.canCoordinate)return NextResponse.json({error:"Solo un coordinador puede asignar casos."},{status:403});if(!body.assignedTo)return NextResponse.json({error:"Selecciona un responsable."},{status:400});const{data:target}=await admin.from("wama_module_user_assignments").select("profile_id").eq("tenant_module_license_id",context.license.id).eq("profile_id",body.assignedTo).eq("status","active").maybeSingle();if(!target)return NextResponse.json({error:"El responsable necesita una licencia activa de Operations Hub."},{status:400});update.assigned_to=body.assignedTo;update.team_id=body.teamId||current.team_id;next="assigned";}
    else if(body.action==="take"){if(!context.canWork)return NextResponse.json({error:"Tu perfil no puede tomar casos."},{status:403});if(!["unassigned","assigned","reopened"].includes(current.status))return NextResponse.json({error:"Este caso ya fue tomado o cerrado."},{status:400});update.assigned_to=profile.id;update.taken_at=new Date().toISOString();next="taken";}
    else if(body.action==="start"){if(current.assigned_to!==profile.id&&!context.canCoordinate)return NextResponse.json({error:"Solo el responsable o coordinador puede iniciar el trabajo."},{status:403});next="in_progress";}
    else if(body.action==="resolve"){if(current.assigned_to!==profile.id&&!context.canCoordinate)return NextResponse.json({error:"Solo el responsable o coordinador puede resolver."},{status:403});if(!body.comment?.trim())return NextResponse.json({error:"Agrega un comentario de resolución."},{status:400});next="resolved";update.resolved_at=new Date().toISOString();}
    else if(body.action==="close"){if(!context.canCoordinate&&current.reported_by!==profile.id)return NextResponse.json({error:"Solo el reportante o coordinador puede cerrar."},{status:403});next="closed";update.closed_at=new Date().toISOString();}
    else if(body.action==="reopen"){if(!context.canCoordinate&&current.reported_by!==profile.id)return NextResponse.json({error:"Sin permiso para reabrir."},{status:403});if(!body.comment?.trim())return NextResponse.json({error:"Indica el motivo de reapertura."},{status:400});next="reopened";update.resolved_at=null;update.closed_at=null;}
    else if(body.action==="edit"){if(!context.canCoordinate)return NextResponse.json({error:"Sin permiso para editar prioridad y plazo."},{status:403});if(body.priority&&allowedPriorities.includes(body.priority))update.priority=body.priority;if(body.dueAt&&Number.isFinite(Date.parse(body.dueAt)))update.due_at=new Date(body.dueAt).toISOString();}
    else if(body.action==="comment"&&!body.comment?.trim())return NextResponse.json({error:"Escribe un comentario."},{status:400});
    update.status=next;const{data,error}=await admin.from("wama_operations_cases").update(update).eq("id",current.id).eq("tenant_id",tenantId).select("*").single();if(error)throw error;
    await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:current.id,event_type:body.action,from_status:current.status,to_status:next,comment:body.comment?.trim()||null,metadata:{assigned_to:body.assignedTo||null,team_id:body.teamId||null},created_by:profile.id});
    const teamIds=await teamRecipients(admin,String(update.team_id||current.team_id||""),"update");
    await createOperationsNotifications(admin,{tenantId,caseId:current.id,actorId:profile.id,recipientIds:[current.reported_by,current.assigned_to,body.assignedTo,...teamIds],type:`case_${body.action}`,title:`${current.case_number} actualizado`,body:body.comment?.trim()||`Nuevo estado: ${next}`});
    return NextResponse.json({ok:true,case:data});
  }catch(error){return responseError(error)}
}
