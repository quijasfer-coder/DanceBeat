-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Seed data
--  Migración 0004
--
--  Pobla las tablas de catálogo con datos reales:
--   · 2 sucursales (Av. Stim, Cumbres)
--   · 8 estilos
--   · 6 planes (Single Beat → Stage)
--   · 4 clases recurrentes (las que tienen horario confirmado)
--   · 5 settings de configuración
--
--  Idempotente: ON CONFLICT en tablas con unique. Para `classes`
--  verifica con NOT EXISTS antes de insertar.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  STUDIOS
-- ─────────────────────────────────────────────────────────────────────

insert into public.studios (slug, name, address, neighborhood, zip, notes)
values
  ('av-stim',
   'Av. Stim',
   'Av. Stim 1348, Sótano 1',
   'Lomas del Chamizal, Cuajimalpa de Morelos',
   '05129',
   'A partir de 4:30 PM'),
  ('cumbres',
   'Cumbres International School',
   'Recepción Cumbres International School',
   'Ciudad de México',
   null,
   null)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────
--  STYLES — catálogo de estilos
--  level se maneja a nivel de class, no de style
-- ─────────────────────────────────────────────────────────────────────

insert into public.styles (slug, name, tagline, description, cover_url, age_range, duration_min, display_order)
values
  ('heels', 'Heels',
   'Disciplina, fuerza y feminidad sobre tacones.',
   'Heels combina técnica de baile sobre tacones con expresión corporal, postura y proyección escénica. Una clase pensada para que el tacón deje de ser obstáculo y se vuelva lenguaje. Trabajamos coreografías con énfasis en presencia, control y autenticidad.',
   '/class-covers/heels.png', '18 a 30 años', 60, 1),

  ('hiphop-afro', 'HipHop · Afro',
   'Raíz afro, energía urbana.',
   'Una fusión entre la fuerza ritmica del Afro y la actitud del HipHop. Trabajamos groove, peso del cuerpo, aislamientos y coreografías que conectan tradición con calle.',
   '/class-covers/hiphop-afro.png', '18 a 30 años', 60, 2),

  ('contemporaneo', 'Contemporáneo',
   'Movimiento, respiración, suelo.',
   'Una clase para explorar el cuerpo como territorio expresivo. Combinamos técnica contemporánea, trabajo de suelo, respiración y composición. Apta para quienes quieren conectar con la danza desde adentro.',
   '/class-covers/contemporaneo.png', 'Abierto a todas las edades', 60, 3),

  ('danza-urbana', 'Danza Urbana',
   'La calle, traducida al cuerpo.',
   'Estilos urbanos contemporáneos: locking, popping, house y nuevas tendencias. Trabajamos técnica, freestyle y coreografía con foco en actitud y musicalidad.',
   '/class-covers/danza-urbana.png', '18 a 30 años', 60, 4),

  ('ritmos-latinos', 'Ritmos Latinos',
   'Salsa, bachata, merengue — y todo lo que se baila.',
   'Un viaje por los ritmos que mueven Latinoamérica: salsa, bachata, merengue y cumbia. Aprendemos pasos base, vueltas y variaciones, con énfasis en sentir la música y disfrutar del baile social.',
   '/class-covers/ritmos-latinos.png', '18 a 30 años', 60, 5),

  ('ritmos-latinos-parejas', 'Ritmos Latinos · Parejas',
   'Para bailar con alguien.',
   'Ritmos latinos con foco en el baile en pareja: conexión, marca, conducción y figuras. No necesitas venir con pareja — rotamos durante la clase.',
   '/class-covers/ritmos-latinos.png', '18 a 30 años', 60, 6),

  ('mix-styles', 'Mix Styles',
   'El baile no tiene edad.',
   'Una clase pensada para adultos 35+ que mezcla estilos accesibles para reactivar cuerpo, coordinación y memoria. Espacio para reconectar con la danza sin presión, en comunidad.',
   '/class-covers/mix-styles.png', 'Adultos 35+', 60, 7),

  ('flow', 'Flow',
   'Que bailen desde chiquitos.',
   'Clases de iniciación a la danza para niños y niñas, divididas en dos grupos: 4 a 7 años y 8 a 12 años. Trabajamos coordinación, ritmo, expresión corporal y juego escénico en un ambiente seguro y divertido.',
   '/class-covers/flow.png', 'Niños · 4 a 7 y 8 a 12 años', 60, 8)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────
--  PLANS — los 6 tiers (Single Beat → Stage)
--  perks se almacena como JSONB
-- ─────────────────────────────────────────────────────────────────────

