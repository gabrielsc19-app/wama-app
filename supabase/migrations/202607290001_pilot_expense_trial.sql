-- WAMA Pilot v1: prueba 15 días, invitaciones, proyectos y rendiciones reales.
begin;

alter table public.wama_tenants
  add column if not exists pilot_name text,
  add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.wama_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('owner','admin','manager','member','viewer')),
  invited_by uuid references public.wama_profiles(id) on delete set null,
  auth_user_id uuid,
  status text not null default 'pending' check (status in ('pending','accepted','expired','cancelled')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create table if not exists public.wama_project_modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.wama_projects(id) on delete cascade,
  tenant_module_license_id uuid not null references public.wama_tenant_module_licenses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, tenant_module_license_id)
);

create table if not exists public.wama_expense_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  project_id uuid references public.wama_projects(id) on delete set null,
  submitted_by uuid not null references public.wama_profiles(id) on delete restrict,
  report_number text not null,
  merchant text not null,
  expense_date date not null,
  category text not null,
  amount_clp numeric(14,2) not null check (amount_clp > 0),
  description text,
  cost_center text,
  document_url text,
  status text not null default 'draft' check (status in ('draft','submitted','in_review','observed','approved','rejected','paid')),
  reviewed_by uuid references public.wama_profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, report_number)
);

create index if not exists idx_wama_invitation_tenant on public.wama_invitations(tenant_id,status);
create index if not exists idx_wama_expense_tenant_date on public.wama_expense_reports(tenant_id,created_at desc);
create index if not exists idx_wama_expense_project on public.wama_expense_reports(project_id,status);

alter table public.wama_invitations enable row level security;
alter table public.wama_project_modules enable row level security;
alter table public.wama_expense_reports enable row level security;

drop policy if exists wama_invitations_admin on public.wama_invitations;
create policy wama_invitations_admin on public.wama_invitations for select to authenticated
using (public.wama_is_tenant_admin(tenant_id));

drop policy if exists wama_project_modules_member on public.wama_project_modules;
create policy wama_project_modules_member on public.wama_project_modules for select to authenticated
using (exists(select 1 from public.wama_projects p where p.id=project_id and public.wama_is_tenant_member(p.tenant_id)));

drop policy if exists wama_expense_read on public.wama_expense_reports;
create policy wama_expense_read on public.wama_expense_reports for select to authenticated
using (public.wama_is_tenant_member(tenant_id));

drop policy if exists wama_expense_insert on public.wama_expense_reports;
create policy wama_expense_insert on public.wama_expense_reports for insert to authenticated
with check (public.wama_is_tenant_member(tenant_id) and submitted_by=public.wama_current_profile_id());

drop policy if exists wama_expense_update on public.wama_expense_reports;
create policy wama_expense_update on public.wama_expense_reports for update to authenticated
using (public.wama_is_tenant_member(tenant_id))
with check (public.wama_is_tenant_member(tenant_id));

-- Los administradores deben poder ver perfiles de miembros de su empresa.
drop policy if exists wama_profile_read_tenant_member on public.wama_profiles;
create policy wama_profile_read_tenant_member on public.wama_profiles for select to authenticated
using (
  auth_user_id = auth.uid() or exists (
    select 1 from public.wama_tenant_memberships mine
    join public.wama_profiles me on me.id=mine.profile_id
    join public.wama_tenant_memberships other_membership on other_membership.tenant_id=mine.tenant_id
    where me.auth_user_id=auth.uid() and mine.status='active' and other_membership.profile_id=wama_profiles.id
  )
);

create or replace function public.wama_next_expense_number(target_tenant_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare n bigint;
begin
  select count(*)+1 into n from public.wama_expense_reports where tenant_id=target_tenant_id;
  return 'RG-' || lpad(n::text,6,'0');
end; $$;

grant execute on function public.wama_next_expense_number(uuid) to authenticated;
commit;
