begin;

-- Normaliza oportunidades creadas con las etapas anteriores sin borrar información.
update public.wama_sales_deals
set stage = case stage
  when 'Target account' then 'Marca objetivo'
  when 'First contact' then 'Primer contacto'
  when 'Qualified lead' then 'Primer contacto'
  when 'Proposal sent' then 'Propuesta enviada'
  when 'Negotiation' then 'Negociación'
  when 'Closing' then 'Negociación'
  when 'Closed won' then 'Cierre ganado'
  when 'Closed lost' then 'Cierre perdido'
  when 'No califica' then 'Cierre perdido'
  else stage
end,
probability = case stage
  when 'Target account' then 10
  when 'First contact' then 20
  when 'Qualified lead' then 20
  when 'Proposal sent' then 30
  when 'Negotiation' then 40
  when 'Closing' then 40
  when 'Closed won' then 100
  when 'Closed lost' then 0
  when 'No califica' then 0
  else probability
end,
updated_at = now()
where stage in ('Target account','First contact','Qualified lead','Proposal sent','Negotiation','Closing','Closed won','Closed lost','No califica');

grant select, insert, update on public.wama_invitations to authenticated;

commit;
