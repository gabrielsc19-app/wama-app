begin;

-- Las tablas creadas desde SQL no siempre heredan privilegios para los roles
-- de la API. RLS sigue decidiendo qué filas puede ver cada usuario.
grant usage on schema public to authenticated;
grant select on table public.wama_tenants to authenticated;
grant select on table public.wama_tenant_memberships to authenticated;
grant select on table public.wama_profiles to authenticated;
grant select on table public.wama_tenant_module_licenses to authenticated;
grant select on table public.wama_module_catalog to authenticated;
grant select on table public.wama_module_user_assignments to authenticated;
grant select on table public.wama_projects to authenticated;
grant select on table public.wama_project_members to authenticated;
grant select on table public.wama_expense_reports to authenticated;
grant select on table public.wama_expense_evidence to authenticated;

grant execute on function public.wama_current_profile_id() to authenticated;
grant execute on function public.wama_is_tenant_member(uuid) to authenticated;
grant execute on function public.wama_is_tenant_admin(uuid) to authenticated;

-- Evita que una política de membresías vuelva a consultar la misma tabla con
-- los permisos del usuario. Las funciones conservan el aislamiento por auth.uid().
alter function public.wama_current_profile_id() owner to postgres;
alter function public.wama_is_tenant_member(uuid) owner to postgres;
alter function public.wama_is_tenant_admin(uuid) owner to postgres;

commit;
