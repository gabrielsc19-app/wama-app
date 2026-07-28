-- WAMA Core - Multiempresa + licenciamiento por módulo
-- Modelo comercial inicial:
--   * USD 10 mensuales por módulo.
--   * Cada módulo incluye 10 cupos.
--   * Un mismo usuario asignado a 3 módulos consume 1 cupo en cada módulo.
--   * Los proyectos son opcionales y siempre pertenecen a una empresa.

begin;

create extension if not exists pgcrypto;

create table if not exists public.wama_tenants (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  slug text not null unique,
  logo_url text,
  country_code text not null default 'CL',
  timezone text not null default 'America/Santiago',
  status text not null default 'trial' check (status in ('trial','active','suspended','cancelled')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.wama_tenant_code_seq start 1;

create or replace function public.wama_set_tenant_code()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.code is null or btrim(new.code) = '' then
    new.code := 'WM-' || lpad(nextval('public.wama_tenant_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_wama_set_tenant_code on public.wama_tenants;
create trigger trg_wama_set_tenant_code
before insert on public.wama_tenants
for each row execute function public.wama_set_tenant_code();

create table if not exists public.wama_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  status text not null default 'active' check (status in ('invited','active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wama_tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  profile_id uuid not null references public.wama_profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','manager','member','viewer')),
  status text not null default 'active' check (status in ('invited','active','disabled')),
  joined_at timestamptz not null default now(),
  unique (tenant_id, profile_id)
);

create table if not exists public.wama_module_catalog (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  name text not null,
  description text,
  monthly_price_usd numeric(12,2) not null default 10,
  included_seats integer not null default 10 check (included_seats > 0),
  extra_block_size integer not null default 10 check (extra_block_size > 0),
  extra_block_price_usd numeric(12,2) not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.wama_module_catalog
  (module_key, name, description, monthly_price_usd, included_seats, extra_block_size, extra_block_price_usd)
values
  ('expense', 'W-Expense', 'Gestión de gastos, documentos y aprobaciones.', 10, 10, 10, 10),
  ('operations', 'W-Operations', 'Gestión operacional, alertas, tareas y evidencias.', 10, 10, 10, 10),
  ('sales', 'W-Sales', 'CRM, pipeline y seguimiento comercial.', 10, 10, 10, 10),
  ('finance', 'W-Finance', 'Gestión financiera y cuentas por pagar.', 10, 10, 10, 10),
  ('resource', 'W-Resource', 'Gestión de recursos empresariales.', 10, 10, 10, 10),
  ('hr', 'W-HR', 'Gestión de personas y procesos de recursos humanos.', 10, 10, 10, 10),
  ('maintenance', 'W-Maintenance', 'Gestión de mantenimiento y proyectos técnicos.', 10, 10, 10, 10),
  ('analytics', 'W-Analytics', 'Reportería y analítica ejecutiva.', 10, 10, 10, 10),
  ('ai', 'W-AI', 'Asistente empresarial con acceso controlado por permisos.', 10, 10, 10, 10)
on conflict (module_key) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_usd = excluded.monthly_price_usd,
  included_seats = excluded.included_seats,
  extra_block_size = excluded.extra_block_size,
  extra_block_price_usd = excluded.extra_block_price_usd,
  is_active = true;

create table if not exists public.wama_tenant_module_licenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  module_id uuid not null references public.wama_module_catalog(id) on delete restrict,
  status text not null default 'active' check (status in ('pending','trial','active','suspended','cancelled')),
  included_seats integer not null default 10 check (included_seats > 0),
  extra_seat_blocks integer not null default 0 check (extra_seat_blocks >= 0),
  unit_price_usd numeric(12,2) not null default 10,
  extra_block_price_usd numeric(12,2) not null default 10,
  extra_block_size integer not null default 10 check (extra_block_size > 0),
  starts_at timestamptz not null default now(),
  renews_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, module_id)
);

create table if not exists public.wama_module_user_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_module_license_id uuid not null references public.wama_tenant_module_licenses(id) on delete cascade,
  profile_id uuid not null references public.wama_profiles(id) on delete cascade,
  assigned_by uuid references public.wama_profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active','disabled')),
  assigned_at timestamptz not null default now(),
  unique (tenant_module_license_id, profile_id)
);

create table if not exists public.wama_projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('draft','active','paused','closed','archived')),
  created_by uuid references public.wama_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.wama_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.wama_projects(id) on delete cascade,
  profile_id uuid not null references public.wama_profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table if not exists public.wama_audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.wama_tenants(id) on delete set null,
  profile_id uuid references public.wama_profiles(id) on delete set null,
  module_key text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wama_memberships_profile on public.wama_tenant_memberships(profile_id, tenant_id);
