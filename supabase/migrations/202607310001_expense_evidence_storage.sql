begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('expense-evidence','expense-evidence',false,12582912,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.wama_expense_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.wama_tenants(id) on delete cascade,
  report_id uuid not null references public.wama_expense_reports(id) on delete cascade,
  uploaded_by uuid not null references public.wama_profiles(id) on delete restrict,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check(file_size>0),
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_wama_expense_evidence_report on public.wama_expense_evidence(report_id,created_at desc);
alter table public.wama_expense_evidence enable row level security;
drop policy if exists wama_expense_evidence_read on public.wama_expense_evidence;
create policy wama_expense_evidence_read on public.wama_expense_evidence for select to authenticated using(public.wama_is_tenant_member(tenant_id));
drop policy if exists wama_expense_evidence_insert on public.wama_expense_evidence;
create policy wama_expense_evidence_insert on public.wama_expense_evidence for insert to authenticated with check(public.wama_is_tenant_member(tenant_id) and uploaded_by=public.wama_current_profile_id());

drop policy if exists expense_evidence_storage_read on storage.objects;
create policy expense_evidence_storage_read on storage.objects for select to authenticated using(bucket_id='expense-evidence' and public.wama_is_tenant_member((storage.foldername(name))[1]::uuid));
drop policy if exists expense_evidence_storage_insert on storage.objects;
create policy expense_evidence_storage_insert on storage.objects for insert to authenticated with check(bucket_id='expense-evidence' and public.wama_is_tenant_member((storage.foldername(name))[1]::uuid));
commit;
