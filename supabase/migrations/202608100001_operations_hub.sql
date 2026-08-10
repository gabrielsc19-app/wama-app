-- WAMA Operations Hub: casos, equipos, ubicaciones, evidencias y trazabilidad.
begin;

insert into public.wama_module_catalog(module_key,name,description,monthly_price_usd,included_seats,extra_block_size,extra_block_price_usd,is_active)
values ('operations','Operations Hub','Incidentes, alertas, responsables, evidencias y trazabilidad operacional.',10,10,10,10,true)
on conflict (module_key) do update set name=excluded.name,description=excluded.description,monthly_price_usd=10,included_seats=10,extra_block_size=10,extra_block_price_usd=10,is_active=true;

create table if not exists public.wama_operations_locations(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  name text not null, address text, status text not null default 'active' check(status in ('active','inactive')),
  created_by uuid references public.wama_profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(tenant_id,name)
);
create table if not exists public.wama_operations_teams(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  name text not null, color text not null default '#00B8AE', receives_urgent boolean not null default false,
  status text not null default 'active' check(status in ('active','inactive')), created_by uuid references public.wama_profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,name)
);
create table if not exists public.wama_operations_team_members(
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.wama_operations_teams(id) on delete cascade,
  profile_id uuid not null references public.wama_profiles(id) on delete cascade, team_role text not null default 'operator' check(team_role in ('coordinator','operator')),
  created_at timestamptz not null default now(), unique(team_id,profile_id)
);
create table if not exists public.wama_operations_categories(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  name text not null, default_team_id uuid references public.wama_operations_teams(id) on delete set null, sla_minutes integer not null default 1440 check(sla_minutes>0),
  is_urgent_allowed boolean not null default true, status text not null default 'active' check(status in ('active','inactive')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,name)
);
create sequence if not exists public.wama_operations_case_seq start 1;
create table if not exists public.wama_operations_cases(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  case_number text not null, title text not null, description text not null, location_id uuid references public.wama_operations_locations(id) on delete set null,
  category_id uuid references public.wama_operations_categories(id) on delete set null, team_id uuid references public.wama_operations_teams(id) on delete set null,
  reported_by uuid not null references public.wama_profiles(id) on delete restrict, assigned_to uuid references public.wama_profiles(id) on delete set null,
  priority text not null default 'medium' check(priority in ('low','medium','high','critical')), is_urgent boolean not null default false,
  status text not null default 'unassigned' check(status in ('unassigned','assigned','taken','in_progress','resolved','closed','reopened','cancelled')),
  due_at timestamptz, taken_at timestamptz, resolved_at timestamptz, closed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,case_number)
);
create table if not exists public.wama_operations_events(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  case_id uuid not null references public.wama_operations_cases(id) on delete cascade, event_type text not null,
  from_status text, to_status text, comment text, metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.wama_profiles(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.wama_operations_evidence(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  case_id uuid not null references public.wama_operations_cases(id) on delete cascade, event_id uuid references public.wama_operations_events(id) on delete set null,
  uploaded_by uuid references public.wama_profiles(id) on delete set null, storage_path text not null, file_name text not null, mime_type text not null, file_size bigint not null,
  created_at timestamptz not null default now()
);
create table if not exists public.wama_operations_notifications(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  case_id uuid references public.wama_operations_cases(id) on delete cascade, recipient_profile_id uuid references public.wama_profiles(id) on delete cascade,
  notification_type text not null, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);

create index if not exists idx_ops_cases_tenant_status on public.wama_operations_cases(tenant_id,status,created_at desc);
create index if not exists idx_ops_cases_team on public.wama_operations_cases(team_id,status);
create index if not exists idx_ops_events_case on public.wama_operations_events(case_id,created_at);
create index if not exists idx_ops_evidence_case on public.wama_operations_evidence(case_id,created_at);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('operations-evidence','operations-evidence',false,12582912,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=12582912,allowed_mime_types=excluded.allowed_mime_types;

alter table public.wama_operations_locations enable row level security;
alter table public.wama_operations_teams enable row level security;
alter table public.wama_operations_team_members enable row level security;
alter table public.wama_operations_categories enable row level security;
alter table public.wama_operations_cases enable row level security;
alter table public.wama_operations_events enable row level security;
alter table public.wama_operations_evidence enable row level security;
alter table public.wama_operations_notifications enable row level security;

do $$ declare t text; begin
  foreach t in array array['wama_operations_locations','wama_operations_teams','wama_operations_categories','wama_operations_cases','wama_operations_events','wama_operations_evidence','wama_operations_notifications'] loop
    execute format('drop policy if exists ops_tenant_access on public.%I',t);
    execute format('create policy ops_tenant_access on public.%I for all using (public.wama_is_tenant_member(tenant_id)) with check (public.wama_is_tenant_member(tenant_id))',t);
  end loop;
end $$;
drop policy if exists ops_team_member_access on public.wama_operations_team_members;
create policy ops_team_member_access on public.wama_operations_team_members for all using(exists(select 1 from public.wama_operations_teams t where t.id=team_id and public.wama_is_tenant_member(t.tenant_id))) with check(exists(select 1 from public.wama_operations_teams t where t.id=team_id and public.wama_is_tenant_member(t.tenant_id)));

-- Configuración inicial para empresas que activen el módulo.
create or replace function public.wama_seed_operations(target_tenant_id uuid, creator_profile_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare team_ops uuid; team_maintenance uuid; team_security uuid; team_cleaning uuid;
begin
  insert into public.wama_operations_locations(tenant_id,name,created_by) values(target_tenant_id,'Casa matriz',creator_profile_id) on conflict(tenant_id,name) do nothing;
  insert into public.wama_operations_teams(tenant_id,name,color,receives_urgent,created_by) values(target_tenant_id,'Operaciones','#00B8AE',true,creator_profile_id) on conflict(tenant_id,name) do update set receives_urgent=true returning id into team_ops;
  insert into public.wama_operations_teams(tenant_id,name,color,receives_urgent,created_by) values(target_tenant_id,'Mantención','#3B82F6',true,creator_profile_id) on conflict(tenant_id,name) do update set receives_urgent=true returning id into team_maintenance;
  insert into public.wama_operations_teams(tenant_id,name,color,receives_urgent,created_by) values(target_tenant_id,'Seguridad','#F97316',true,creator_profile_id) on conflict(tenant_id,name) do update set receives_urgent=true returning id into team_security;
  insert into public.wama_operations_teams(tenant_id,name,color,receives_urgent,created_by) values(target_tenant_id,'Aseo','#8B5CF6',false,creator_profile_id) on conflict(tenant_id,name) do update set receives_urgent=false returning id into team_cleaning;
  insert into public.wama_operations_categories(tenant_id,name,default_team_id,sla_minutes) values
    (target_tenant_id,'Operaciones',team_ops,480),(target_tenant_id,'Mantención',team_maintenance,1440),(target_tenant_id,'Seguridad',team_security,240),(target_tenant_id,'Aseo',team_cleaning,480),(target_tenant_id,'Administración',team_ops,1440),(target_tenant_id,'Comercial',team_ops,1440),(target_tenant_id,'Tecnología',team_ops,480),(target_tenant_id,'Otro',team_ops,1440)
  on conflict(tenant_id,name) do nothing;
end; $$;

-- Inicializa las licencias Operations ya existentes, incluida la empresa de prueba actual.
do $$ declare r record; p uuid; begin
  for r in select l.tenant_id from public.wama_tenant_module_licenses l join public.wama_module_catalog m on m.id=l.module_id where m.module_key='operations' loop
    select profile_id into p from public.wama_tenant_memberships where tenant_id=r.tenant_id and status='active' order by case when role='owner' then 0 else 1 end limit 1;
    if p is not null then perform public.wama_seed_operations(r.tenant_id,p); end if;
  end loop;
end $$;

commit;
