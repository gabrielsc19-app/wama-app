-- WAMA Operations V9: equipo mandante automático por empresa.
-- Para Pumay crea el equipo "Pumay" y agrega a los administradores licenciados de Operations.
begin;

do $$
declare
  tenant_record record;
  company_team_id uuid;
begin
  for tenant_record in
    select t.id, t.name
    from public.wama_tenants t
    where exists (
      select 1
      from public.wama_tenant_module_licenses l
      join public.wama_module_catalog m on m.id = l.module_id
      where l.tenant_id = t.id
        and m.module_key = 'operations'
        and l.status in ('trial','active')
    )
  loop
    insert into public.wama_operations_teams(
      tenant_id,name,color,receives_urgent,status,description,response_sla_minutes
    ) values (
      tenant_record.id,tenant_record.name,'#00B8AE',true,'active',
      'Equipo mandante y administrador de la empresa. Recibe casos que requieren gestión interna.',1440
    )
    on conflict (tenant_id,name) do update set
      status='active',
      deleted_at=null,
      deleted_by=null,
      deletion_reason=null,
      receives_urgent=true,
      description=excluded.description,
      updated_at=now()
    returning id into company_team_id;

    insert into public.wama_operations_team_members(
      team_id,profile_id,team_role,notify_new_cases,notify_updates,notify_urgent,notify_email,notify_push
    )
    select distinct
      company_team_id, tm.profile_id, 'coordinator', true,true,true,true,true
    from public.wama_tenant_memberships tm
    join public.wama_tenant_module_licenses l on l.tenant_id=tm.tenant_id
    join public.wama_module_catalog m on m.id=l.module_id and m.module_key='operations'
    join public.wama_module_user_assignments a on a.tenant_module_license_id=l.id and a.profile_id=tm.profile_id
    where tm.tenant_id=tenant_record.id
      and tm.status='active'
      and tm.role in ('owner','admin','super_admin')
      and a.status='active'
    on conflict (team_id,profile_id) do update set
      team_role='coordinator',notify_new_cases=true,notify_updates=true,notify_urgent=true,notify_email=true,notify_push=true;
  end loop;
end $$;

commit;
