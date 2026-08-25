-- WAMA piloto Pumay: proyectos nativos de Operations Hub
begin;

alter table public.wama_operations_cases
  add column if not exists project_id uuid references public.wama_projects(id) on delete set null;

create index if not exists idx_ops_cases_project on public.wama_operations_cases(project_id,status,created_at desc);

-- Roles de proyecto explícitos sin cambiar la estructura multitenant.
-- wama_project_members.role sigue siendo text: admin/member.

commit;
