import { NextResponse } from "next/server";
import { createOperationsNotifications } from "../../../../src/lib/server/operationsNotifications";
import { getOperationsContext, operationsError } from "../../../../src/lib/server/operationsAccess";

const allowedPriorities=["low","medium","high","critical"];
const allowedActions=["assign","assign_scope","take","start","comment","resolve","close","reopen","edit","delete","restore"];
const responseError=(error:unknown)=>{const value=operationsError(error);return NextResponse.json({error:value.message},{status:value.status});};

async function teamRecipients(admin:Awaited<ReturnType<typeof getOperationsContext>>["admin"],teamId:string|null,kind:"new"|"update"|"urgent"){
  if(!teamId)return [];
  const column=kind==="new"?"notify_new_cases":kind==="urgent"?"notify_urgent":"notify_updates";
  const {data}=await admin.from("wama_operations_team_members").select(`profile_id,${column}`).eq("team_id",teamId).eq(column,true);
  return (data||[]).map(row=>row.profile_id);
}

async function projectRecipients(
  admin: Awaited<ReturnType<typeof getOperationsContext>>["admin"],
  projectId: string | null,
) {
  if (!projectId) return [];
  const { data } = await admin
    .from("wama_project_members")
    .select("profile_id")
    .eq("project_id", projectId);
  return (data || []).map((row) => row.profile_id);
}

