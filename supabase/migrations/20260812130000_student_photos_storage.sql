-- Bucket público para fotos de perfil de alumnos (distinto del bucket
-- privado student-documents usado para la CURP). Es público como
-- class-covers porque los profesores/admin necesitan verla en muchas
-- listas sin pedir signed URL en cada una — es solo una foto de
-- reconocimiento, no un documento sensible.

insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

drop policy if exists "student-photos_public_read" on storage.objects;
drop policy if exists "student-photos_authenticated_insert" on storage.objects;
drop policy if exists "student-photos_authenticated_update" on storage.objects;
drop policy if exists "student-photos_authenticated_delete" on storage.objects;

create policy "student-photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'student-photos');

-- Cualquier usuario autenticado puede subir (los papás suben la foto de
-- su hija durante el onboarding, no solo el admin).
create policy "student-photos_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'student-photos');

create policy "student-photos_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'student-photos')
  with check (bucket_id = 'student-photos');

create policy "student-photos_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'student-photos');
