-- Catálogo completo de perfiles de Expense Hub y Sales Hub.
alter table public.wama_module_user_assignments
  drop constraint if exists wama_module_user_assignments_module_role_check;

-- Homologa los perfiles anteriores sin eliminar ninguna asignación.
update public.wama_module_user_assignments assignment
set module_role = case
  when catalog.module_key='expense' and assignment.module_role='member' then 'expense_submitter'
  when catalog.module_key='expense' and assignment.module_role='approver' then 'expense_approver'
  when catalog.module_key='expense' and assignment.module_role='finance' then 'expense_treasurer'
  when catalog.module_key='expense' and assignment.module_role='viewer' then 'expense_auditor'
  when catalog.module_key='sales' and assignment.module_role='viewer' then 'sales_auditor'
  else assignment.module_role
end
from public.wama_tenant_module_licenses license
join public.wama_module_catalog catalog on catalog.id=license.module_id
where assignment.tenant_module_license_id=license.id
  and assignment.module_role in ('member','approver','finance','viewer');

alter table public.wama_module_user_assignments
  add constraint wama_module_user_assignments_module_role_check
  check (module_role in (
    'expense_submitter','expense_reviewer','expense_approver','expense_treasurer',
    'expense_manager','expense_admin','expense_auditor',
    'sales_executive','sales_supervisor','sales_manager','sales_financial_evaluator',
    'sales_admin','sales_auditor','module_admin'
  ));

comment on column public.wama_module_user_assignments.module_role is
  'Perfil funcional independiente dentro de cada módulo WAMA.';
