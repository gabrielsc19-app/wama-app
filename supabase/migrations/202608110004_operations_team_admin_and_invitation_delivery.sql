-- Administración real de equipos y trazabilidad de invitaciones.
begin;

alter table public.wama_operations_teams
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.wama_profiles(id) on delete set null,
  add column if not exists deletion_reason text;

alter table public.wama_invitations
  add column if not exists provider_message_id text,
  add column if not exists sent_at timestamptz,
  add column if not exists last_error text,
  add column if not exists send_attempts integer not null default 0;

alter table public.wama_invitations
  drop constraint if exists wama_invitations_status_check;

alter table public.wama_invitations
  add constraint wama_invitations_status_check
  check (status in ('pending','sent','failed','accepted','expired','cancelled'));

create index if not exists idx_wama_invitations_delivery
  on public.wama_invitations(tenant_id,status,sent_at desc);

commit;
