-- Precios comerciales oficiales WAMA (USD por mes y por bloque de 10 usuarios).
update public.wama_module_catalog
set monthly_price_usd = case when module_key = 'expense' then 20 else 10 end,
    extra_block_price_usd = case when module_key = 'expense' then 20 else 10 end,
    updated_at = now()
where module_key in ('expense', 'sales', 'operations', 'finance', 'ops');

-- Alinea licencias ya creadas para que el panel y la facturación usen el precio correcto.
update public.wama_tenant_module_licenses l
set unit_price_usd = case when mc.module_key = 'expense' then 20 else 10 end,
    extra_block_price_usd = case when mc.module_key = 'expense' then 20 else 10 end,
    updated_at = now()
from public.wama_module_catalog mc
where l.module_id = mc.id
  and mc.module_key in ('expense', 'sales', 'operations', 'finance', 'ops');
