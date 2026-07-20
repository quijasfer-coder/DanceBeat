-- Migración: precios del nuevo ciclo
-- Rhythm/Groove/Flow suben de precio, Pulse y Stage se dejan de ofrecer
-- (se desactivan, no se borran, por si hay alumnos con historial en ellos),
-- se agrega el plan IMPULSE (compañía elite, $4,800/mes, 6 clases/sem) y
-- la inscripción única sube a $3,500.

update public.plans set price_cents = 220000 where code = 'rhythm';
update public.plans set price_cents = 310000 where code = 'groove';
update public.plans set price_cents = 375000 where code = 'flow';

update public.plans set is_active = false where code in ('pulse', 'stage');

insert into public.plans (code, name, tagline, price_cents, cadence, classes_per_week, credits_per_month, perks, display_order)
values
  ('impulse', 'Impulse', '6 clases por semana',
   480000, '/mes', 6, 24,
   '["24 créditos al mes", "Acceso a la compañía representativa IMPULSE", "Entrenamiento intensivo y coreografías de competencia", "Prioridad en producciones y eventos escénicos", "Requiere audición"]'::jsonb,
   7)
on conflict (code) do nothing;

update public.settings
  set value = '350000',
      description = 'Inscripción única en centavos MXN ($3,500)'
  where key = 'enrollment_fee_cents';
