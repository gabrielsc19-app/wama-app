-- Guarda la web corporativa separada del logo.
alter table public.wama_tenants
  add column if not exists website text;

comment on column public.wama_tenants.website is
  'Sitio web oficial de la empresa, separado de la imagen de logo.';

notify pgrst, 'reload schema';
