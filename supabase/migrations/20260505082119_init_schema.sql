-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Schema inicial
--  Migración 0001
--
--  Esta migración crea la estructura completa de tablas, índices y
--  triggers básicos. NO incluye RLS, funciones de negocio ni seed data
--  (esos van en migraciones 0002, 0003, 0004 respectivamente).
--
--  Modelo conceptual:
--   · profiles    = titular de la cuenta (1 por auth.user)
--   · students    = quien efectivamente toma clases (N por profile)
--   · subscriptions, bookings → ligados a STUDENT, no a profile
--   · classes     = plantilla recurrente (lunes 7:30 PM)
--   · sessions    = instancia concreta (lunes 12 mayo, 7:30 PM)
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────────────────────────────────

create type user_role as enum ('student', 'teacher', 'admin');
create type dance_level as enum ('principiante', 'intermedio', 'avanzado', 'abierto');
create type plan_code as enum ('single_beat', 'pulse', 'rhythm', 'groove', 'flow', 'stage');
create type subscription_status as enum ('active', 'past_due', 'cancelled', 'paused');
create type session_status as enum ('scheduled', 'cancelled', 'completed');
create type booking_status as enum ('confirmed', 'cancelled', 'cancelled_late', 'attended', 'no_show');
create type payment_kind as enum ('enrollment', 'monthly', 'drop_in', 'late_fee', 'refund');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

-- ─────────────────────────────────────────────────────────────────────
--  PROFILES — extiende auth.users de Supabase
-- ─────────────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  phone       text,
  role        user_role not null default 'student',
  enrolled_at timestamptz, -- cuando se pagó la inscripción única
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Titular de la cuenta. 1:1 con auth.users.';
comment on column public.profiles.enrolled_at is 'Timestamp del pago de inscripción ($1,600). Null = aún no inscrito.';

-- ─────────────────────────────────────────────────────────────────────
--  STUDENTS — los que efectivamente toman clases
-- ─────────────────────────────────────────────────────────────────────

