-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Perfil propio del coreógrafo
--  Migración 0030
--
--  Hasta ahora solo el admin podía editar la fila de `teachers` (nombre,
--  foto). Esta migración deja que cada coreógrafa edite SU PROPIO
--  registro desde /profesor/perfil: nombre, foto y contacto de
--  emergencia (campos nuevos).
-- ════════════════════════════════════════════════════════════════════

alter table public.teachers
  add column if not exists emergency_contact_name  text,
  add column if not exists emergency_contact_phone  text;

comment on column public.teachers.emergency_contact_name is
  'A quién contactar en caso de emergencia durante una clase. Lo captura la propia coreógrafa.';
comment on column public.teachers.emergency_contact_phone is
  'Teléfono del contacto de emergencia.';

-- ─────────────────────────────────────────────────────────────────────
--  RLS: una coreógrafa puede ver/editar su propia fila (además de la
--  lectura pública ya existente y el acceso total de admin).
-- ─────────────────────────────────────────────────────────────────────

create policy "teachers_select_own"
  on public.teachers for select
  to authenticated
  using (profile_id = auth.uid());

create policy "teachers_update_own"
  on public.teachers for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
--  Bucket público para fotos de perfil de coreógrafos — mismo patrón
--  que student-photos: es solo una foto de reconocimiento, no un
--  documento sensible.
-- ─────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('teacher-photos', 'teacher-photos', true)
on conflict (id) do nothing;

drop policy if exists "teacher-photos_public_read" on storage.objects;
drop policy if exists "teacher-photos_authenticated_insert" on storage.objects;
drop policy if exists "teacher-photos_authenticated_update" on storage.objects;
drop policy if exists "teacher-photos_authenticated_delete" on storage.objects;

create policy "teacher-photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'teacher-photos');

create policy "teacher-photos_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'teacher-photos');

create policy "teacher-photos_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'teacher-photos')
  with check (bucket_id = 'teacher-photos');

create policy "teacher-photos_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'teacher-photos');
