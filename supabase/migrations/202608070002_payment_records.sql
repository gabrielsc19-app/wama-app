create table if not exists public.wama_payment_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  amount_usd numeric(12,2) not null check (amount_usd > 0),
  paid_at date not null,
  period_start date not null,
  period_end date not null,
  payment_method text not null,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index if not exists wama_payment_records_tenant_paid_at_idx
  on public.wama_payment_records (tenant_id, paid_at desc);

alter table public.wama_payment_records enable row level security;

-- Corrige estados antiguos marcados como pagados sin que exista un pago real.
update public.wama_tenants as tenant
set
  status = 'trial',
  billing_status = 'trial',
  paid_until = null,
  suspended_at = null,
  suspension_reason = null
where tenant.billing_status = 'paid'
  and not exists (
    select 1 from public.wama_payment_records as payment
    where payment.tenant_id = tenant.id
  );

update public.wama_tenant_module_licenses as license
set status = 'trial'
where license.status = 'active'
  and exists (
    select 1 from public.wama_tenants as tenant
    where tenant.id = license.tenant_id
      and tenant.billing_status = 'trial'
  );
