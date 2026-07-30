begin;

alter table public.wama_tenants
  add column if not exists tax_id text,
  add column if not exists contact_phone text;


update public.wama_module_catalog
set name = 'Rendiciones de Gastos',
    description = 'Rendiciones, comprobantes, proyectos y aprobaciones de gastos.'
where module_key = 'expense';

commit;
