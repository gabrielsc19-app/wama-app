-- WAMA Operations Hub - reparación idempotente de esquema para Usuarios/Invitaciones.
begin;

alter table public.wama_operations_teams
  add column if not exists description text,
  add column if not exists response_sla_minutes integer not null default 1440,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.wama_profiles(id) on delete set null,
  add column if not exists deletion_reason text;

alter table public.wama_operations_team_members
  add column if not exists notify_new_cases boolean not null default true,
  add column if not exists notify_updates boolean not null default true,
  add column if not exists notify_urgent boolean not null default true,
  add column if not exists notify_email boolean not null default true,
  add column if not exists notify_push boolean not null default true;

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

create index if not exists idx_operations_team_members_profile
  on public.wama_operations_team_members(profile_id,team_id);

-- Asegura que los roles usados por Operations sean válidos.
alter table public.wama_module_user_assignments
  drop constraint if exists wama_module_user_assignments_module_role_check;

alter table public.wama_module_user_assignments
  add constraint wama_module_user_assignments_module_role_check check(module_role in(
    'module_admin','member','viewer',
    'expense_manager','expense_admin','expense_approver','expense_reviewer','expense_treasurer','expense_submitter','expense_auditor',
    'sales_manager','sales_supervisor','sales_executive','sales_financial_evaluator','sales_admin','sales_auditor',
    'operations_admin','operations_coordinator','operations_operator','operations_reporter','operations_observer'
  ));

commit;
