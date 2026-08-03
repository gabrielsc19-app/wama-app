begin;

alter table public.wama_sales_settings
  add column if not exists industry text;

comment on column public.wama_sales_settings.industry is
  'Rubro seleccionado durante la configuración inicial de Sales Hub.';

commit;
