-- Bucket privado para documentos sensibles de alumnos (CURP, etc.).
-- A diferencia de class-covers, este bucket NO es público: los archivos
-- solo se sirven vía signed URL, generada por el dueño de la cuenta o un
-- admin. Los objetos se guardan como curp/<account_id>/<archivo>, así que
-- las políticas usan ese segundo segmento de carpeta para validar dueño.

insert into storage.buckets (id, name, public)
values ('student-documents', 'student-documents', false)
on conflict (id) do nothing;

drop policy if exists "student-documents_owner_insert" on storage.objects;
drop policy if exists "student-documents_owner_select" on storage.objects;
drop policy if exists "student-documents_owner_update" on storage.objects;
drop policy if exists "student-documents_owner_delete" on storage.objects;

-- Cada cuenta solo puede subir dentro de su propia carpeta curp/<su account_id>/...
create policy "student-documents_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'student-documents'
    and (storage.foldername(name))[1] = 'curp'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Solo el dueño de la cuenta o un admin pueden leer (necesario para poder
-- generar un signed URL y ver/descargar el archivo).
create policy "student-documents_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-documents'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin())
  );

create policy "student-documents_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'student-documents'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin())
  )
  with check (
    bucket_id = 'student-documents'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin())
  );

create policy "student-documents_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'student-documents'
    and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin())
  );
