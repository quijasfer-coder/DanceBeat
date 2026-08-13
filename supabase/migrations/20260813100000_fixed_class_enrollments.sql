-- Clases fijas asignadas por admin: una alumna queda inscrita de forma
-- permanente a una clase recurrente (ej. "Jazz miércoles"). Cada semana,
-- cuando se generan las sesiones fechadas, se le reserva automáticamente
-- (consume 1 crédito, igual que una reserva normal) y NO se puede
-- cancelar desde el portal — solo el admin puede quitarla, desasignando
-- la clase fija completa.

-- ─────────────────────────────────────────────────────────────────────
--  CLASS_ENROLLMENTS — alumna ↔ clase recurrente fija
-- ─────────────────────────────────────────────────────────────────────

create table public.class_enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id) on delete set null,
  unique (student_id, class_id)
);

create index class_enrollments_student_id_idx on public.class_enrollments(student_id);
create index class_enrollments_class_id_idx on public.class_enrollments(class_id);

alter table public.class_enrollments enable row level security;

create policy "class_enrollments_select_own_or_staff"
  on public.class_enrollments for select
  to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.students s
      where s.id = class_enrollments.student_id and s.account_id = auth.uid()
    )
  );

create policy "class_enrollments_admin_write"
  on public.class_enrollments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.class_enrollments to authenticated;
grant insert, update, delete on public.class_enrollments to authenticated;
grant select, insert, update, delete on public.class_enrollments to service_role;

-- ─────────────────────────────────────────────────────────────────────
--  BOOKINGS — marca si una reserva viene de una clase fija
-- ─────────────────────────────────────────────────────────────────────

alter table public.bookings
  add column is_fixed boolean not null default false;

comment on column public.bookings.is_fixed is
  'true si la reserva se creó automáticamente por una clase fija asignada desde admin (class_enrollments) — no se puede cancelar desde el portal.';

