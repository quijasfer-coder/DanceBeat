-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Convertir plans.code a TEXT
--  Migración 0008
--
--  El enum plan_code ('single_beat', 'pulse', 'rhythm', 'groove',
--  'flow', 'stage') congelaba qué planes podían existir. Ahora
--  el admin necesita poder crear nuevos planes desde el dashboard
--  (ej. 'impulse'), así que migramos `code` a TEXT con UNIQUE.
--
--  El enum se elimina porque ya no lo usa nadie más.
-- ════════════════════════════════════════════════════════════════════

-- 1. Soltar el default y cambiar el tipo de columna
alter table public.plans
  alter column code drop default,
  alter column code type text using code::text;

-- 2. Garantizar lowercase + sin espacios para que sirva como slug en URLs
alter table public.plans
  add constraint plans_code_format_chk
  check (code ~ '^[a-z0-9_-]+$');

-- 3. Drop del enum (ya no se referencia en ninguna columna)
drop type public.plan_code;
