-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Grants explícitos para events
--  Migración 0010
--
--  El proyecto Supabase tiene Data API restrictiva — las tablas nuevas
--  no quedan expuestas al rol `authenticated` automáticamente. RLS solo
--  filtra DESPUÉS de que Postgres dé permiso de tabla, así que sin estos
--  grants la API responde "permission denied" antes de evaluar RLS.
--
--  Esta migración garantiza los grants de las tablas de eventos.
-- ════════════════════════════════════════════════════════════════════

grant select, insert, update, delete on public.events            to authenticated;
grant select, insert, update, delete on public.event_assignments to authenticated;

-- anon NO tiene acceso (los eventos se ven solo logueada).
