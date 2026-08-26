-- WAMA M2 · Reparación puntual del piloto Pumay + protección de licencias.
-- Este script NO crea una empresa nueva. Corrige el tenant de prueba "GS"
-- asociado a gsanchez@pumay.cl y elimina licencias Operations duplicadas
-- únicamente dentro de ese tenant.
begin;

do $$
declare
  v_profile_id uuid;
  v_tenant_id uuid;
begin
  select p.id into v_profile_id
  from public.wama_profiles p
  where lower(p.email) = 'gsanchez@pumay.cl'
  limit 1;

  if v_profile_id is null then
    raise exception 'No existe el perfil gsanchez@pumay.cl en wama_profiles.';
  end if;

  select tm.tenant_id into v_tenant_id
  from public.wama_tenant_memberships tm
  join public.wama_tenants t on t.id = tm.tenant_id
  where tm.profile_id = v_profile_id
    and tm.role = 'owner'
    and tm.status = 'active'
    and lower(trim(t.name)) = 'gs'
  order by tm.joined_at asc
  limit 1;

  if v_tenant_id is null then
    raise exception 'No encontré un tenant owner llamado GS para gsanchez@pumay.cl. No se modificó nada.';
  end if;

  update public.wama_tenants
  set name = 'Pumay',
      updated_at = now()
  where id = v_tenant_id;

  -- Conserva la licencia Operations con mayor vigencia y elimina duplicados
  -- históricos del mismo módulo dentro de Pumay.
  with ranked as (
    select l.id,
           row_number() over (
             partition by l.tenant_id, m.module_key
             order by
               case l.status when 'active' then 1 when 'trial' then 2 when 'pending' then 3 else 4 end,
               l.renews_at desc nulls last,
               l.created_at desc,
               l.id desc
           ) as rn
    from public.wama_tenant_module_licenses l
    join public.wama_module_catalog m on m.id = l.module_id
    where l.tenant_id = v_tenant_id
      and m.module_key = 'operations'
  )
  delete from public.wama_tenant_module_licenses l
  using ranked r
  where l.id = r.id and r.rn > 1;
end $$;

commit;
