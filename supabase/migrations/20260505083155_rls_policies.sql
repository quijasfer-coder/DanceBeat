-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — RLS policies + Auth trigger
--  Migración 0002
--
--  Activa Row-Level Security en todas las tablas, define políticas
--  de acceso por tabla, y crea el trigger que auto-inserta un perfil
--  cuando un usuario nuevo se registra vía Supabase Auth.
--
--  Resumen de modelo de acceso:
--   · Tablas catálogo (studios, styles, plans, classes, teachers): lectura pública
--   · Datos privados (profiles, students, bookings, payments): solo el dueño + staff
--   · Escrituras críticas (subscriptions, payments): solo service_role (Stripe webhook)
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  HELPER FUNCTIONS — security definer para evitar recursión con RLS
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin')
  );
$$;

create or replace function public.owns_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students
    where id = p_student_id and account_id = auth.uid()
  );
$$;

create or replace function public.is_teacher_of_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_sessions cs
    join public.classes c on c.id = cs.class_id
    join public.teachers t on t.id = c.teacher_id
    where cs.id = p_session_id and t.profile_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────
--  ENABLE RLS — explícito en todas las tablas (idempotente)
-- ─────────────────────────────────────────────────────────────────────

alter table public.profiles        enable row level security;
alter table public.students        enable row level security;
alter table public.studios         enable row level security;
alter table public.styles          enable row level security;
alter table public.teachers        enable row level security;
alter table public.classes         enable row level security;
alter table public.class_sessions  enable row level security;
alter table public.plans           enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.bookings        enable row level security;
alter table public.waitlist        enable row level security;
alter table public.payments        enable row level security;
alter table public.settings        enable row level security;

-- ═════════════════════════════════════════════════════════════════════
--  PROFILES
-- ═════════════════════════════════════════════════════════════════════

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- INSERT: vía trigger handle_new_user() que es SECURITY DEFINER.
-- DELETE: cascade desde auth.users.

-- ═════════════════════════════════════════════════════════════════════
--  STUDENTS
-- ═════════════════════════════════════════════════════════════════════

create policy "students_select_own_or_staff"
  on public.students for select
  to authenticated
  using (account_id = auth.uid() or public.is_staff());

create policy "students_insert_own"
  on public.students for insert
  to authenticated
  with check (account_id = auth.uid());

create policy "students_update_own_or_admin"
  on public.students for update
  to authenticated
  using (account_id = auth.uid() or public.is_admin())
  with check (account_id = auth.uid() or public.is_admin());

create policy "students_delete_own_or_admin"
  on public.students for delete
  to authenticated
  using (account_id = auth.uid() or public.is_admin());

-- ═════════════════════════════════════════════════════════════════════
--  CATÁLOGOS PÚBLICOS — studios, styles, plans, teachers, classes
--  Patrón común: lectura para anon + authenticated, escritura solo admin
-- ═════════════════════════════════════════════════════════════════════

-- studios
create policy "studios_public_read"
  on public.studios for select
  to anon, authenticated
  using (is_active = true);

create policy "studios_admin_all"
  on public.studios for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- styles
create policy "styles_public_read"
  on public.styles for select
  to anon, authenticated
  using (is_active = true);

create policy "styles_admin_all"
  on public.styles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- plans
create policy "plans_public_read"
  on public.plans for select
  to anon, authenticated
  using (is_active = true);

create policy "plans_admin_all"
  on public.plans for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- teachers
create policy "teachers_public_read"
  on public.teachers for select
  to anon, authenticated
  using (is_active = true);

create policy "teachers_admin_all"
  on public.teachers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- classes
create policy "classes_public_read"
  on public.classes for select
  to anon, authenticated
  using (is_active = true);

create policy "classes_admin_all"
  on public.classes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═════════════════════════════════════════════════════════════════════
--  CLASS SESSIONS
--  Lectura pública de sesiones programadas; escritura admin + profesor
-- ═════════════════════════════════════════════════════════════════════

