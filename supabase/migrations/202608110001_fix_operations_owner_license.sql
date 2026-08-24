begin;

-- Corrige empresas antiguas en las que el administrador principal no quedo
-- clasificado como owner. No modifica empresas que ya tienen un owner activo.
with ranked_admins as (
  select
    membership.id,
    membership.tenant_id,
    row_number() over (
      partition by membership.tenant_id
      order by
        case membership.role when 'owner' then 0 when 'admin' then 1 else 2 end,
        membership.joined_at asc nulls last,
        membership.id
    ) as position
  from public.wama_tenant_memberships membership
  where membership.status = 'active'
    and membership.role in ('owner', 'admin')
), tenants_without_owner as (
  select tenant.id
  from public.wama_tenants tenant
  where not exists (
    select 1
    from public.wama_tenant_memberships membership
    where membership.tenant_id = tenant.id
      and membership.role = 'owner'
      and membership.status = 'active'
  )
)
update public.wama_tenant_memberships membership
set role = 'owner'
from ranked_admins candidate
join tenants_without_owner tenant on tenant.id = candidate.tenant_id
where membership.id = candidate.id
  and candidate.position = 1;

-- Reparacion retroactiva: todo owner activo ocupa un cupo en cada modulo
-- activo, incluido Operations Hub. El upsert evita duplicados.
insert into public.wama_module_user_assignments (
  tenant_module_license_id,
  profile_id,
  assigned_by,
  status,
  module_role
)
select
  license.id,
  owner.profile_id,
  owner.profile_id,
  'active',
  'owner'
from public.wama_tenant_module_licenses license
join public.wama_tenant_memberships owner
  on owner.tenant_id = license.tenant_id
where owner.role = 'owner'
  and owner.status = 'active'
  and license.status in ('trial', 'active', 'pending')
on conflict (tenant_module_license_id, profile_id)
do update set
  status = 'active',
  module_role = 'owner';

-- Prevencion futura: al activar cualquier modulo se asigna inmediatamente
-- el owner de la empresa. Esto mantiene sincronizados portal y licencias.
create or replace function public.wama_assign_owner_to_new_module_license()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('trial', 'active', 'pending') then
    insert into public.wama_module_user_assignments (
      tenant_module_license_id,
      profile_id,
      assigned_by,
      status,
      module_role
    )
    select
      new.id,
      membership.profile_id,
      membership.profile_id,
      'active',
      'owner'
    from public.wama_tenant_memberships membership
    where membership.tenant_id = new.tenant_id
      and membership.role = 'owner'
      and membership.status = 'active'
    on conflict (tenant_module_license_id, profile_id)
    do update set
      status = 'active',
      module_role = 'owner';
  end if;

  return new;
end;
$$;

drop trigger if exists wama_assign_owner_after_license_change
  on public.wama_tenant_module_licenses;
create trigger wama_assign_owner_after_license_change
after insert or update of status
on public.wama_tenant_module_licenses
for each row
execute function public.wama_assign_owner_to_new_module_license();

-- Cubre el orden inverso: si primero existe la licencia y despues se crea o
-- corrige el owner, tambien se genera su asignacion automaticamente.
create or replace function public.wama_assign_new_owner_to_active_modules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'owner' and new.status = 'active' then
    insert into public.wama_module_user_assignments (
      tenant_module_license_id,
      profile_id,
      assigned_by,
      status,
      module_role
    )
    select
      license.id,
      new.profile_id,
      new.profile_id,
      'active',
      'owner'
    from public.wama_tenant_module_licenses license
    where license.tenant_id = new.tenant_id
      and license.status in ('trial', 'active', 'pending')
    on conflict (tenant_module_license_id, profile_id)
    do update set
      status = 'active',
      module_role = 'owner';
  end if;

  return new;
end;
$$;

drop trigger if exists wama_assign_owner_after_membership_change
  on public.wama_tenant_memberships;
create trigger wama_assign_owner_after_membership_change
after insert or update of role, status
on public.wama_tenant_memberships
for each row
execute function public.wama_assign_new_owner_to_active_modules();

commit;
