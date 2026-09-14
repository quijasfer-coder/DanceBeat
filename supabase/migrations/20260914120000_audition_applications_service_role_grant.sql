-- audition_applications tenía grants para anon/authenticated (insert público
-- del form + lectura del admin vía sesión) pero nunca para service_role —
-- mismo gotcha ya documentado con gallery_albums y enrollment_types: las
-- RLS policies no bastan, hasta service_role necesita GRANT explícito.
grant select, insert, update, delete on public.audition_applications to service_role;
