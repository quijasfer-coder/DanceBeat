-- Rediseño de inscripción y pagos:
--   1. La inscripción pasa de ser por CUENTA (profiles.enrolled_at) a ser
--      por ALUMNA (students), con un catálogo de tipos de inscripción con
--      precio distinto (ej. Regular vs Impulse).
--   2. payments gana student_id (a quién corresponde) y method (con qué
--      se pagó) — antes solo se usaba para inscripción, ahora también
--      para mensualidades.
--   3. book_class valida que la alumna tenga su inscripción pagada.
--
-- profiles.enrolled_at / enrollment_paid_method / enrollment_paid_by NO se
-- borran (quedan como snapshot histórico de cuando la inscripción era por
-- cuenta) pero la aplicación deja de leerlos/escribirlos desde esta migración.

-- ─────────────────────────────────────────────────────────────────────
--  ENROLLMENT_TYPES — catálogo editable (como plans), admin lo gestiona
-- ─────────────────────────────────────────────────────────────────────

create table public.enrollment_types (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[a-z0-9_-]+$'),
  name          text not null,
  price_cents   int not null check (price_cents > 0),
  is_active     boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into public.enrollment_types (code, name, price_cents, display_order)
values ('regular', 'Regular', 350000, 1)
on conflict (code) do nothing;

alter table public.enrollment_types enable row level security;

create policy "enrollment_types_select_all"
  on public.enrollment_types for select
  to authenticated
  using (true);

create policy "enrollment_types_admin_insert"
  on public.enrollment_types for insert
  to authenticated
  with check (public.is_admin());

create policy "enrollment_types_admin_update"
  on public.enrollment_types for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "enrollment_types_admin_delete"
  on public.enrollment_types for delete
  to authenticated
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
--  STUDENTS — inscripción por alumna
-- ─────────────────────────────────────────────────────────────────────

alter table public.students
  add column enrollment_type_id      uuid references public.enrollment_types(id) on delete set null,
  add column enrolled_at             timestamptz,
  add column enrollment_paid_method  text,
  add column enrollment_paid_by      uuid references public.profiles(id);

comment on column public.students.enrolled_at is
  'Timestamp del pago de inscripción de ESTA alumna (antes vivía en profiles, una por cuenta).';

-- Backfill: cada alumna hereda el estado de inscripción actual de su
-- cuenta, con el tipo "regular" (único tipo que existía antes de esto).
update public.students s
set enrollment_type_id     = (select id from public.enrollment_types where code = 'regular'),
    enrolled_at             = p.enrolled_at,
    enrollment_paid_method  = p.enrollment_paid_method,
    enrollment_paid_by      = p.enrollment_paid_by
from public.profiles p
where s.account_id = p.id
  and p.enrolled_at is not null;

-- ─────────────────────────────────────────────────────────────────────
--  PAYMENTS — ligar a la alumna + guardar método
-- ─────────────────────────────────────────────────────────────────────

alter table public.payments
  add column student_id uuid references public.students(id) on delete set null,
  add column method text check (method in ('cash', 'transfer', 'tpv', 'stripe'));

comment on column public.payments.student_id is
  'A qué alumna corresponde este pago. Nulo en pagos históricos de cuentas con más de un alumno (no se puede saber a cuál de los hermanos correspondía).';

-- Backfill de student_id: solo para cuentas con exactamente 1 alumna
-- (ahí no hay ambigüedad de a cuál de los hermanos corresponde el pago).
update public.payments pay
set student_id = only_child.id
from (
  select account_id, min(id::text)::uuid as id
  from public.students
  group by account_id
  having count(*) = 1
) only_child
where pay.account_id = only_child.account_id
  and pay.student_id is null;

-- Backfill de method para los pagos de inscripción ya existentes, desde
-- el profile (donde vivía antes).
update public.payments pay
set method = case p.enrollment_paid_method
               when 'cash' then 'cash'
               when 'transfer' then 'transfer'
               else null
             end
from public.profiles p
where pay.account_id = p.id
  and pay.kind = 'enrollment'
  and pay.method is null;

-- Los admins pueden registrar pagos directo desde la app (antes solo
-- servía para el RPC mark_enrollment_paid vía security definer).
-- Necesario para el flujo nuevo de "renovar suscripción + cobrar".
drop policy if exists "payments_admin_insert" on public.payments;
create policy "payments_admin_insert"
  on public.payments for insert
  to authenticated
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
--  MARK_ENROLLMENT_PAID — reescrita para operar por alumna, no por cuenta
-- ─────────────────────────────────────────────────────────────────────

-- create or replace no permite cambiar el tipo de retorno (antes
-- devolvía public.profiles, ahora public.students) — hay que dropearla.
drop function if exists public.mark_enrollment_paid(uuid, text);

create function public.mark_enrollment_paid(
  p_student_id uuid,
  p_method     text
)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_student public.students%rowtype;
  v_amount  int;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'P0001';
  end if;

  select * into v_student from public.students where id = p_student_id;
  if not found then
    raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  select price_cents into v_amount
    from public.enrollment_types
   where id = v_student.enrollment_type_id;

  if v_amount is null then
    raise exception 'NO_ENROLLMENT_TYPE' using errcode = 'P0001';
  end if;

  insert into public.payments
    (account_id, student_id, amount_cents, kind, status, method, paid_at)
  values
    (v_student.account_id, p_student_id, v_amount, 'enrollment', 'succeeded', p_method, now());

  update public.students
     set enrolled_at            = now(),
         enrollment_paid_method = p_method,
         enrollment_paid_by     = v_user
   where id = p_student_id
   returning * into v_student;

  return v_student;
end;
$$;

revoke all on function public.mark_enrollment_paid(uuid, text) from public;
grant execute on function public.mark_enrollment_paid(uuid, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
--  BOOK_CLASS — ahora también exige que la alumna tenga su inscripción
--  pagada (antes de esta migración, el gate de inscripción era por
--  cuenta y bloqueaba llegar hasta acá; ahora una hermana inscrita
--  puede reservar aunque otra no, así que hace falta este chequeo aquí).
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.book_class(
  p_session_id uuid,
  p_student_id uuid
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user             uuid := auth.uid();
  v_student          public.students%rowtype;
  v_session          public.class_sessions%rowtype;
  v_subscription     public.subscriptions%rowtype;
  v_capacity         int;
  v_existing         uuid;
  v_new_booking      public.bookings%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  -- Validar student y propiedad
  select * into v_student from public.students where id = p_student_id;
  if not found then
    raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_student.account_id <> v_user and not public.is_admin() then
    raise exception 'NOT_OWNER' using errcode = 'P0001';
  end if;
  if v_student.enrolled_at is null then
    raise exception 'ENROLLMENT_REQUIRED' using errcode = 'P0001';
  end if;

  -- Lock + cargar sesión
  select * into v_session
    from public.class_sessions
    where id = p_session_id
    for update;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_session.status <> 'scheduled' then
    raise exception 'SESSION_NOT_BOOKABLE' using errcode = 'P0001';
  end if;
  if v_session.starts_at <= now() then
    raise exception 'SESSION_PAST' using errcode = 'P0001';
  end if;

  -- Capacidad efectiva (override gana sobre default de la clase)
  v_capacity := coalesce(
    v_session.capacity_override,
    (select capacity from public.classes where id = v_session.class_id)
  );
  if v_session.seats_taken >= v_capacity then
    raise exception 'CLASS_FULL' using errcode = 'P0001';
  end if;

  -- Sin reserva activa previa
  select id into v_existing
    from public.bookings
    where student_id = p_student_id
      and session_id = p_session_id
      and status in ('confirmed', 'attended');
  if v_existing is not null then
    raise exception 'ALREADY_BOOKED' using errcode = 'P0001';
  end if;

  -- Suscripción activa con créditos
  select * into v_subscription
    from public.subscriptions
    where student_id = p_student_id and status = 'active'
    for update;
  if not found then
    raise exception 'NO_SUBSCRIPTION' using errcode = 'P0001';
  end if;
  if v_subscription.credits_remaining <= 0 then
    raise exception 'NO_CREDITS' using errcode = 'P0001';
  end if;

  -- Insertar booking
  insert into public.bookings (student_id, session_id, status)
       values (p_student_id, p_session_id, 'confirmed')
    returning * into v_new_booking;

  -- Decrementar créditos
  update public.subscriptions
     set credits_remaining = credits_remaining - 1
   where id = v_subscription.id;

  -- Incrementar cupos tomados
  update public.class_sessions
     set seats_taken = seats_taken + 1
   where id = p_session_id;

  return v_new_booking;
end;
$$;

comment on function public.book_class is
  'Reserva atómica: valida inscripción + cupo + créditos + ventana de tiempo, inserta booking, decrementa créditos.';
