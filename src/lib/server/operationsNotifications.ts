import type { SupabaseClient } from "@supabase/supabase-js";

type Notice = { tenantId:string; caseId:string; actorId:string; recipientIds:Iterable<string|null|undefined>; type:string; title:string; body:string };

export async function createOperationsNotifications(admin:SupabaseClient, notice:Notice) {
  const recipientIds=[...new Set([...notice.recipientIds].filter((id):id is string=>Boolean(id)))].filter(id=>id!==notice.actorId);
  if(!recipientIds.length)return;
  const {data:licensed}=await admin.from("wama_module_user_assignments")
    .select("profile_id,wama_tenant_module_licenses!inner(tenant_id,wama_module_catalog!inner(module_key))")
    .in("profile_id",recipientIds).eq("status","active")
    .eq("wama_tenant_module_licenses.tenant_id",notice.tenantId)
    .eq("wama_tenant_module_licenses.wama_module_catalog.module_key","operations");
  const allowed=new Set((licensed||[]).map(row=>row.profile_id));
  if(!allowed.size)return;
  const rows=[...allowed].map(recipient_profile_id=>({tenant_id:notice.tenantId,case_id:notice.caseId,recipient_profile_id,notification_type:notice.type,title:notice.title,body:notice.body}));
  await admin.from("wama_operations_notifications").insert(rows);
}
