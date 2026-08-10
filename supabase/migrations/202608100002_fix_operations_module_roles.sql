begin;

-- Operations Hub incorporó perfiles propios. Esta migración reemplaza la
-- restricción antigua sin eliminar asignaciones existentes.
alter table public.wama_module_user_assignments
  drop constraint if exists wama_module_user_assignments_module_role_check;

alter table public.wama_module_user_assignments
  add constraint wama_module_user_assignments_module_role_check
  check (
    module_role is null
    or module_role in (
      'owner',
      'admin',
      'coordinator',
      'operator',
      'reporter',
      'manager',
      'member'
    )
  );

commit;
