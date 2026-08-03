-- Corrige instalaciones de Expense Hub donde due_date no quedó creada.
alter table public.wama_expense_reports
  add column if not exists due_date date;

-- Solicita a PostgREST actualizar inmediatamente su caché de esquema.
notify pgrst, 'reload schema';