export async function GET(request:Request){
  try{
    const context=await getOperationsContext(request);const{admin,profile,tenantId}=context;
    const params=new URL(request.url).searchParams;
    const includeArchived=params.get("archived")==="true"&&context.canAdmin;
    const requestedProjectId=params.get("projectId")||"";
    const requestedCaseId=params.get("caseId")||"";
    if(requestedCaseId){
      const{data:detail,error:detailError}=await admin.from("wama_operations_cases").select("*,location:wama_operations_locations(id,name,address),category:wama_operations_categories(id,name,sla_minutes),team:wama_operations_teams(id,name,color),reporter:wama_profiles!wama_operations_cases_reported_by_fkey(id,full_name,email),assignee:wama_profiles!wama_operations_cases_assigned_to_fkey(id,full_name,email),events:wama_operations_events(*)").eq("tenant_id",tenantId).eq("id",requestedCaseId).maybeSingle();
      if(detailError)throw detailError;if(!detail)return NextResponse.json({error:"Caso no encontrado."},{status:404});
      if(!context.canAdmin&&detail.project_id){const{data:membership}=await admin.from("wama_project_members").select("id").eq("project_id",detail.project_id).eq("profile_id",profile.id).maybeSingle();if(!membership)return NextResponse.json({error:"No tienes acceso a este caso."},{status:403});}
      return NextResponse.json({case:detail});
    }
    let query=admin.from("wama_operations_cases").select("id,tenant_id,case_number,title,description,priority,is_urgent,status,due_at,created_at,resolved_at,reported_by,assigned_to,project_id,assignment_scope,location:wama_operations_locations(id,name,address),category:wama_operations_categories(id,name,sla_minutes),team:wama_operations_teams(id,name,color),reporter:wama_profiles!wama_operations_cases_reported_by_fkey(id,full_name,email),assignee:wama_profiles!wama_operations_cases_assigned_to_fkey(id,full_name,email)").eq("tenant_id",tenantId).order("created_at",{ascending:false});
    query=includeArchived?query.not("deleted_at","is",null):query.is("deleted_at",null);
    const {data:projectMemberships,error:projectMembershipError}=await admin.from("wama_project_members").select("project_id,role,wama_projects!inner(id,name,code,status,tenant_id,wama_project_modules!inner(tenant_module_license_id))").eq("profile_id",profile.id).eq("wama_projects.tenant_id",tenantId).eq("wama_projects.status","active").eq("wama_projects.wama_project_modules.tenant_module_license_id",context.license.id);
    if(projectMembershipError)throw projectMembershipError;
    const projectIds=(projectMemberships||[]).map(item=>item.project_id);
    const {data:allProjects,error:projectsError}=context.canAdmin?await admin.from("wama_projects").select("id,name,code,status").eq("tenant_id",tenantId).eq("status","active").in("id",(await admin.from("wama_project_modules").select("project_id").eq("tenant_module_license_id",context.license.id)).data?.map(x=>x.project_id)||[]):{data:(projectMemberships||[]).map((item:any)=>item.wama_projects),error:null};
    if(projectsError)throw projectsError;
    const projects=(allProjects||[]).filter(Boolean);
    if(requestedProjectId){if(!context.canAdmin&&!projectIds.includes(requestedProjectId))return NextResponse.json({error:"No tienes acceso a este proyecto."},{status:403});query=query.eq("project_id",requestedProjectId);}else if(!context.canAdmin){if(!projectIds.length)query=query.eq("project_id","00000000-0000-0000-0000-000000000000");else query=query.in("project_id",projectIds);}
    const [{data:cases,error},{data:locations},{data:categories},{data:teams},{data:setup},{data:notifications},{count:usedSeats}]=await Promise.all([
      query,
      requestedProjectId
        ? admin.from("wama_operations_locations").select("*").eq("tenant_id",tenantId).eq("project_id",requestedProjectId).eq("status","active").order("sort_order").order("name")
        : admin.from("wama_operations_locations").select("*").eq("tenant_id",tenantId).eq("status","active").order("sort_order").order("name"),
      admin.from("wama_operations_categories").select("*").eq("tenant_id",tenantId).eq("status","active").order("name"),
      admin.from("wama_operations_teams").select("*,members:wama_operations_team_members(profile_id,team_role,notify_new_cases,notify_updates,notify_urgent,notify_email,notify_push)").eq("tenant_id",tenantId).eq("status","active").order("name"),
      admin.from("wama_operations_setup").select("*").eq("tenant_id",tenantId).maybeSingle(),
      admin.from("wama_operations_notifications").select("*").eq("tenant_id",tenantId).eq("recipient_profile_id",profile.id).is("read_at",null).order("created_at",{ascending:false}).limit(15),
      admin.from("wama_module_user_assignments").select("id",{count:"exact",head:true}).eq("tenant_module_license_id",context.license.id).in("status",["active","invited"]),
    ]);if(error)throw error;
    const {data:assignments,error:assignmentsError}=await admin.from("wama_module_user_assignments").select("profile_id,module_role,status").eq("tenant_module_license_id",context.license.id).in("status",["active","invited"]);
    if(assignmentsError)throw assignmentsError;
    const profileIds=[...new Set((assignments||[]).map(row=>row.profile_id).filter(Boolean))];
    const {data:licensedProfiles,error:profilesError}=profileIds.length
      ?await admin.from("wama_profiles").select("id,full_name,email").in("id",profileIds)
      :{data:[],error:null};
    if(profilesError)throw profilesError;
    const profilesById=new Map((licensedProfiles||[]).map(item=>[item.id,item]));
    const members=(assignments||[]).map(row=>{const member=profilesById.get(row.profile_id);return member?{...member,role:row.module_role,license_status:row.status}:null}).filter(Boolean);
    const capacity=context.license.included_seats+context.license.extra_seat_blocks*context.license.extra_block_size;
    return NextResponse.json({cases:cases||[],projects,locations:locations||[],categories:categories||[],teams:teams||[],members,notifications:notifications||[],setup,profile,moduleRole:context.moduleRole,canAdmin:context.canAdmin,canCoordinate:context.canCoordinate,canWork:context.canWork,license:{used:usedSeats||0,capacity,blocks:1+context.license.extra_seat_blocks,status:context.license.status}});
  }catch(error){return responseError(error)}
}

