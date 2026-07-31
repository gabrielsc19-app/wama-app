begin;

alter table public.wama_tenants
  add column if not exists onboarding_completed boolean not null default false;

-- Las empresas ya personalizadas no deben volver a ver el onboarding.
update public.wama_tenants
set onboarding_completed = true
where logo_url is not null and length(btrim(logo_url)) > 0;

drop function if exists public.wama_my_portal_tenants();
create function public.wama_my_portal_tenants()
returns table (
  membership_id uuid, tenant_id uuid, profile_id uuid,
  membership_role text, membership_status text, joined_at timestamptz,
  tenant_code text, tenant_name text, tenant_slug text, tenant_logo_url text,
  tenant_country_code text, tenant_timezone text, tenant_status text,
  tenant_trial_ends_at timestamptz, tenant_onboarding_completed boolean,
  tenant_created_at timestamptz, tenant_updated_at timestamptz
)
language sql stable security definer
set search_path = public, auth
as $$
  select tm.id, tm.tenant_id, tm.profile_id, tm.role, tm.status, tm.joined_at,
         t.code, t.name, t.slug, t.logo_url, t.country_code, t.timezone,
         t.status, t.trial_ends_at, t.onboarding_completed, t.created_at, t.updated_at
  from public.wama_tenant_memberships tm
  join public.wama_profiles p on p.id = tm.profile_id
  join public.wama_tenants t on t.id = tm.tenant_id
  where p.auth_user_id = auth.uid() and tm.status = 'active'
  order by tm.joined_at asc;
$$;

revoke all on function public.wama_my_portal_tenants() from public;
grant execute on function public.wama_my_portal_tenants() to authenticated;
grant update (name, logo_url, country_code, timezone, onboarding_completed) on public.wama_tenants to authenticated;

commit;
