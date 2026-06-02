-- ─────────────────────────────────────────────────────────────────────
--  Dance Beat Academy — Da de alta a la admin como coreógrafa
-- ─────────────────────────────────────────────────────────────────────
--  Inserta un registro en public.teachers vinculado al profile de la
--  admin Fernanda. Idempotente: si ya existe un teacher con su profile_id,
--  no hace nada.
--
--  No promueve el role del profile a 'teacher' porque admin ya tiene
--  acceso de teacher por diseño (requireTeacher permite admin).
-- ─────────────────────────────────────────────────────────────────────

insert into public.teachers (profile_id, full_name, is_active)
select id, full_name, true
from public.profiles
where email = 'quijas.fer@gmail.com'
  and not exists (
    select 1 from public.teachers
    where teachers.profile_id = profiles.id
  );
