begin;

-- Repara empresas antiguas cuyo primer administrador no quedó clasificado como owner.
with candidates as (
  select membership.id,
         membership.tenant_id,
         row_number() over (
           partition by membership.tenant_id
           order by case membership.role when 'owner' then 0 when 'admin' then 1 else 2 end,
                    membership.joined_at asc nulls last
         ) as position
  from public.wama_tenant_memberships membership
  where membership.status = 'active'
    and membership.role in ('owner','admin')
), without_owner as (
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
from candidates candidate
join without_owner tenant on tenant.id = candidate.tenant_id
where membership.id = candidate.id
  and candidate.position = 1;

-- El propietario ocupa el primer cupo de cada módulo activo o en prueba.
insert into public.wama_module_user_assignments
  (tenant_module_license_id, profile_id, assigned_by, status)
select license.id, owner.profile_id, owner.profile_id, 'active'
from public.wama_tenant_module_licenses license
join public.wama_tenant_memberships owner on owner.tenant_id = license.tenant_id
where owner.role = 'owner'
  and owner.status = 'active'
  and license.status in ('trial','active','pending')
on conflict (tenant_module_license_id, profile_id)
do update set status = 'active';

grant select, insert, update on public.wama_tenant_memberships to authenticated;
grant select, insert, update on public.wama_module_user_assignments to authenticated;

commit;
