begin;

create table if not exists public.wama_sales_settings (
  tenant_id uuid primary key references public.wama_tenants(id) on delete cascade,
  currency text not null default 'UF' check (currency in ('UF','USD','CLP')),
  products text[] not null default '{}',
  configured_at timestamptz,
  configured_by uuid references public.wama_profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.wama_sales_deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  company text not null,
  contact text not null default '', email text not null default '', phone text not null default '', website text not null default '',
  product text not null default '', need text not null default '', sale_type text not null default 'Recurrente',
  amount numeric(18,2) not null default 0, currency text not null default 'UF',
  stage text not null default 'Target account', probability integer not null default 10,
  owner text not null default 'Sin asignar', source text not null default 'Contacto directo', comment text not null default '',
  created_by uuid references public.wama_profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists idx_wama_sales_deals_tenant_stage on public.wama_sales_deals(tenant_id,stage);

create table if not exists public.wama_sales_deal_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  deal_id uuid not null references public.wama_sales_deals(id) on delete cascade,
  uploaded_by uuid references public.wama_profiles(id), storage_path text not null unique,
  file_name text not null, mime_type text, file_size bigint not null default 0, created_at timestamptz not null default now()
);

insert into storage.buckets(id,name,public,file_size_limit) values('sales-deal-files','sales-deal-files',false,15728640)
on conflict(id) do update set public=false,file_size_limit=15728640;

alter table public.wama_sales_settings enable row level security;
alter table public.wama_sales_deals enable row level security;
alter table public.wama_sales_deal_files enable row level security;
grant select,insert,update,delete on public.wama_sales_settings,public.wama_sales_deals,public.wama_sales_deal_files to authenticated;

drop policy if exists sales_settings_tenant on public.wama_sales_settings;
create policy sales_settings_tenant on public.wama_sales_settings for all to authenticated using(public.wama_is_tenant_member(tenant_id)) with check(public.wama_is_tenant_member(tenant_id));
drop policy if exists sales_deals_tenant on public.wama_sales_deals;
create policy sales_deals_tenant on public.wama_sales_deals for all to authenticated using(public.wama_is_tenant_member(tenant_id)) with check(public.wama_is_tenant_member(tenant_id));
drop policy if exists sales_files_tenant on public.wama_sales_deal_files;
create policy sales_files_tenant on public.wama_sales_deal_files for all to authenticated using(public.wama_is_tenant_member(tenant_id)) with check(public.wama_is_tenant_member(tenant_id));

commit;
