-- P0.3 WAMA: reglas comerciales reales de trial y licenciamiento.
-- 15 días por módulo · mínimo 10 usuarios · US$10 por usuario/mes.
begin;

alter table public.wama_tenant_module_licenses
  alter column included_seats set default 10,
  alter column extra_block_size set default 10,
  alter column unit_price_usd set default 10,
  alter column extra_block_price_usd set default 100;

-- Precio por usuario para los tres módulos comercializados.
update public.wama_module_catalog
set monthly_price_usd = 10,
    included_seats = 10,
    extra_block_size = 10,
    extra_block_price_usd = 100
where module_key in ('sales','expense','operations');

-- Normaliza licencias ya creadas. unit_price_usd es precio por asiento.
-- extra_block_price_usd representa el precio del bloque completo de 10.
update public.wama_tenant_module_licenses l
set included_seats = 10,
    extra_block_size = 10,
    unit_price_usd = 10,
    extra_block_price_usd = 100
from public.wama_module_catalog mc
where mc.id = l.module_id
  and mc.module_key in ('sales','expense','operations');

-- Asegura 15 días para trials históricos sin vencimiento.
update public.wama_tenant_module_licenses
set starts_at = coalesce(starts_at, created_at, now()),
    renews_at = coalesce(renews_at, coalesce(starts_at, created_at, now()) + interval '15 days')
where status = 'trial';

-- Resumen comercial: capacidad contratada × US$10 por usuario.
drop function if exists public.wama_my_licensing_summary();
create function public.wama_my_licensing_summary()
returns table (
  tenant_id uuid,
  tenant_name text,
  tenant_code text,
  module_key text,
  module_name text,
  license_id uuid,
  license_status text,
  included_seats integer,
  extra_seat_blocks integer,
  seat_capacity integer,
  used_seats bigint,
  available_seats bigint,
  monthly_total_usd numeric,
  starts_at timestamptz,
  renews_at timestamptz,
  trial_days_remaining integer
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    t.id,
    t.name,
    t.code,
    mc.module_key,
    mc.name,
    l.id,
    l.status,
    l.included_seats,
    l.extra_seat_blocks,
    l.included_seats + (l.extra_seat_blocks * l.extra_block_size),
    count(a.id) filter (where a.status = 'active'),
    greatest(0, (l.included_seats + (l.extra_seat_blocks * l.extra_block_size)) - count(a.id) filter (where a.status = 'active')),
    ((l.included_seats + (l.extra_seat_blocks * l.extra_block_size)) * l.unit_price_usd)::numeric,
    l.starts_at,
    l.renews_at,
    case
      when l.status = 'trial' and l.renews_at is not null
        then greatest(0, ceil(extract(epoch from (l.renews_at - now())) / 86400.0)::integer)
      else 0
    end
  from public.wama_tenant_module_licenses l
  join public.wama_tenants t on t.id = l.tenant_id
  join public.wama_module_catalog mc on mc.id = l.module_id
  join public.wama_tenant_memberships tm on tm.tenant_id = t.id
  join public.wama_profiles p on p.id = tm.profile_id
  left join public.wama_module_user_assignments a on a.tenant_module_license_id = l.id
  where p.auth_user_id = auth.uid() and tm.status = 'active'
  group by t.id, t.name, t.code, mc.module_key, mc.name, l.id, l.status,
           l.included_seats, l.extra_seat_blocks, l.extra_block_size,
           l.unit_price_usd, l.starts_at, l.renews_at
  order by t.name, mc.name;
$$;

grant execute on function public.wama_my_licensing_summary() to authenticated;

commit;
