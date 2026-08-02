-- WAMA: un portal por empresa, trials y licencias independientes por módulo.
begin;

-- El vencimiento comercial vive en cada licencia (renews_at), no en la empresa.
-- Se normalizan duplicados históricos antes de reafirmar la unicidad.
with ranked as (
  select id,
         row_number() over (partition by tenant_id, module_id order by created_at asc, id asc) as position
  from public.wama_tenant_module_licenses
)
delete from public.wama_tenant_module_licenses l
using ranked r
where l.id = r.id and r.position > 1;

create unique index if not exists uq_wama_license_tenant_module
  on public.wama_tenant_module_licenses(tenant_id, module_id);

create unique index if not exists uq_wama_assignment_license_profile
  on public.wama_module_user_assignments(tenant_module_license_id, profile_id);

-- Todo módulo trial antiguo que no tenga fechas recibe un periodo propio.
update public.wama_tenant_module_licenses
set starts_at = coalesce(starts_at, created_at, now()),
    renews_at = coalesce(renews_at, coalesce(starts_at, created_at, now()) + interval '15 days')
where status = 'trial';

-- El administrador ocupa el primer cupo de cada módulo activo de su empresa.
insert into public.wama_module_user_assignments
  (tenant_module_license_id, profile_id, assigned_by, status)
select l.id, tm.profile_id, tm.profile_id, 'active'
from public.wama_tenant_module_licenses l
join public.wama_tenant_memberships tm on tm.tenant_id = l.tenant_id
where tm.role = 'owner'
  and tm.status = 'active'
  and l.status in ('trial','active','pending')
on conflict (tenant_module_license_id, profile_id)
do update set status = 'active';

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
    greatest(0, (l.included_seats + (l.extra_seat_blocks * l.extra_block_size))
      - count(a.id) filter (where a.status = 'active')),
    l.unit_price_usd + (l.extra_seat_blocks * l.extra_block_price_usd),
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
           l.unit_price_usd, l.extra_block_price_usd, l.starts_at, l.renews_at
  order by t.name, mc.name;
$$;

grant execute on function public.wama_my_licensing_summary() to authenticated;

commit;
