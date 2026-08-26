-- WAMA V7 - Trazabilidad real de correos Resend.
-- Separa el estado de la invitación del estado real del correo.
begin;

alter table public.wama_invitations
  add column if not exists email_delivery_status text not null default 'pending',
  add column if not exists email_last_event_type text,
  add column if not exists email_last_event_at timestamptz,
  add column if not exists email_delivered_at timestamptz,
  add column if not exists email_bounced_at timestamptz,
  add column if not exists email_opened_at timestamptz,
  add column if not exists email_clicked_at timestamptz,
  add column if not exists email_delivery_detail text;

alter table public.wama_invitations
  drop constraint if exists wama_invitations_email_delivery_status_check;

alter table public.wama_invitations
  add constraint wama_invitations_email_delivery_status_check
  check (
    email_delivery_status in (
      'pending',
      'sent',
      'delivered',
      'delayed',
      'bounced',
      'complained',
      'failed',
      'suppressed',
      'opened',
      'clicked'
    )
  );

create index if not exists idx_wama_invitations_provider_message
  on public.wama_invitations(provider_message_id)
  where provider_message_id is not null;

create index if not exists idx_wama_invitations_email_delivery
  on public.wama_invitations(tenant_id,email_delivery_status,email_last_event_at desc);

create table if not exists public.wama_email_webhook_events (
  id uuid primary key default gen_random_uuid(),
  svix_id text not null unique,
  provider text not null default 'resend',
  event_type text not null,
  provider_message_id text,
  recipient_email text,
  event_created_at timestamptz,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create index if not exists idx_wama_email_webhook_events_message
  on public.wama_email_webhook_events(provider_message_id,event_created_at desc);

alter table public.wama_email_webhook_events enable row level security;

-- Esta tabla se escribe solo con service role desde el webhook.
-- No se entrega acceso directo al cliente.
revoke all on public.wama_email_webhook_events from anon, authenticated;

-- Normaliza invitaciones ya enviadas: si ya tienen ID de proveedor,
-- al menos sabemos que Resend aceptó el envío.
update public.wama_invitations
set email_delivery_status = 'sent',
    email_last_event_type = coalesce(email_last_event_type,'email.sent'),
    email_last_event_at = coalesce(email_last_event_at,sent_at)
where provider_message_id is not null
  and status in ('sent','accepted')
  and email_delivery_status = 'pending';

commit;
