-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Galería de álbumes (Drive) + Audiciones IMPULSE
--  Migración 0011
--
--  · gallery_albums: cada álbum tiene portada, fecha, descripción y un
--    link externo (Drive/YouTube/etc). Solo logueadas pueden verlos.
--  · audition_applications: form público para aplicar a IMPULSE. Insert
--    desde anon o authenticated; admin gestiona.
--  · settings: keys nuevas para abrir/cerrar el periodo de audiciones.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  GALLERY_ALBUMS
-- ─────────────────────────────────────────────────────────────────────

create table public.gallery_albums (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  event_date    date,
  cover_url     text,        -- imagen de portada (URL externa)
  drive_url     text not null, -- link al folder/album externo (Drive, YT, etc.)
  is_published  boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index gallery_albums_event_date_idx on public.gallery_albums(event_date);
create index gallery_albums_published_idx
  on public.gallery_albums(is_published) where is_published = true;

create trigger set_updated_at_gallery_albums
  before update on public.gallery_albums
  for each row execute function public.set_updated_at();

alter table public.gallery_albums enable row level security;

-- Logueadas (cualquier rol) pueden ver álbumes publicados; admin ve todo.
create policy "gallery_albums_select_authenticated"
  on public.gallery_albums for select
  to authenticated
  using (is_published = true or public.is_admin());

create policy "gallery_albums_admin_all"
  on public.gallery_albums for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.gallery_albums to authenticated;

-- ─────────────────────────────────────────────────────────────────────
--  AUDITION_APPLICATIONS — form público de IMPULSE
-- ─────────────────────────────────────────────────────────────────────

create type public.audition_status as enum (
  'received',   -- recién enviada
  'reviewing',  -- en revisión
  'shortlist',  -- preseleccionada (segunda ronda)
  'accepted',   -- aceptada
  'rejected',   -- no aceptada
  'withdrawn'   -- retirada por la persona
);

create table public.audition_applications (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  age             int check (age is null or (age >= 5 and age <= 99)),
  email           text not null,
  phone           text not null,
  experience      text,        -- experiencia previa
  video_url       text,        -- link a video
  why_impulse     text,        -- por qué quiere entrar
  styles          text,        -- estilos que domina
  status          audition_status not null default 'received',
  notes           text,        -- notas internas del admin
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index audition_apps_status_idx on public.audition_applications(status);
create index audition_apps_created_idx on public.audition_applications(created_at desc);

create trigger set_updated_at_audition_apps
  before update on public.audition_applications
  for each row execute function public.set_updated_at();

alter table public.audition_applications enable row level security;

-- Cualquiera (anon o logueada) puede ENVIAR una aplicación.
create policy "audition_apps_insert_public"
  on public.audition_applications for insert
  to anon, authenticated
  with check (true);

-- Solo admin lee, actualiza, borra.
create policy "audition_apps_admin_select"
  on public.audition_applications for select
  to authenticated
  using (public.is_admin());

create policy "audition_apps_admin_update"
  on public.audition_applications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "audition_apps_admin_delete"
  on public.audition_applications for delete
  to authenticated
  using (public.is_admin());

grant insert on public.audition_applications to anon, authenticated;
grant select, update, delete on public.audition_applications to authenticated;

-- ─────────────────────────────────────────────────────────────────────
--  SETTINGS — periodo de audiciones
-- ─────────────────────────────────────────────────────────────────────

insert into public.settings (key, value, description) values
  ('impulse_auditions_open', 'false',
   'Si "true", el form de audiciones acepta aplicaciones nuevas en /impulse.'),
  ('impulse_auditions_message', 'Las audiciones para IMPULSE no están abiertas en este momento. Síguenos para enterarte de la próxima convocatoria.',
   'Mensaje que se muestra cuando las audiciones están cerradas.')
on conflict (key) do nothing;

-- Permitir lectura pública de las dos keys nuevas (la página /impulse
-- las lee sin login para decidir si mostrar el form).
drop policy if exists "settings_public_read_certain_keys" on public.settings;

create policy "settings_public_read_certain_keys"
  on public.settings for select
  to anon, authenticated
  using (
    key in (
      'cancel_window_hours',
      'enrollment_fee_cents',
      'late_fee_pct',
      'late_fee_day_of_month',
      'impulse_auditions_open',
      'impulse_auditions_message'
    )
  );
