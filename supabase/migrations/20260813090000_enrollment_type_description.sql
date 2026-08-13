-- Nota descriptiva por tipo de inscripción (ej. "Especial" solo se cobra
-- una vez al año e incluye uniforme) — se muestra en el perfil de la
-- alumna cuando ese tipo está asignado.

alter table public.enrollment_types
  add column description text;
