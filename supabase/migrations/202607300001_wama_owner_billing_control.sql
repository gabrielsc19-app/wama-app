-- WAMA SaaS owner control: billing, suspension and platform-level audit.
-- Apply after the multitenant/licensing migration.

alter table public.wama_tenants
  add column if not exists billing_status text not null default 'trial',
  add column if not exists billing_period text not null default 'monthly',
  add column if not exists paid_until timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wama_tenants_billing_status_check'
  ) then
    alter table public.wama_tenants
      add constraint wama_tenants_billing_status_check
      check (billing_status in ('trial','pending','paid','past_due','suspended','cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'wama_tenants_billing_period_check'
  ) then
    alter table public.wama_tenants
      add constraint wama_tenants_billing_period_check
      check (billing_period in ('monthly','annual','manual'));
  end if;
end $$;

create table if not exists public.wama_platform_admin_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.wama_tenants(id) on delete set null,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wama_platform_admin_logs_tenant_date
  on public.wama_platform_admin_logs(tenant_id, created_at desc);

create or replace function public.wama_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wama_tenants_updated_at on public.wama_tenants;
create trigger trg_wama_tenants_updated_at
before update on public.wama_tenants
for each row execute function public.wama_touch_updated_at();

-- Customers must only operate when the company and module are enabled.
create or replace function public.wama_has_active_module(
  target_tenant_id uuid,
  target_module_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.wama_tenants t
    join public.wama_tenant_module_licenses l on l.tenant_id = t.id
    join public.wama_module_catalog m on m.id = l.module_id
    where t.id = target_tenant_id
      and t.status in ('trial','active')
      and t.billing_status in ('trial','paid')
      and (t.paid_until is null or t.paid_until >= now())
      and m.module_key = target_module_key
      and l.status in ('trial','active')
  );
$$;

comment on function public.wama_has_active_module(uuid, text) is
'Central authorization check: tenant, payment and module license must all be enabled.';
