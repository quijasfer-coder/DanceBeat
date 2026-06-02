-- ─────────────────────────────────────────────────────────────────────
--  Dance Beat Academy — Fix typo "auditiones" → "audiciones"
-- ─────────────────────────────────────────────────────────────────────
--  La migración 0011 sembró el mensaje de cierre de audiciones con un
--  typo ("auditiones" no es palabra en español; lo correcto es
--  "audiciones"). Esta migración corrige el valor en BD si todavía
--  contiene el typo. Es idempotente: si el admin ya editó el mensaje
--  desde /admin/audiciones, no hace nada.
-- ─────────────────────────────────────────────────────────────────────

update public.settings
set value = replace(value, 'auditiones', 'audiciones'),
    updated_at = now()
where key = 'impulse_auditions_message'
  and value like '%auditiones%';
