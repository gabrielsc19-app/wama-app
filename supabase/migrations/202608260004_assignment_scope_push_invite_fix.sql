-- WAMA V8 - Asignación por proyecto/equipo + push.
begin;

alter table public.wama_operations_cases
  add column if not exists assignment_scope text not null default 'unassigned';

alter table public.wama_operations_cases
  drop constraint if exists wama_operations_cases_assignment_scope_check;

alter table public.wama_operations_cases
  add constraint wama_operations_cases_assignment_scope_check
  check (assignment_scope in ('unassigned','project','team','person'));

-- Casos históricos: si ya tienen responsable es persona; si tienen equipo,
-- el equipo pasa a ser el destino principal.
update public.wama_operations_cases
set assignment_scope = case
  when assigned_to is not null then 'person'
  when team_id is not null then 'team'
  else 'unassigned'
end
where assignment_scope = 'unassigned';

update public.wama_operations_cases
set status = 'assigned'
where status = 'unassigned'
  and team_id is not null
  and assigned_to is null;

create table if not exists public.wama_operations_push_subscriptions(
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  profile_id uuid not null references public.wama_profiles(id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(profile_id,endpoint)
);

alter table public.wama_operations_push_subscriptions enable row level security;

drop policy if exists ops_push_access on public.wama_operations_push_subscriptions;
create policy ops_push_access
on public.wama_operations_push_subscriptions
for all
using(public.wama_is_tenant_member(tenant_id))
with check(public.wama_is_tenant_member(tenant_id));

create index if not exists idx_ops_push_profile
on public.wama_operations_push_subscriptions(profile_id)
where revoked_at is null;

create index if not exists idx_ops_cases_assignment_scope
on public.wama_operations_cases(tenant_id,project_id,assignment_scope,status);

commit;
