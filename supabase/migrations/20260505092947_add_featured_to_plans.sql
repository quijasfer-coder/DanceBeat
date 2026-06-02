-- Migración 0006: agrega columna featured a plans
-- Marca cuál plan se destaca visualmente en /planes y home preview.

alter table public.plans
  add column if not exists featured boolean not null default false;

update public.plans set featured = true where code = 'groove';
