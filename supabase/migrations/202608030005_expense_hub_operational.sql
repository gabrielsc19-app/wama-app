begin;

alter table public.wama_expense_reports
  add column if not exists request_type text not null default 'expense_reimbursement',
  add column if not exists assigned_to uuid references public.wama_profiles(id) on delete set null,
  add column if not exists requested_amount_clp numeric(14,2),
  add column if not exists approved_amount_clp numeric(14,2),
  add column if not exists paid_amount_clp numeric(14,2) not null default 0,
  add column if not exists parent_fund_id uuid references public.wama_expense_reports(id) on delete set null,
  add column if not exists due_date date;

alter table public.wama_expense_reports drop constraint if exists wama_expense_reports_status_check;
alter table public.wama_expense_reports add constraint wama_expense_reports_status_check check
  (status in ('draft','submitted','assigned','in_review','observed','approved','rejected','pending_payment','partially_paid','paid','open','partially_rendered','settled','closed'));
alter table public.wama_expense_reports drop constraint if exists wama_expense_reports_request_type_check;
alter table public.wama_expense_reports add constraint wama_expense_reports_request_type_check check
  (request_type in ('expense_reimbursement','fund_request','fund_rendition'));

update public.wama_expense_reports set requested_amount_clp=amount_clp where requested_amount_clp is null;

create table if not exists public.wama_expense_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  report_id uuid not null references public.wama_expense_reports(id) on delete cascade,
  amount_clp numeric(14,2) not null check(amount_clp > 0),
  payment_type text not null default 'payment' check(payment_type in ('advance','installment','reimbursement','balance_return')),
  paid_at timestamptz not null default now(),
  reference text,
  note text,
  created_by uuid not null references public.wama_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.wama_expense_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  report_id uuid not null references public.wama_expense_reports(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.wama_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_wama_expense_assignee on public.wama_expense_reports(tenant_id,assigned_to,status);
create index if not exists idx_wama_expense_parent_fund on public.wama_expense_reports(parent_fund_id,status);
create index if not exists idx_wama_expense_payments_report on public.wama_expense_payments(report_id,paid_at desc);
create index if not exists idx_wama_expense_events_report on public.wama_expense_events(report_id,created_at desc);

alter table public.wama_expense_payments enable row level security;
alter table public.wama_expense_events enable row level security;
drop policy if exists wama_expense_payments_member on public.wama_expense_payments;
create policy wama_expense_payments_member on public.wama_expense_payments for select to authenticated using(public.wama_is_tenant_member(tenant_id));
drop policy if exists wama_expense_events_member on public.wama_expense_events;
create policy wama_expense_events_member on public.wama_expense_events for select to authenticated using(public.wama_is_tenant_member(tenant_id));
grant select on public.wama_expense_payments, public.wama_expense_events to authenticated;

commit;