create policy "class_sessions_public_read"
  on public.class_sessions for select
  to anon, authenticated
  using (status = 'scheduled' or public.is_staff());

create policy "class_sessions_admin_insert"
  on public.class_sessions for insert
  to authenticated
  with check (public.is_admin());

create policy "class_sessions_teacher_or_admin_update"
  on public.class_sessions for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.classes c
      join public.teachers t on t.id = c.teacher_id
      where c.id = class_sessions.class_id and t.profile_id = auth.uid()
    )
  );

create policy "class_sessions_admin_delete"
  on public.class_sessions for delete
  to authenticated
  using (public.is_admin());

-- ═════════════════════════════════════════════════════════════════════
--  SUBSCRIPTIONS
--  Read: titular + staff. Write: solo service_role (Stripe webhooks)
-- ═════════════════════════════════════════════════════════════════════

create policy "subscriptions_select_own_or_staff"
  on public.subscriptions for select
  to authenticated
  using (public.owns_student(student_id) or public.is_staff());

-- INSERT/UPDATE/DELETE: sin policies = solo service_role puede escribir.
-- Esto fuerza que las suscripciones se creen vía webhook de Stripe o RPC.

-- ═════════════════════════════════════════════════════════════════════
--  BOOKINGS
--  Read: titular + profesor de la clase + admin
--  Insert: titular (validado adicionalmente por book_class function)
--  Update: titular puede cancelar; profesor marca asistencia
--  Delete: solo admin
-- ═════════════════════════════════════════════════════════════════════

create policy "bookings_select_visible"
  on public.bookings for select
  to authenticated
  using (
    public.owns_student(student_id)
    or public.is_admin()
    or public.is_teacher_of_session(session_id)
  );

create policy "bookings_insert_own_student"
  on public.bookings for insert
  to authenticated
  with check (public.owns_student(student_id));

create policy "bookings_update_visible"
  on public.bookings for update
  to authenticated
  using (
    public.owns_student(student_id)
    or public.is_admin()
    or public.is_teacher_of_session(session_id)
  );

create policy "bookings_delete_admin"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());

-- ═════════════════════════════════════════════════════════════════════
--  WAITLIST
-- ═════════════════════════════════════════════════════════════════════

create policy "waitlist_select_own_or_staff"
  on public.waitlist for select
  to authenticated
  using (public.owns_student(student_id) or public.is_staff());

create policy "waitlist_insert_own_student"
  on public.waitlist for insert
  to authenticated
  with check (public.owns_student(student_id));

create policy "waitlist_delete_own_or_admin"
  on public.waitlist for delete
  to authenticated
  using (public.owns_student(student_id) or public.is_admin());

-- ═════════════════════════════════════════════════════════════════════
--  PAYMENTS
--  Read: titular + admin. Write: solo service_role (Stripe webhooks)
-- ═════════════════════════════════════════════════════════════════════

create policy "payments_select_own_or_admin"
  on public.payments for select
  to authenticated
  using (account_id = auth.uid() or public.is_admin());

-- ═════════════════════════════════════════════════════════════════════
--  SETTINGS
--  Algunas keys son públicas (cancel_window_hours, etc.); resto solo admin.
-- ═════════════════════════════════════════════════════════════════════

create policy "settings_admin_all"
  on public.settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "settings_public_read_certain_keys"
  on public.settings for select
  to anon, authenticated
  using (
    key in (
      'cancel_window_hours',
      'enrollment_fee_cents',
      'late_fee_pct',
      'late_fee_day_of_month'
    )
  );

-- ═════════════════════════════════════════════════════════════════════
--  AUTH TRIGGER — auto-crear profile al registrarse
--  Cuando alguien hace signUp(), Supabase crea una fila en auth.users.
--  Este trigger inserta el profile correspondiente leyendo metadata
--  pasada en signUp({ options: { data: { full_name, phone } } }).
-- ═════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
