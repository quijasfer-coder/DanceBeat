-- La migración original de gallery_albums solo otorgó privilegios a
-- `authenticated`, sin incluir `service_role` (a diferencia del resto
-- del schema, que hereda privilegios por defecto). Sin esto, cualquier
-- script o job de backend que use el service role key no puede leer
-- ni escribir esta tabla.

grant select, insert, update, delete on public.gallery_albums to service_role;
