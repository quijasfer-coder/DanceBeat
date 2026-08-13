-- La migración anterior (enrollment_by_student) creó enrollment_types con
-- RLS + policies pero sin los grants de tabla explícitos que este proyecto
-- necesita (ver 20260720131500_gallery_albums_service_role_grant.sql —
-- mismo problema ya resuelto ahí para otra tabla nueva). Sin esto, ni
-- siquiera el service_role puede leer/escribir la tabla.

grant select on public.enrollment_types to anon, authenticated;
grant insert, update, delete on public.enrollment_types to authenticated;
grant select, insert, update, delete on public.enrollment_types to service_role;
