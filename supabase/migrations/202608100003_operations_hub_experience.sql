-- Operations Hub: experiencia comercial, configuración real, auditoría y notificaciones.
begin;

-- Las empresas nuevas parten vacías: las sugerencias se eligen en el onboarding.
create or replace function public.wama_seed_operations(target_tenant_id uuid, creator_profile_id uuid)
returns void language plpgsql security definer set search_path=public as $$ begin return; end; $$;

alter table public.wama_operations_cases
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.wama_profiles(id) on delete set null,
  add column if not exists deletion_reason text;

alter table public.wama_operations_teams
  add column if not exists description text,
  add column if not exists response_sla_minutes integer not null default 1440 check(response_sla_minutes > 0);

alter table public.wama_operations_team_members
  add column if not exists notify_new_cases boolean not null default true,
  add column if not exists notify_updates boolean not null default true,
  add column if not exists notify_urgent boolean not null default true,
  add column if not exists notify_email boolean not null default true,
  add column if not exists notify_push boolean not null default true;

create table if not exists public.wama_operations_setup(
  tenant_id uuid primary key references public.wama_tenants(id) on delete cascade,
  completed_at timestamptz,
  completed_by uuid references public.wama_profiles(id) on delete set null,
  evidence_limit integer not null default 5 check(evidence_limit between 1 and 10),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.wama_operations_push_subscriptions(
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  profile_id uuid not null references public.wama_profiles(id) on delete cascade,
  endpoint text not null, subscription jsonb not null, user_agent text,
  last_seen_at timestamptz not null default now(), revoked_at timestamptz, created_at timestamptz not null default now(),
  unique(profile_id,endpoint)
);

alter table public.wama_operations_setup enable row level security;
alter table public.wama_operations_push_subscriptions enable row level security;
drop policy if exists ops_setup_access on public.wama_operations_setup;
create policy ops_setup_access on public.wama_operations_setup for all using(public.wama_is_tenant_member(tenant_id)) with check(public.wama_is_tenant_member(tenant_id));
drop policy if exists ops_push_access on public.wama_operations_push_subscriptions;
create policy ops_push_access on public.wama_operations_push_subscriptions for all using(public.wama_is_tenant_member(tenant_id)) with check(public.wama_is_tenant_member(tenant_id));

create index if not exists idx_ops_cases_active on public.wama_operations_cases(tenant_id,created_at desc) where deleted_at is null;
create index if not exists idx_ops_notifications_recipient on public.wama_operations_notifications(recipient_profile_id,read_at,created_at desc);
create index if not exists idx_ops_push_profile on public.wama_operations_push_subscriptions(profile_id) where revoked_at is null;

alter table public.wama_module_user_assignments drop constraint if exists wama_module_user_assignments_module_role_check;
alter table public.wama_module_user_assignments add constraint wama_module_user_assignments_module_role_check check(module_role in(
  'module_admin','member','viewer',
  'expense_manager','expense_admin','expense_approver','expense_reviewer','expense_treasurer','expense_submitter','expense_auditor',
  'sales_manager','sales_supervisor','sales_executive','sales_financial_evaluator','sales_admin','sales_auditor',
  'operations_admin','operations_coordinator','operations_operator','operations_reporter','operations_observer'
));

commit;
