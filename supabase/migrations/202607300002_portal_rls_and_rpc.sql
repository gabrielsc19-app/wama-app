-- WAMA v0.9.1
-- Corrige la carga del portal sin exponer membresías entre empresas.
-- Ejecutar una sola vez en Supabase SQL Editor.

begin;

create or replace function public.wama_my_portal_tenants()
returns table (
  membership_id uuid,
  tenant_id uuid,
  profile_id uuid,
  membership_role text,
  membership_status text,
  joined_at timestamptz,
  tenant_code text,
  tenant_name text,
  tenant_slug text,
  tenant_logo_url text,
  tenant_country_code text,
  tenant_timezone text,
  tenant_status text,
  tenant_trial_ends_at timestamptz,
  tenant_created_at timestamptz,
  tenant_updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    tm.id,
    tm.tenant_id,
    tm.profile_id,
    tm.role,
    tm.status,
    tm.joined_at,
    t.code,
    t.name,
    t.slug,
    t.logo_url,
    t.country_code,
    t.timezone,
    t.status,
    t.trial_ends_at,
    t.created_at,
    t.updated_at
  from public.wama_tenant_memberships tm
  join public.wama_profiles p on p.id = tm.profile_id
  join public.wama_tenants t on t.id = tm.tenant_id
  where p.auth_user_id = auth.uid()
    and tm.status = 'active'
  order by tm.joined_at asc;
$$;

revoke all on function public.wama_my_portal_tenants() from public;
grant execute on function public.wama_my_portal_tenants() to authenticated;

-- Las funciones existentes también deben poder ejecutarse desde el cliente autenticado.
grant execute on function public.wama_current_profile_id() to authenticated;
grant execute on function public.wama_my_licensing_summary() to authenticated;

commit;
