-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Rename plan & studio visibility
--  Migración 0005
--
--  Cambios:
--    1. Renombra plan_code 'flow' → 'cadence'
--       (resolver conflicto con el style "Flow" que es la clase de niños)
--    2. Agrega columna is_public a studios
--       Cumbres International School es interna (solo alumnas del colegio).
--       NO se muestra como sucursal seleccionable al cliente externo.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  1. RENAME PLAN: flow → cadence
--
--  ALTER TYPE ... RENAME VALUE conserva integridad referencial:
--  la fila existente con code='flow' queda automáticamente con
--  code='cadence' después del rename (mismo valor interno, solo
--  cambia la etiqueta).
-- ─────────────────────────────────────────────────────────────────────

alter type plan_code rename value 'flow' to 'cadence';

update public.plans
   set name = 'Cadence'
 where code = 'cadence';

-- ─────────────────────────────────────────────────────────────────────
--  2. STUDIO VISIBILITY
--
--  is_public = true  → visible al cliente externo (Av. Stim)
--  is_public = false → solo staff lo ve (Cumbres, sucursal interna)
-- ─────────────────────────────────────────────────────────────────────

alter table public.studios
  add column if not exists is_public boolean not null default true;

comment on column public.studios.is_public is
  'true = sucursal pública (cliente externo puede tomar clases). false = sucursal interna que solo staff ve.';

update public.studios
   set is_public = false
 where slug = 'cumbres';

-- ─────────────────────────────────────────────────────────────────────
--  3. RLS — actualizar policy de lectura pública
--
--  La nueva policy filtra: anon y authenticated normales solo ven
--  studios públicos y activos. Staff (teacher/admin) ve todos —
--  necesario para que el dashboard interno pueda gestionar clases
--  en Cumbres si las hubiera.
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "studios_public_read" on public.studios;

create policy "studios_public_read"
  on public.studios for select
  to anon, authenticated
  using (
    is_active = true
    and (is_public = true or public.is_staff())
  );
