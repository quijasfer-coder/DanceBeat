-- Corrige la migración anterior: en la base real el plan de 4 clases/semana
-- tiene code = 'cadence' (renombrado en producción desde 'flow', el seed
-- original nunca se actualizó), así que el UPDATE por code = 'flow' no
-- afectó ninguna fila. Aplica el precio del nuevo ciclo aquí.

update public.plans set price_cents = 375000 where code = 'cadence';
