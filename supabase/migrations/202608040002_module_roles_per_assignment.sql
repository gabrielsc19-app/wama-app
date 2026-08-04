-- Roles independientes por módulo para cada usuario.
alter table public.wama_module_user_assignments
  add column if not exists module_role text;

-- Migra las asignaciones actuales usando el rol general anterior como referencia.
update public.wama_module_user_assignments assignment
set module_role = case
  when membership.role = 'owner' then 'module_admin'
  when catalog.module_key = 'expense' and membership.role in ('manager','approver') then 'approver'
  when catalog.module_key = 'expense' and membership.role in ('finance','treasury') then 'finance'
  when catalog.module_key = 'expense' and membership.role = 'viewer' then 'viewer'
  when catalog.module_key = 'sales' and membership.role = 'admin' then 'sales_admin'
  when catalog.module_key = 'sales' and membership.role in ('manager','approver') then 'sales_manager'
  when catalog.module_key = 'sales' and membership.role = 'viewer' then 'viewer'
  when catalog.module_key = 'sales' then 'sales_executive'
  else 'member'
end
from public.wama_tenant_module_licenses license
join public.wama_module_catalog catalog on catalog.id = license.module_id
join public.wama_tenant_memberships membership on membership.tenant_id = license.tenant_id
where assignment.tenant_module_license_id = license.id
  and membership.profile_id = assignment.profile_id
  and assignment.module_role is null;

update public.wama_module_user_assignments
set module_role = 'member'
where module_role is null;

alter table public.wama_module_user_assignments
  alter column module_role set default 'member',
  alter column module_role set not null;

alter table public.wama_module_user_assignments
  drop constraint if exists wama_module_user_assignments_module_role_check;

alter table public.wama_module_user_assignments
  add constraint wama_module_user_assignments_module_role_check
  check (module_role in (
    'member','approver','finance','viewer',
    'sales_executive','sales_manager','sales_admin','module_admin'
  ));

create index if not exists idx_wama_module_assignments_profile_role
  on public.wama_module_user_assignments(profile_id,module_role,status);
