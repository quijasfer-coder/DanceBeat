-- El código (deactivateStudentAction, /admin/alumnos, DeactivateStudent)
-- siempre asumió que students tenía is_active, pero nunca se escribió
-- la migración. El UPDATE fallaba en silencio con
-- "column students.is_active does not exist" y "Dar de baja" nunca
-- hacía nada.

alter table public.students
  add column if not exists is_active boolean not null default true;
