-- ════════════════════════════════════════════════════════════════════
--  Admin puede registrar una alumna en la cuenta de cualquier titular.
--
--  Varios padres crean su cuenta (profiles) y piensan que eso YA fue
--  "el registro" — nunca completan el paso de agregar a su hija
--  (students). El admin necesita poder capturar esos datos por teléfono
--  o WhatsApp directamente, en vez de depender de que el padre regrese
--  a terminar el onboarding.
--
--  La policy de insert de `students` solo permitía account_id = auth.uid()
--  (students_insert_own). La de update ya incluía is_admin() desde el
--  inicio (students_update_own_or_admin) — este cambio deja insert
--  simétrico con eso.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists "students_insert_own" on public.students;

create policy "students_insert_own_or_admin"
  on public.students for insert
  to authenticated
  with check (account_id = auth.uid() or public.is_admin());