insert into public.plans (code, name, tagline, price_cents, cadence, classes_per_week, credits_per_month, perks, display_order)
values
  ('single_beat', 'Single Beat', 'Una sola visita',
   35000, '/clase', null, null,
   '["Una clase a elegir", "Sin compromiso mensual", "Ideal para probar"]'::jsonb,
   1),

  ('pulse', 'Pulse', '1 clase por semana',
   120000, '/mes', 1, 4,
   '["4 créditos al mes", "Cualquier estilo", "Cancela hasta 12 horas antes", "Reserva online 24/7"]'::jsonb,
   2),

  ('rhythm', 'Rhythm', '2 clases por semana',
   200000, '/mes', 2, 8,
   '["8 créditos al mes", "Cualquier estilo", "Cancela hasta 12 horas antes", "Lista de espera prioritaria"]'::jsonb,
   3),

  ('groove', 'Groove', '3 clases por semana',
   280000, '/mes', 3, 12,
   '["12 créditos al mes", "Cualquier estilo", "Cancela hasta 12 horas antes", "Lista de espera prioritaria", "Eventos exclusivos para alumnas"]'::jsonb,
   4),

  ('flow', 'Flow', '4 clases por semana',
   340000, '/mes', 4, 16,
   '["16 créditos al mes", "Cualquier estilo", "Cancela hasta 12 horas antes", "Lista de espera prioritaria", "Eventos exclusivos", "Acceso a workshops mensuales"]'::jsonb,
   5),

  ('stage', 'Stage', '5 clases por semana',
   420000, '/mes', 5, 20,
   '["20 créditos al mes", "Acceso total a todos los estilos", "Cancela hasta 12 horas antes", "Lista de espera prioritaria", "Eventos exclusivos", "Pre-venta de boletos Luminaria", "Workshops y masterclasses incluidos"]'::jsonb,
   6)
on conflict (code) do nothing;

-- ─────────────────────────────────────────────────────────────────────
--  SETTINGS — constantes editables sin redeploy
-- ─────────────────────────────────────────────────────────────────────

insert into public.settings (key, value, description) values
  ('cancel_window_hours',    '12',
   'Horas antes de la clase para cancelar sin perder el crédito'),
  ('enrollment_fee_cents',   '160000',
   'Inscripción única en centavos MXN ($1,600)'),
  ('late_fee_pct',           '0.10',
   'Recargo aplicado a pagos después del día N'),
  ('late_fee_day_of_month',  '10',
   'Día del mes a partir del cual aplica recargo'),
  ('cycle_length_weeks',     '4',
   'Duración de un ciclo de suscripción mensual')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────────────────────────────
--  CLASSES — 4 plantillas recurrentes con horario confirmado
--
--  Las otras 4 styles (Contemporáneo, Danza Urbana, Ritmos Latinos
--  Parejas, Flow) NO se siembran porque la clienta no nos confirmó
--  horario todavía. La admin las crea desde el dashboard /admin/clases
--  cuando los confirme.
--
--  level: 'abierto' = acepta varios niveles (princ + interm)
--         'principiante' = solo principiantes
-- ─────────────────────────────────────────────────────────────────────

-- Heels — Martes 7:30 PM, Av. Stim
insert into public.classes (style_id, studio_id, day_of_week, starts_at_time, duration_min, level, capacity, age_min, age_max)
select
  (select id from public.styles  where slug = 'heels'),
  (select id from public.studios where slug = 'av-stim'),
  2, '19:30', 60, 'abierto', 12, 18, 30
where not exists (
  select 1 from public.classes c
  join public.styles s on s.id = c.style_id
  where s.slug = 'heels' and c.day_of_week = 2 and c.starts_at_time = '19:30'
);

-- HipHop · Afro — Lunes 7:30 PM, Av. Stim
insert into public.classes (style_id, studio_id, day_of_week, starts_at_time, duration_min, level, capacity, age_min, age_max)
select
  (select id from public.styles  where slug = 'hiphop-afro'),
  (select id from public.studios where slug = 'av-stim'),
  1, '19:30', 60, 'abierto', 12, 18, 30
where not exists (
  select 1 from public.classes c
  join public.styles s on s.id = c.style_id
  where s.slug = 'hiphop-afro' and c.day_of_week = 1 and c.starts_at_time = '19:30'
);

-- Ritmos Latinos — Jueves 7:30 PM, Av. Stim
insert into public.classes (style_id, studio_id, day_of_week, starts_at_time, duration_min, level, capacity, age_min, age_max)
select
  (select id from public.styles  where slug = 'ritmos-latinos'),
  (select id from public.studios where slug = 'av-stim'),
  4, '19:30', 60, 'abierto', 12, 18, 30
where not exists (
  select 1 from public.classes c
  join public.styles s on s.id = c.style_id
  where s.slug = 'ritmos-latinos' and c.day_of_week = 4 and c.starts_at_time = '19:30'
);

-- Mix Styles — Lunes 6:30 PM, Av. Stim, solo principiantes 35+
insert into public.classes (style_id, studio_id, day_of_week, starts_at_time, duration_min, level, capacity, age_min, age_max)
select
  (select id from public.styles  where slug = 'mix-styles'),
  (select id from public.studios where slug = 'av-stim'),
  1, '18:30', 60, 'principiante', 12, 35, null
where not exists (
  select 1 from public.classes c
  join public.styles s on s.id = c.style_id
  where s.slug = 'mix-styles' and c.day_of_week = 1 and c.starts_at_time = '18:30'
);
