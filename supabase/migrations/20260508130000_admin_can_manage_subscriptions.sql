-- ─────────────────────────────────────────────────────────────────────
--  Dance Beat Academy — Admin puede gestionar subscriptions manualmente
-- ─────────────────────────────────────────────────────────────────────
--  La migración 0002 dejó subscriptions con escrituras solo desde
--  service_role (pensando en Stripe webhook). Pre-Stripe necesitamos
--  que el admin pueda crear/editar/cancelar suscripciones desde
--  /admin/alumnos/[id]. Esta migración agrega policies INSERT/UPDATE/
--  DELETE para admins.
--
--  Cuando se conecte Stripe (fase 4), estas policies pueden quedarse
--  para correcciones manuales (ajustar créditos, cancelar a mano, etc.).
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "subscriptions_admin_insert" on public.subscriptions;
drop policy if exists "subscriptions_admin_update" on public.subscriptions;
drop policy if exists "subscriptions_admin_delete" on public.subscriptions;

create policy "subscriptions_admin_insert"
  on public.subscriptions for insert
  to authenticated
  with check (public.is_admin());

create policy "subscriptions_admin_update"
  on public.subscriptions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "subscriptions_admin_delete"
  on public.subscriptions for delete
  to authenticated
  using (public.is_admin());

-- Grants explícitos por si la versión de Supabase los necesita
grant insert, update, delete on public.subscriptions to authenticated;