export async function POST(request:Request){
  try{
    const{admin,profile,tenantId}=await getOperationsContext(request);
    const body=await request.json() as {title?:string;description?:string;locationId?:string;categoryId?:string;teamId?:string;priority?:string;isUrgent?:boolean;dueAt?:string;projectId?:string};
    if(!body.title?.trim()||!body.description?.trim()||!body.locationId||!body.categoryId||!body.projectId)return NextResponse.json({error:"Completa proyecto, título, descripción, ubicación y categoría."},{status:400});
    const{data:project}=await admin.from("wama_projects").select("id").eq("id",body.projectId).eq("tenant_id",tenantId).eq("status","active").maybeSingle();if(!project)return NextResponse.json({error:"El proyecto no pertenece a tu empresa."},{status:400});
    const{data:projectModule}=await admin.from("wama_project_modules").select("id").eq("project_id",body.projectId).eq("tenant_module_license_id",(await getOperationsContext(request)).license.id).maybeSingle();if(!projectModule)return NextResponse.json({error:"El proyecto no está habilitado para Operations Hub."},{status:400});
    const{data:projectMember}=await admin.from("wama_project_members").select("id").eq("project_id",body.projectId).eq("profile_id",profile.id).maybeSingle();if(!projectMember)return NextResponse.json({error:"No perteneces a este proyecto."},{status:403});
    if(body.title.trim().length>140||body.description.trim().length>4000)return NextResponse.json({error:"El título o la descripción superan el máximo permitido."},{status:400});
    const [{data:location},{data:category}]=await Promise.all([
      admin.from("wama_operations_locations").select("id,project_id").eq("id",body.locationId).eq("tenant_id",tenantId).eq("project_id",body.projectId).eq("status","active").maybeSingle(),
      admin.from("wama_operations_categories").select("id,default_team_id,sla_minutes,is_urgent_allowed").eq("id",body.categoryId).eq("tenant_id",tenantId).eq("status","active").maybeSingle(),
    ]);if(!location||!category)return NextResponse.json({error:"La ubicación o categoría no pertenece a tu empresa."},{status:400});
    const teamId=body.teamId||category.default_team_id||null;if(teamId){const{data:team}=await admin.from("wama_operations_teams").select("id").eq("id",teamId).eq("tenant_id",tenantId).eq("status","active").maybeSingle();if(!team)return NextResponse.json({error:"El equipo seleccionado no es válido."},{status:400});}
    const urgent=Boolean(body.isUrgent&&category.is_urgent_allowed);const priority=urgent?"critical":allowedPriorities.includes(body.priority||"")?body.priority:"medium";
    const dueAt=body.dueAt&&Number.isFinite(Date.parse(body.dueAt))?new Date(body.dueAt).toISOString():new Date(Date.now()+Number(category.sla_minutes||1440)*60000).toISOString();
    const caseNumber=`OPS-${new Date().getFullYear()}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
    const initialScope=teamId?"team":"unassigned";
    const initialStatus=teamId?"assigned":"unassigned";
    const{data:created,error}=await admin.from("wama_operations_cases").insert({tenant_id:tenantId,case_number:caseNumber,title:body.title.trim(),description:body.description.trim(),location_id:body.locationId,category_id:body.categoryId,team_id:teamId,assigned_to:null,assignment_scope:initialScope,reported_by:profile.id,project_id:body.projectId,priority,is_urgent:urgent,status:initialStatus,due_at:dueAt}).select("*").single();if(error||!created)throw error;
    await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:created.id,event_type:"created",to_status:initialStatus,comment:"Caso reportado",metadata:{urgent,team_id:teamId,assignment_scope:initialScope},created_by:profile.id});
    const regular=await teamRecipients(admin,teamId,urgent?"urgent":"new");
    let urgentIds:string[]=[];if(urgent){const{data:urgentTeams}=await admin.from("wama_operations_teams").select("id").eq("tenant_id",tenantId).eq("receives_urgent",true).eq("status","active");urgentIds=(await Promise.all((urgentTeams||[]).map(team=>teamRecipients(admin,team.id,"urgent")))).flat();}
    const notification=await createOperationsNotifications(admin,{tenantId,caseId:created.id,actorId:profile.id,recipientIds:[...regular,...urgentIds],type:urgent?"urgent_case":"new_case",title:urgent?`Alerta urgente ${caseNumber}`:`Nuevo caso ${caseNumber}`,body:created.title});
    return NextResponse.json({ok:true,case:created,notification},{status:201});
  }catch(error){return responseError(error)}
}

export async function PATCH(request:Request){
  try{
    const context=await getOperationsContext(request);const{admin,profile,tenantId}=context;
    const body=await request.json() as {id?:string;action?:string;comment?:string;assignedTo?:string;teamId?:string;assignmentScope?:"project"|"team"|"person"|"unassigned";priority?:string;dueAt?:string};
    if(!body.id||!body.action||!allowedActions.includes(body.action))return NextResponse.json({error:"Acción no válida."},{status:400});
    const{data:current}=await admin.from("wama_operations_cases").select("*").eq("id",body.id).eq("tenant_id",tenantId).maybeSingle();if(!current)return NextResponse.json({error:"Caso no encontrado."},{status:404});
    if(body.action==="restore"){if(!context.canAdmin)return NextResponse.json({error:"Solo el administrador puede restaurar casos."},{status:403});await admin.from("wama_operations_cases").update({deleted_at:null,deleted_by:null,deletion_reason:null}).eq("id",current.id);await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:current.id,event_type:"restore",comment:body.comment?.trim()||"Caso restaurado",created_by:profile.id});return NextResponse.json({ok:true});}
    if(current.deleted_at)return NextResponse.json({error:"Este caso está archivado."},{status:409});
    if(body.action==="delete"){if(!context.canAdmin)return NextResponse.json({error:"Solo el owner o administrador puede eliminar casos."},{status:403});if(!body.comment?.trim()||body.comment.trim().length<5)return NextResponse.json({error:"Indica un motivo de eliminación de al menos 5 caracteres."},{status:400});await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:current.id,event_type:"delete",from_status:current.status,to_status:"archived",comment:body.comment.trim(),created_by:profile.id});await admin.from("wama_operations_cases").update({deleted_at:new Date().toISOString(),deleted_by:profile.id,deletion_reason:body.comment.trim(),updated_at:new Date().toISOString()}).eq("id",current.id);return NextResponse.json({ok:true});}
    const update:Record<string,unknown>={updated_at:new Date().toISOString()};let next=current.status;
    if(body.action==="assign"){
      if(!context.canCoordinate)return NextResponse.json({error:"Solo un coordinador puede asignar casos."},{status:403});
      if(!body.assignedTo)return NextResponse.json({error:"Selecciona un responsable."},{status:400});
      const{data:target}=await admin.from("wama_module_user_assignments").select("profile_id").eq("tenant_module_license_id",context.license.id).eq("profile_id",body.assignedTo).eq("status","active").maybeSingle();
      if(!target)return NextResponse.json({error:"El responsable necesita una licencia activa de Operations Hub."},{status:400});
      update.assigned_to=body.assignedTo;
      update.team_id=body.teamId||current.team_id;
      update.assignment_scope="person";
      next="assigned";
    }
    else if(body.action==="assign_scope"){
      if(!context.canCoordinate)return NextResponse.json({error:"Solo un coordinador puede asignar casos."},{status:403});
      if(body.assignmentScope==="project"){
        if(!current.project_id)return NextResponse.json({error:"Este caso no está asociado a un proyecto."},{status:400});
        if(current.assignment_scope==="project"&&!current.assigned_to){
          return NextResponse.json({ok:true,unchanged:true,message:"El caso ya está asignado a todos los participantes del proyecto."});
        }
        update.assigned_to=null;
        update.team_id=null;
        update.assignment_scope="project";
        next="assigned";
      }else if(body.assignmentScope==="team"){
        if(!body.teamId)return NextResponse.json({error:"Selecciona un equipo."},{status:400});
        const{data:team}=await admin.from("wama_operations_teams").select("id,name").eq("id",body.teamId).eq("tenant_id",tenantId).eq("status","active").maybeSingle();
        if(!team)return NextResponse.json({error:"El equipo seleccionado no es válido."},{status:400});
        if(current.assignment_scope==="team"&&current.team_id===body.teamId&&!current.assigned_to){
          return NextResponse.json({ok:true,unchanged:true,message:`El caso ya está asignado al Equipo ${team.name}.`});
        }
        update.assigned_to=null;
        update.team_id=body.teamId;
        update.assignment_scope="team";
        next="assigned";
      }else{
        return NextResponse.json({error:"Selecciona Todos los participantes o un equipo."},{status:400});
      }
    }
    else if(body.action==="take"){
      if(!context.canWork)return NextResponse.json({error:"Tu perfil no puede tomar casos."},{status:403});
      if(!["unassigned","assigned","reopened"].includes(current.status))return NextResponse.json({error:"Este caso ya fue tomado o cerrado."},{status:400});

      const scope=current.assignment_scope||(
        current.assigned_to?"person":current.team_id?"team":"unassigned"
      );

      if(scope==="person"&&current.assigned_to&&current.assigned_to!==profile.id&&!context.canCoordinate){
        return NextResponse.json({error:"Este caso fue asignado a otra persona."},{status:403});
      }

      if(scope==="team"&&current.team_id&&!context.canCoordinate){
        const{data:teamMember}=await admin.from("wama_operations_team_members")
          .select("profile_id")
          .eq("team_id",current.team_id)
          .eq("profile_id",profile.id)
          .maybeSingle();
        if(!teamMember)return NextResponse.json({error:"Este caso fue asignado a otro equipo."},{status:403});
      }

      if(scope==="project"&&current.project_id&&!context.canCoordinate){
        const{data:projectMember}=await admin.from("wama_project_members")
          .select("profile_id")
          .eq("project_id",current.project_id)
          .eq("profile_id",profile.id)
          .maybeSingle();
        if(!projectMember)return NextResponse.json({error:"No perteneces al proyecto de este caso."},{status:403});
      }

      update.assigned_to=profile.id;
      update.assignment_scope="person";
      update.taken_at=new Date().toISOString();
      next="taken";
    }
    else if(body.action==="start"){if(current.assigned_to!==profile.id&&!context.canCoordinate)return NextResponse.json({error:"Solo el responsable o coordinador puede iniciar el trabajo."},{status:403});next="in_progress";}
    else if(body.action==="resolve"){if(current.assigned_to!==profile.id&&!context.canCoordinate)return NextResponse.json({error:"Solo el responsable o coordinador puede resolver."},{status:403});if(!body.comment?.trim())return NextResponse.json({error:"Agrega un comentario de resolución."},{status:400});next="resolved";update.resolved_at=new Date().toISOString();}
    else if(body.action==="close"){
      const canClose=context.canAdmin||context.canCoordinate||current.reported_by===profile.id||current.assigned_to===profile.id;
      if(!canClose)return NextResponse.json({error:"Solo el responsable, reportante o coordinador puede cerrar."},{status:403});
      if(current.status!=="resolved")return NextResponse.json({error:"Primero marca el caso como resuelto antes de cerrarlo."},{status:400});
      if(!body.comment?.trim())return NextResponse.json({error:"Agrega un comentario final de cierre."},{status:400});
      next="closed";update.closed_at=new Date().toISOString();
    }
    else if(body.action==="reopen"){if(!context.canCoordinate&&current.reported_by!==profile.id)return NextResponse.json({error:"Sin permiso para reabrir."},{status:403});if(!body.comment?.trim())return NextResponse.json({error:"Indica el motivo de reapertura."},{status:400});next="reopened";update.resolved_at=null;update.closed_at=null;}
    else if(body.action==="edit"){if(!context.canCoordinate)return NextResponse.json({error:"Sin permiso para editar prioridad y plazo."},{status:403});if(body.priority&&allowedPriorities.includes(body.priority))update.priority=body.priority;if(body.dueAt&&Number.isFinite(Date.parse(body.dueAt)))update.due_at=new Date(body.dueAt).toISOString();}
    else if(body.action==="comment"&&!body.comment?.trim())return NextResponse.json({error:"Escribe un comentario."},{status:400});
    update.status=next;const{data,error}=await admin.from("wama_operations_cases").update(update).eq("id",current.id).eq("tenant_id",tenantId).select("*").single();if(error)throw error;
    await admin.from("wama_operations_events").insert({tenant_id:tenantId,case_id:current.id,event_type:body.action,from_status:current.status,to_status:next,comment:body.comment?.trim()||null,metadata:{assigned_to:body.assignedTo||null,team_id:body.teamId||null,assignment_scope:body.assignmentScope||null},created_by:profile.id});
    const effectiveTeamId=String(update.team_id||current.team_id||"");
    const assignmentScope=String(update.assignment_scope||current.assignment_scope||"");
    const teamIds=assignmentScope==="team"
      ?await teamRecipients(admin,effectiveTeamId,"update")
      :[];
    const projectIds=assignmentScope==="project"
      ?await projectRecipients(admin,current.project_id||null)
      :[];

    const notification=await createOperationsNotifications(admin,{
      tenantId,
      caseId:current.id,
      actorId:profile.id,
      recipientIds:[current.reported_by,current.assigned_to,body.assignedTo,...teamIds,...projectIds],
      type:`case_${body.action}`,
      title:
        body.action==="assign_scope"
          ? assignmentScope==="project"
            ? `${current.case_number} enviado a todos`
            : `${current.case_number} enviado a equipo`
          : body.action==="take"
            ? `${current.case_number} fue tomado`
            : body.action==="start"
              ? `${current.case_number} en gestión`
              : body.action==="resolve"
                ? `${current.case_number} resuelto`
                : body.action==="close"
                  ? `${current.case_number} cerrado`
                  : `${current.case_number} actualizado`,
      body:body.comment?.trim()||current.title,
    });
    return NextResponse.json({ok:true,case:data,notification});
  }catch(error){return responseError(error)}
}
