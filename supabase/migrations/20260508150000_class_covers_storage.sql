-- ─────────────────────────────────────────────────────────────────────
--  Dance Beat Academy — Storage bucket para portadas de clases
-- ─────────────────────────────────────────────────────────────────────
--  Bucket público (cualquiera puede leer) pero solo admins pueden
--  escribir/borrar. Las URLs resultantes son del tipo
--  https://<project>.supabase.co/storage/v1/object/public/class-covers/<path>
--  next.config.ts ya tiene *.supabase.co como remotePattern, así que
--  Image de Next puede optimizarlas.
-- ─────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('class-covers', 'class-covers', true)
on conflict (id) do nothing;

-- Limpiar policies previas (idempotente)
drop policy if exists "class-covers_public_read"   on storage.objects;
drop policy if exists "class-covers_admin_insert"  on storage.objects;
drop policy if exists "class-covers_admin_update"  on storage.objects;
drop policy if exists "class-covers_admin_delete"  on storage.objects;

create policy "class-covers_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'class-covers');

create policy "class-covers_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'class-covers' and public.is_admin());

create policy "class-covers_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'class-covers' and public.is_admin())
  with check (bucket_id = 'class-covers' and public.is_admin());

create policy "class-covers_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'class-covers' and public.is_admin());