-- ─────────────────────────────────────────────────────────────────────
--  ENSURE_CLASS_SESSIONS — ahora también auto-reserva a las alumnas con
--  esta clase marcada como fija, para cada sesión nueva que genera.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.ensure_class_sessions(
  p_class_id     uuid,
  p_weeks_ahead  int default 4
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user          uuid := auth.uid();
  v_class         public.classes%rowtype;
  v_today         date := (now() at time zone 'America/Mexico_City')::date;
  v_first_date    date;
  v_end_date      date;
  v_count         int := 0;
  v_new_session   public.class_sessions%rowtype;
  v_enr           record;
  v_sub           public.subscriptions%rowtype;
  v_capacity      int;
  v_seats_taken   int;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  select * into v_class from public.classes where id = p_class_id;
  if not found then
    raise exception 'CLASS_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- permiso: admin o profesor de la clase
  if not (
    public.is_admin()
    or exists (
      select 1 from public.teachers t
      where t.id = v_class.teacher_id and t.profile_id = v_user
    )
  ) then
    raise exception 'NOT_AUTHORIZED' using errcode = 'P0001';
  end if;

  if p_weeks_ahead is null or p_weeks_ahead < 1 then
    p_weeks_ahead := 4;
  end if;
  if p_weeks_ahead > 26 then
    p_weeks_ahead := 26;
  end if;

  -- primera fecha >= hoy con day_of_week = clase.day_of_week
  v_first_date := v_today
    + ((v_class.day_of_week - extract(dow from v_today)::int + 7) % 7);
  v_end_date := v_today + (p_weeks_ahead * 7);

  for v_new_session in
    insert into public.class_sessions
      (class_id, session_date, starts_at, ends_at, status)
    select
      v_class.id,
      d::date,
      ((d::date::text || ' ' || v_class.starts_at_time::text)::timestamp
        at time zone 'America/Mexico_City'),
      ((d::date::text || ' ' || v_class.starts_at_time::text)::timestamp
        at time zone 'America/Mexico_City')
        + (v_class.duration_min || ' minutes')::interval,
      'scheduled'::public.session_status
    from generate_series(
      v_first_date::timestamp,
      v_end_date::timestamp,
      '7 days'::interval
    ) as d
    on conflict (class_id, session_date) do nothing
    returning *
  loop
    v_count := v_count + 1;

    for v_enr in
      select student_id from public.class_enrollments where class_id = p_class_id
    loop
      -- alumna con inscripción pagada
      if not exists (
        select 1 from public.students
        where id = v_enr.student_id and enrolled_at is not null
      ) then
        continue;
      end if;

      -- suscripción activa con créditos
      select * into v_sub
        from public.subscriptions
        where student_id = v_enr.student_id and status = 'active'
        for update;
      if not found or v_sub.credits_remaining <= 0 then
        continue;
      end if;

      -- capacidad (lock de la sesión — seats_taken cambia dentro del loop)
      select seats_taken, coalesce(capacity_override, v_class.capacity)
        into v_seats_taken, v_capacity
        from public.class_sessions
        where id = v_new_session.id
        for update;
      if v_seats_taken >= v_capacity then
        continue;
      end if;

      insert into public.bookings (student_id, session_id, status, is_fixed)
      values (v_enr.student_id, v_new_session.id, 'confirmed', true);

      update public.subscriptions
         set credits_remaining = credits_remaining - 1
       where id = v_sub.id;

      update public.class_sessions
         set seats_taken = seats_taken + 1
       where id = v_new_session.id;
    end loop;
  end loop;

  return v_count;
end;
$$;

comment on function public.ensure_class_sessions is
  'Genera sesiones fechadas hasta p_weeks_ahead semanas y auto-reserva a las alumnas con esta clase fija asignada (class_enrollments), consumiendo crédito igual que una reserva normal.';

-- ─────────────────────────────────────────────────────────────────────
--  CANCEL_BOOKING — ya no permite cancelar reservas de clase fija
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user           uuid := auth.uid();
  v_booking        public.bookings%rowtype;
  v_session        public.class_sessions%rowtype;
  v_student        public.students%rowtype;
  v_window_hours   int;
  v_is_late        boolean;
  v_new_status     public.booking_status;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_student from public.students where id = v_booking.student_id;
  if v_student.account_id <> v_user and not public.is_admin() then
    raise exception 'NOT_OWNER' using errcode = 'P0001';
  end if;

  if v_booking.is_fixed then
    raise exception 'FIXED_BOOKING_NOT_CANCELLABLE' using errcode = 'P0001';
  end if;

  if v_booking.status <> 'confirmed' then
    raise exception 'NOT_CANCELLABLE' using errcode = 'P0001';
  end if;

  select * into v_session
    from public.class_sessions
    where id = v_booking.session_id
    for update;
  if v_session.starts_at <= now() then
    raise exception 'SESSION_PAST' using errcode = 'P0001';
  end if;

  v_window_hours := coalesce(public.get_setting('cancel_window_hours', '12')::int, 12);
  v_is_late := (v_session.starts_at - now()) < (v_window_hours::text || ' hours')::interval;
  v_new_status := case when v_is_late then 'cancelled_late'::public.booking_status
                                       else 'cancelled'::public.booking_status end;

  update public.bookings
     set status          = v_new_status,
         cancelled_at    = now(),
         credit_returned = (not v_is_late)
   where id = p_booking_id
   returning * into v_booking;

  if not v_is_late then
    update public.subscriptions
       set credits_remaining = credits_remaining + 1
     where student_id = v_booking.student_id and status = 'active';
  end if;

  update public.class_sessions
     set seats_taken = greatest(seats_taken - 1, 0)
   where id = v_booking.session_id;

  -- Promover a la lista de espera si alguien calificaba
  perform public.promote_from_waitlist(v_booking.session_id);

  return v_booking;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
--  ASSIGN_FIXED_CLASS — admin asigna una clase fija a una alumna y la
--  reserva de inmediato en las sesiones ya generadas y futuras.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.assign_fixed_class(
  p_student_id uuid,
  p_class_id   uuid
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user         uuid := auth.uid();
  v_class        public.classes%rowtype;
  v_sub          public.subscriptions%rowtype;
  v_session      record;
  v_capacity     int;
  v_seats_taken  int;
  v_booked       int := 0;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'P0001';
  end if;

  select * into v_class from public.classes where id = p_class_id;
  if not found then
    raise exception 'CLASS_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.students where id = p_student_id) then
    raise exception 'STUDENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.class_enrollments (student_id, class_id, created_by)
  values (p_student_id, p_class_id, v_user)
  on conflict (student_id, class_id) do nothing;

  -- Reservar en las sesiones futuras que ya existen (las que se generen
  -- después, las agarra ensure_class_sessions automáticamente).
  for v_session in
    select * from public.class_sessions
    where class_id = p_class_id
      and status = 'scheduled'
      and starts_at > now()
    order by starts_at
    for update
  loop
    if exists (
      select 1 from public.bookings
      where student_id = p_student_id
        and session_id = v_session.id
        and status in ('confirmed', 'attended')
    ) then
      continue;
    end if;

    if not exists (
      select 1 from public.students
      where id = p_student_id and enrolled_at is not null
    ) then
      exit; -- sin inscripción pagada, no tiene caso seguir intentando
    end if;

    select * into v_sub
      from public.subscriptions
      where student_id = p_student_id and status = 'active'
      for update;
    if not found or v_sub.credits_remaining <= 0 then
      continue;
    end if;

    v_capacity := coalesce(v_session.capacity_override, v_class.capacity);
    v_seats_taken := v_session.seats_taken;
    if v_seats_taken >= v_capacity then
      continue;
    end if;

    insert into public.bookings (student_id, session_id, status, is_fixed)
    values (p_student_id, v_session.id, 'confirmed', true);

    update public.subscriptions
       set credits_remaining = credits_remaining - 1
     where id = v_sub.id;

    update public.class_sessions
       set seats_taken = seats_taken + 1
     where id = v_session.id;

    v_booked := v_booked + 1;
  end loop;

  return v_booked;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
--  UNASSIGN_FIXED_CLASS — admin quita la clase fija y cancela (con
--  devolución de crédito) sus reservas futuras de esa clase.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.unassign_fixed_class(
  p_student_id uuid,
  p_class_id   uuid
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_booking   record;
  v_cancelled int := 0;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'P0001';
  end if;

  delete from public.class_enrollments
   where student_id = p_student_id and class_id = p_class_id;

  for v_booking in
    select b.* from public.bookings b
    join public.class_sessions cs on cs.id = b.session_id
    where b.student_id = p_student_id
      and cs.class_id = p_class_id
      and b.is_fixed
      and b.status = 'confirmed'
      and cs.starts_at > now()
    for update of b
  loop
    update public.bookings
       set status = 'cancelled', cancelled_at = now(), credit_returned = true
     where id = v_booking.id;

    update public.subscriptions
       set credits_remaining = credits_remaining + 1
     where student_id = p_student_id and status = 'active';

    update public.class_sessions
       set seats_taken = greatest(seats_taken - 1, 0)
     where id = v_booking.session_id;

    perform public.promote_from_waitlist(v_booking.session_id);

    v_cancelled := v_cancelled + 1;
  end loop;

  return v_cancelled;
end;
$$;

revoke all on function public.assign_fixed_class(uuid, uuid) from public;
grant execute on function public.assign_fixed_class(uuid, uuid) to authenticated;
revoke all on function public.unassign_fixed_class(uuid, uuid) from public;
grant execute on function public.unassign_fixed_class(uuid, uuid) to authenticated;