create table public.students (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references public.profiles(id) on delete cascade,
  full_name    text not null,
  birthdate    date not null,
  phone        text,
  school       text,
  grade        text,
  photo_url    text,
  is_self      boolean not null default false,
  notes        text, -- alergias, condiciones médicas, etc.
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.students.is_self is
  'true cuando el alumno es la misma persona que el titular de la cuenta (caso adulto auto-inscrito).';
comment on column public.students.notes is
  'Información médica relevante (alergias, lesiones, etc.).';

create index students_account_id_idx on public.students(account_id);
create index students_birthdate_idx on public.students(birthdate);

-- ─────────────────────────────────────────────────────────────────────
--  STUDIOS — sucursales
-- ─────────────────────────────────────────────────────────────────────

create table public.studios (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  address       text,
  neighborhood  text,
  zip           text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
--  STYLES — catálogo de estilos de baile
-- ─────────────────────────────────────────────────────────────────────

create table public.styles (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  tagline        text,
  description    text,
  cover_url      text,
  age_range      text,
  duration_min   int not null default 60,
  is_active      boolean not null default true,
  display_order  int not null default 0,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
--  TEACHERS — profesores. profile_id es opcional por ahora.
--  En fase 2 (perfiles públicos), agregamos columnas de bio pública.
-- ─────────────────────────────────────────────────────────────────────

create table public.teachers (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid unique references public.profiles(id) on delete set null,
  full_name    text not null,
  bio_internal text, -- visible solo a admin
  photo_url    text,
  is_active    boolean not null default true,
  hire_date    date,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
--  CLASSES — plantilla recurrente
--  "Heels los martes 7:30 PM en Cumbres con 12 cupos"
-- ─────────────────────────────────────────────────────────────────────

create table public.classes (
  id               uuid primary key default gen_random_uuid(),
  style_id         uuid not null references public.styles(id) on delete restrict,
  teacher_id       uuid references public.teachers(id) on delete set null,
  studio_id        uuid not null references public.studios(id) on delete restrict,
  day_of_week      smallint not null check (day_of_week >= 0 and day_of_week <= 6),
  starts_at_time   time not null,
  duration_min     int not null default 60,
  level            dance_level not null default 'abierto',
  capacity         int not null check (capacity > 0),
  age_min          int,
  age_max          int,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.classes.day_of_week is '0=Domingo, 1=Lunes, ... 6=Sábado';

create index classes_style_id_idx on public.classes(style_id);
create index classes_studio_id_idx on public.classes(studio_id);
create index classes_teacher_id_idx on public.classes(teacher_id);
create index classes_active_idx on public.classes(is_active) where is_active = true;

-- ─────────────────────────────────────────────────────────────────────
--  CLASS SESSIONS — instancia concreta dateada
--  Las generará un cron semanalmente a partir de classes
-- ─────────────────────────────────────────────────────────────────────

create table public.class_sessions (
  id                  uuid primary key default gen_random_uuid(),
  class_id            uuid not null references public.classes(id) on delete cascade,
  session_date        date not null,
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  capacity_override   int check (capacity_override is null or capacity_override > 0),
  seats_taken         int not null default 0 check (seats_taken >= 0),
  status              session_status not null default 'scheduled',
  cancellation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (class_id, session_date)
);

create index class_sessions_starts_at_idx on public.class_sessions(starts_at);
create index class_sessions_class_id_idx on public.class_sessions(class_id);
create index class_sessions_upcoming_idx
  on public.class_sessions(starts_at)
  where status = 'scheduled';

-- ─────────────────────────────────────────────────────────────────────
--  PLANS — los 6 tiers (Single Beat → Stage)
-- ─────────────────────────────────────────────────────────────────────

create table public.plans (
  id                  uuid primary key default gen_random_uuid(),
  code                plan_code not null unique,
  name                text not null,
  tagline             text,
  price_cents         int not null check (price_cents > 0),
  cadence             text not null default '/mes',
  classes_per_week    int,
  credits_per_month   int,
  perks               jsonb not null default '[]',
  is_active           boolean not null default true,
  display_order       int not null default 0,
  stripe_price_id     text unique, -- se llenará al integrar Stripe
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
--  SUBSCRIPTIONS — una por alumno (no por cuenta)
--  Mamá con 2 hijos en la academia → 2 subscriptions
-- ─────────────────────────────────────────────────────────────────────

create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  student_id               uuid not null references public.students(id) on delete cascade,
  plan_id                  uuid not null references public.plans(id) on delete restrict,
  status                   subscription_status not null default 'active',
  cycle_start_at           timestamptz not null,
  cycle_end_at             timestamptz not null,
  credits_total            int not null default 0,
  credits_remaining        int not null default 0 check (credits_remaining >= 0),
  stripe_subscription_id   text unique,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index subscriptions_student_id_idx on public.subscriptions(student_id);

-- Solo una suscripción activa por alumno a la vez
create unique index subscriptions_one_active_per_student
  on public.subscriptions(student_id)
  where status = 'active';

-- ─────────────────────────────────────────────────────────────────────
--  BOOKINGS — reservas de clase
-- ─────────────────────────────────────────────────────────────────────

create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.students(id) on delete cascade,
  session_id        uuid not null references public.class_sessions(id) on delete cascade,
  status            booking_status not null default 'confirmed',
  credit_returned   boolean not null default false,
  booked_at         timestamptz not null default now(),
  cancelled_at      timestamptz,
  attended_at       timestamptz,
  attended_by       uuid references public.profiles(id) on delete set null,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index bookings_session_id_idx on public.bookings(session_id);
create index bookings_student_id_idx on public.bookings(student_id);

-- Un alumno solo puede tener una reserva activa por sesión
create unique index bookings_unique_active
  on public.bookings(student_id, session_id)
  where status in ('confirmed', 'attended');

-- ─────────────────────────────────────────────────────────────────────
--  WAITLIST
-- ─────────────────────────────────────────────────────────────────────

create table public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students(id) on delete cascade,
  session_id    uuid not null references public.class_sessions(id) on delete cascade,
  position      int not null check (position > 0),
  joined_at     timestamptz not null default now(),
  promoted_at   timestamptz,

  unique (student_id, session_id)
);

create index waitlist_session_position_idx on public.waitlist(session_id, position);

-- ─────────────────────────────────────────────────────────────────────
--  PAYMENTS — registro de cobros (espejo de Stripe)
-- ─────────────────────────────────────────────────────────────────────

create table public.payments (
  id                          uuid primary key default gen_random_uuid(),
  account_id                  uuid not null references public.profiles(id) on delete restrict,
  subscription_id             uuid references public.subscriptions(id) on delete set null,
  kind                        payment_kind not null,
  amount_cents                int not null,
  currency                    text not null default 'MXN',
  status                      payment_status not null default 'pending',
  stripe_payment_intent_id    text unique,
  paid_at                     timestamptz,
  failure_reason              text,
  created_at                  timestamptz not null default now()
);

create index payments_account_id_idx on public.payments(account_id);
create index payments_subscription_id_idx on public.payments(subscription_id);

-- ─────────────────────────────────────────────────────────────────────
--  SETTINGS — configuración key-value
--  Para constantes editables sin redeploy: cancel_window_hours, etc.
-- ─────────────────────────────────────────────────────────────────────

create table public.settings (
  key          text primary key,
  value        text not null,
  description  text,
  updated_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
--  TRIGGERS — auto-actualizar updated_at
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_students
  before update on public.students
  for each row execute function public.set_updated_at();

create trigger set_updated_at_classes
  before update on public.classes
  for each row execute function public.set_updated_at();

create trigger set_updated_at_class_sessions
  before update on public.class_sessions
  for each row execute function public.set_updated_at();

create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger set_updated_at_bookings
  before update on public.bookings
  for each row execute function public.set_updated_at();