create index if not exists idx_wama_licenses_tenant on public.wama_tenant_module_licenses(tenant_id, status);
create index if not exists idx_wama_assignments_license on public.wama_module_user_assignments(tenant_module_license_id, status);
create index if not exists idx_wama_projects_tenant on public.wama_projects(tenant_id, status);
create index if not exists idx_wama_audit_tenant_date on public.wama_audit_logs(tenant_id, created_at desc);

create or replace function public.wama_current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.id
  from public.wama_profiles p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.wama_is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.wama_tenant_memberships tm
    join public.wama_profiles p on p.id = tm.profile_id
    where tm.tenant_id = target_tenant_id
      and p.auth_user_id = auth.uid()
      and tm.status = 'active'
  );
$$;

create or replace function public.wama_is_tenant_admin(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.wama_tenant_memberships tm
    join public.wama_profiles p on p.id = tm.profile_id
    where tm.tenant_id = target_tenant_id
      and p.auth_user_id = auth.uid()
      and tm.status = 'active'
      and tm.role in ('owner','admin')
  );
$$;

create or replace function public.wama_license_capacity(target_license_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select included_seats + (extra_seat_blocks * extra_block_size)
  from public.wama_tenant_module_licenses
  where id = target_license_id;
$$;

create or replace function public.wama_provision_tenant(
  company_name text,
  company_slug text,
  administrator_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_tenant_id uuid;
  current_profile_id uuid;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para crear una empresa.';
  end if;

  if company_name is null or length(btrim(company_name)) < 2 then
    raise exception 'Nombre de empresa inválido.';
  end if;

  if company_slug is null or company_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'El identificador de empresa debe usar minúsculas, números y guiones.';
  end if;

  select email into current_email from auth.users where id = auth.uid();

  insert into public.wama_profiles (auth_user_id, full_name, email)
  values (
    auth.uid(),
    coalesce(nullif(btrim(administrator_name), ''), split_part(current_email, '@', 1)),
    current_email
  )
  on conflict (auth_user_id) do update set
    full_name = coalesce(nullif(btrim(excluded.full_name), ''), public.wama_profiles.full_name),
    email = excluded.email,
    updated_at = now()
  returning id into current_profile_id;

  insert into public.wama_tenants (name, slug, status, trial_ends_at)
  values (btrim(company_name), company_slug, 'trial', now() + interval '14 days')
  returning id into new_tenant_id;

  insert into public.wama_tenant_memberships (tenant_id, profile_id, role, status)
  values (new_tenant_id, current_profile_id, 'owner', 'active');

  insert into public.wama_audit_logs (tenant_id, profile_id, module_key, action, entity_type, entity_id, metadata)
  values (new_tenant_id, current_profile_id, 'core', 'tenant.created', 'tenant', new_tenant_id::text, jsonb_build_object('company_name', company_name));

  return new_tenant_id;
end;
$$;

create or replace function public.wama_assign_user_to_module(
  target_license_id uuid,
  target_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  license_tenant_id uuid;
  license_status text;
  capacity integer;
  used_seats integer;
  assignment_id uuid;
  caller_profile_id uuid;
begin
  select tenant_id, status,
         included_seats + (extra_seat_blocks * extra_block_size)
    into license_tenant_id, license_status, capacity
  from public.wama_tenant_module_licenses
  where id = target_license_id
  for update;

  if license_tenant_id is null then
    raise exception 'Licencia no encontrada.';
  end if;

  if not public.wama_is_tenant_admin(license_tenant_id) then
    raise exception 'No tienes permisos para asignar usuarios.';
  end if;

  if license_status not in ('trial','active') then
    raise exception 'La licencia del módulo no está activa.';
  end if;

  if not exists (
    select 1 from public.wama_tenant_memberships
    where tenant_id = license_tenant_id
      and profile_id = target_profile_id
      and status in ('active','invited')
  ) then
    raise exception 'El usuario no pertenece a esta empresa.';
  end if;

  select count(*) into used_seats
  from public.wama_module_user_assignments
  where tenant_module_license_id = target_license_id
    and status = 'active';

  if used_seats >= capacity then
    raise exception 'No quedan cupos disponibles para este módulo.';
  end if;

  caller_profile_id := public.wama_current_profile_id();

  insert into public.wama_module_user_assignments
    (tenant_module_license_id, profile_id, assigned_by, status)
  values
    (target_license_id, target_profile_id, caller_profile_id, 'active')
  on conflict (tenant_module_license_id, profile_id)
  do update set status = 'active', assigned_by = excluded.assigned_by, assigned_at = now()
  returning id into assignment_id;

  insert into public.wama_audit_logs
    (tenant_id, profile_id, module_key, action, entity_type, entity_id, metadata)
  select
    license_tenant_id,
    caller_profile_id,
    mc.module_key,
    'license.user_assigned',
    'module_assignment',
    assignment_id::text,
    jsonb_build_object('assigned_profile_id', target_profile_id)
  from public.wama_tenant_module_licenses l
  join public.wama_module_catalog mc on mc.id = l.module_id
  where l.id = target_license_id;

  return assignment_id;
end;
$$;

create or replace function public.wama_remove_user_from_module(
  target_license_id uuid,
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  license_tenant_id uuid;
begin
  select tenant_id into license_tenant_id
  from public.wama_tenant_module_licenses
  where id = target_license_id;

  if license_tenant_id is null then
    raise exception 'Licencia no encontrada.';
  end if;

  if not public.wama_is_tenant_admin(license_tenant_id) then
    raise exception 'No tienes permisos para quitar usuarios.';
  end if;

  update public.wama_module_user_assignments
  set status = 'disabled'
  where tenant_module_license_id = target_license_id
    and profile_id = target_profile_id;
end;
$$;

create or replace function public.wama_my_licensing_summary()
returns table (
  tenant_id uuid,
  tenant_name text,
  tenant_code text,
  module_key text,
  module_name text,
  license_id uuid,
  license_status text,
  included_seats integer,
  extra_seat_blocks integer,
  seat_capacity integer,
  used_seats bigint,
  available_seats bigint,
  monthly_total_usd numeric
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    t.id,
    t.name,
    t.code,
    mc.module_key,
    mc.name,
    l.id,
    l.status,
    l.included_seats,
    l.extra_seat_blocks,
    l.included_seats + (l.extra_seat_blocks * l.extra_block_size) as seat_capacity,
    count(a.id) filter (where a.status = 'active') as used_seats,
    (l.included_seats + (l.extra_seat_blocks * l.extra_block_size))
      - count(a.id) filter (where a.status = 'active') as available_seats,
    l.unit_price_usd + (l.extra_seat_blocks * l.extra_block_price_usd) as monthly_total_usd
  from public.wama_tenant_module_licenses l
  join public.wama_tenants t on t.id = l.tenant_id
  join public.wama_module_catalog mc on mc.id = l.module_id
  join public.wama_tenant_memberships tm on tm.tenant_id = t.id
  join public.wama_profiles p on p.id = tm.profile_id
  left join public.wama_module_user_assignments a on a.tenant_module_license_id = l.id
  where p.auth_user_id = auth.uid()
    and tm.status = 'active'
  group by t.id, t.name, t.code, mc.module_key, mc.name, l.id, l.status,
           l.included_seats, l.extra_seat_blocks, l.extra_block_size,
           l.unit_price_usd, l.extra_block_price_usd
  order by t.name, mc.name;
$$;

alter table public.wama_tenants enable row level security;
alter table public.wama_profiles enable row level security;
alter table public.wama_tenant_memberships enable row level security;
alter table public.wama_module_catalog enable row level security;
alter table public.wama_tenant_module_licenses enable row level security;
alter table public.wama_module_user_assignments enable row level security;
alter table public.wama_projects enable row level security;
alter table public.wama_project_members enable row level security;
alter table public.wama_audit_logs enable row level security;

-- Catálogo público para usuarios autenticados.
drop policy if exists wama_module_catalog_read on public.wama_module_catalog;
create policy wama_module_catalog_read
on public.wama_module_catalog for select
to authenticated
using (is_active = true);

-- Perfil: cada usuario ve y actualiza solo su perfil.
drop policy if exists wama_profile_read_self on public.wama_profiles;
create policy wama_profile_read_self
on public.wama_profiles for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists wama_profile_update_self on public.wama_profiles;
create policy wama_profile_update_self
on public.wama_profiles for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

-- Tenant: solo miembros activos.
drop policy if exists wama_tenant_read_member on public.wama_tenants;
create policy wama_tenant_read_member
on public.wama_tenants for select
to authenticated
using (public.wama_is_tenant_member(id));

-- Membresías: miembros ven la empresa; owner/admin administran.
drop policy if exists wama_membership_read_member on public.wama_tenant_memberships;
create policy wama_membership_read_member
on public.wama_tenant_memberships for select
to authenticated
using (public.wama_is_tenant_member(tenant_id));

drop policy if exists wama_membership_admin_write on public.wama_tenant_memberships;
create policy wama_membership_admin_write
on public.wama_tenant_memberships for all
to authenticated
using (public.wama_is_tenant_admin(tenant_id))
with check (public.wama_is_tenant_admin(tenant_id));

-- Licencias: lectura para miembros, cambios solo owner/admin.
drop policy if exists wama_license_read_member on public.wama_tenant_module_licenses;
create policy wama_license_read_member
on public.wama_tenant_module_licenses for select
to authenticated
using (public.wama_is_tenant_member(tenant_id));

drop policy if exists wama_license_admin_write on public.wama_tenant_module_licenses;
create policy wama_license_admin_write
on public.wama_tenant_module_licenses for all
to authenticated
using (public.wama_is_tenant_admin(tenant_id))
with check (public.wama_is_tenant_admin(tenant_id));

-- Asignaciones: se resuelve el tenant desde la licencia.
drop policy if exists wama_assignment_read_member on public.wama_module_user_assignments;
create policy wama_assignment_read_member
on public.wama_module_user_assignments for select
to authenticated
using (
  exists (
    select 1 from public.wama_tenant_module_licenses l
    where l.id = tenant_module_license_id
      and public.wama_is_tenant_member(l.tenant_id)
  )
);

drop policy if exists wama_assignment_admin_write on public.wama_module_user_assignments;
create policy wama_assignment_admin_write
on public.wama_module_user_assignments for all
to authenticated
using (
  exists (
    select 1 from public.wama_tenant_module_licenses l
    where l.id = tenant_module_license_id
      and public.wama_is_tenant_admin(l.tenant_id)
  )
)
with check (
  exists (
    select 1 from public.wama_tenant_module_licenses l
    where l.id = tenant_module_license_id
      and public.wama_is_tenant_admin(l.tenant_id)
  )
);

-- Proyectos opcionales y aislados por tenant.
drop policy if exists wama_projects_read_member on public.wama_projects;
create policy wama_projects_read_member
on public.wama_projects for select
to authenticated
using (public.wama_is_tenant_member(tenant_id));

drop policy if exists wama_projects_admin_write on public.wama_projects;
create policy wama_projects_admin_write
on public.wama_projects for all
to authenticated
using (public.wama_is_tenant_admin(tenant_id))
with check (public.wama_is_tenant_admin(tenant_id));

drop policy if exists wama_project_members_read on public.wama_project_members;
create policy wama_project_members_read
on public.wama_project_members for select
to authenticated
using (
  exists (
    select 1 from public.wama_projects p
    where p.id = project_id
      and public.wama_is_tenant_member(p.tenant_id)
  )
);

drop policy if exists wama_project_members_admin_write on public.wama_project_members;
create policy wama_project_members_admin_write
on public.wama_project_members for all
to authenticated
using (
  exists (
    select 1 from public.wama_projects p
    where p.id = project_id
      and public.wama_is_tenant_admin(p.tenant_id)
  )
)
with check (
  exists (
    select 1 from public.wama_projects p
    where p.id = project_id
      and public.wama_is_tenant_admin(p.tenant_id)
  )
);

-- Auditoría: lectura para miembros. No se permite edición/eliminación desde el cliente.
drop policy if exists wama_audit_read_member on public.wama_audit_logs;
create policy wama_audit_read_member
on public.wama_audit_logs for select
to authenticated
using (tenant_id is not null and public.wama_is_tenant_member(tenant_id));

revoke insert, update, delete on public.wama_audit_logs from authenticated;

grant execute on function public.wama_provision_tenant(text, text, text) to authenticated;
grant execute on function public.wama_assign_user_to_module(uuid, uuid) to authenticated;
grant execute on function public.wama_remove_user_from_module(uuid, uuid) to authenticated;
grant execute on function public.wama_my_licensing_summary() to authenticated;

commit;
