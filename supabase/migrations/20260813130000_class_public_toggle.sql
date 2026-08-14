-- Control de visibilidad pública POR CLASE, independiente de is_active
-- (que sigue controlando si la clase funciona en el sistema: genera
-- sesiones, se puede reservar, etc.) y de studios.is_public (que oculta
-- TODA una sucursal). Con esto la clienta puede elegir clase por clase
-- cuáles se anuncian en dancebeat.studio sin afectar su operación.

alter table public.classes
  add column is_public boolean not null default true;

comment on column public.classes.is_public is
  'Si aparece en el sitio público (catálogo /clases y /horarios). No afecta si la clase funciona en el sistema — eso lo controla is_active.';
