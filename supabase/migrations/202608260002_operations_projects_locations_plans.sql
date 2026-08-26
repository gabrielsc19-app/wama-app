-- WAMA Operations: proyectos, locaciones y planos.
-- Genérico para cualquier empresa. Incluye soporte para el piloto Pumay / Piso -1.
begin;

alter table public.wama_operations_locations
  add column if not exists project_id uuid references public.wama_projects(id) on delete cascade,
  add column if not exists code text,
  add column if not exists location_type text not null default 'other',
  add column if not exists sort_order integer not null default 0,
  add column if not exists plan_x numeric(6,3),
  add column if not exists plan_y numeric(6,3);

alter table public.wama_operations_locations
  drop constraint if exists wama_operations_locations_tenant_id_name_key;

create unique index if not exists uq_ops_locations_project_name
  on public.wama_operations_locations(project_id, lower(name))
  where project_id is not null;

create unique index if not exists uq_ops_locations_global_name
  on public.wama_operations_locations(tenant_id, lower(name))
  where project_id is null;

create index if not exists idx_ops_locations_project
  on public.wama_operations_locations(project_id, status, sort_order, name);

create table if not exists public.wama_operations_project_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  project_id uuid not null references public.wama_projects(id) on delete cascade,
  sheet_code text,
  title text not null,
  revision text,
  revision_date date,
  scale text,
  storage_path text not null,
  file_name text not null,
  mime_type text not null default 'application/pdf',
  file_size bigint not null default 0,
  is_active boolean not null default true,
  uploaded_by uuid references public.wama_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ops_project_plans_project
  on public.wama_operations_project_plans(project_id, is_active, created_at desc);

create table if not exists public.wama_operations_project_teams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.wama_projects(id) on delete cascade,
  team_id uuid not null references public.wama_operations_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, team_id)
);

alter table public.wama_operations_project_plans enable row level security;
alter table public.wama_operations_project_teams enable row level security;

drop policy if exists ops_project_plans_access on public.wama_operations_project_plans;
create policy ops_project_plans_access
on public.wama_operations_project_plans
for all
using (public.wama_is_tenant_member(tenant_id))
with check (public.wama_is_tenant_member(tenant_id));

drop policy if exists ops_project_teams_access on public.wama_operations_project_teams;
create policy ops_project_teams_access
on public.wama_operations_project_teams
for all
using (
  exists (
    select 1
    from public.wama_projects p
    where p.id = project_id
      and public.wama_is_tenant_member(p.tenant_id)
  )
)
with check (
  exists (
    select 1
    from public.wama_projects p
    where p.id = project_id
      and public.wama_is_tenant_member(p.tenant_id)
  )
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'operations-plans',
  'operations-plans',
  false,
  26214400,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict(id) do update
set public=false,
    file_size_limit=26214400,
    allowed_mime_types=excluded.allowed_mime_types;

commit;
