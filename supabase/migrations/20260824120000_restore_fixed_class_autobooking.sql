-- ════════════════════════════════════════════════════════════════════
--  Restaura el auto-reservado de alumnas con clase fija (class_enrollments)
--  al generar sesiones — se perdió en la migración 0029
--  (20260818200000_auto_generate_sessions.sql), que extrajo la creación
--  de fechas a `_generate_class_sessions` pero NO se llevó el loop que
--  reservaba a las alumnas fijas. Desde entonces ni el botón manual
--  "Generar" del profesor ni el cron diario reservan a las alumnas ya
--  asignadas — el pase de lista aparece vacío aunque tengan clase fija.
--
--  Esta migración:
--  1) Agrega `_autobook_fixed_enrollments_for_session`, el mismo loop de
--     reserva que tenía la versión anterior de `ensure_class_sessions`,
--     ahora reutilizable por sesión individual.
--  2) Hace que `_generate_class_sessions` lo llame por cada sesión nueva
--     que crea (tanto vía botón manual como vía cron).
--  3) Backfill: corre ese mismo auto-reservado sobre las sesiones futuras
--     que ya existen (creadas entre el 18 y hoy sin sus alumnas fijas).
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  _autobook_fixed_enrollments_for_session — reserva, para UNA sesión,
--  a todas las alumnas con class_enrollments de esa clase que aún no
--  tengan booking ahí, respetando inscripción pagada, créditos y cupo.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public._autobook_fixed_enrollments_for_session(
  p_session_id uuid
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session   public.class_sessions%rowtype;
  v_class     public.classes%rowtype;
  v_enr       record;
  v_sub       public.subscriptions%rowtype;
  v_capacity  int;
  v_booked    int := 0;
begin
  select * into v_session from public.class_sessions where id = p_session_id for update;
  if not found then
    return 0;
  end if;

  select * into v_class from public.classes where id = v_session.class_id;

  for v_enr in
    select student_id from public.class_enrollments where class_id = v_session.class_id
  loop
    if exists (
      select 1 from public.bookings
      where student_id = v_enr.student_id
        and session_id = v_session.id
        and status in ('confirmed', 'attended')
    ) then
      continue;
    end if;

    if not exists (
      select 1 from public.students
      where id = v_enr.student_id and enrolled_at is not null
    ) then
      continue;
    end if;

    select * into v_sub
      from public.subscriptions
      where student_id = v_enr.student_id and status = 'active'
      for update;
    if not found or v_sub.credits_remaining <= 0 then
      continue;
    end if;

    v_capacity := coalesce(v_session.capacity_override, v_class.capacity);
    if v_session.seats_taken >= v_capacity then
      continue;
    end if;

    insert into public.bookings (student_id, session_id, status, is_fixed)
    values (v_enr.student_id, v_session.id, 'confirmed', true);

    update public.subscriptions
       set credits_remaining = credits_remaining - 1
     where id = v_sub.id;

    v_session.seats_taken := v_session.seats_taken + 1;
    update public.class_sessions
       set seats_taken = v_session.seats_taken
     where id = v_session.id;

    v_booked := v_booked + 1;
  end loop;

  return v_booked;
end;
$$;

comment on function public._autobook_fixed_enrollments_for_session is
  'Reserva, para una sesión puntual, a todas las alumnas con class_enrollments de esa clase que aún no tengan booking ahí. Usada por _generate_class_sessions y por el backfill de esta migración.';

revoke execute on function public._autobook_fixed_enrollments_for_session(uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
--  _generate_class_sessions — ahora sí auto-reserva a las alumnas fijas
--  por cada sesión nueva que crea (antes solo insertaba las fechas).
-- ─────────────────────────────────────────────────────────────────────

create or replace function public._generate_class_sessions(
  p_class_id     uuid,
  p_weeks_ahead  int default 6
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class       public.classes%rowtype;
  v_today       date := (now() at time zone 'America/Mexico_City')::date;
  v_first_date  date;
  v_end_date    date;
  v_count       int := 0;
  v_new_session public.class_sessions%rowtype;
begin
  select * into v_class from public.classes where id = p_class_id;
  if not found then
    raise exception 'CLASS_NOT_FOUND' using errcode = 'P0001';
  end if;

  if p_weeks_ahead is null or p_weeks_ahead < 1 then
    p_weeks_ahead := 6;
  end if;
  if p_weeks_ahead > 26 then
    p_weeks_ahead := 26;
  end if;

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
    perform public._autobook_fixed_enrollments_for_session(v_new_session.id);
  end loop;

  return v_count;
end;
$$;

comment on function public._generate_class_sessions is
  'Lógica de generación de sesiones + auto-reservado de alumnas fijas, sin chequeo de permisos. No exponer directo a authenticated/anon.';

-- ─────────────────────────────────────────────────────────────────────
--  Backfill — sesiones futuras ya creadas (entre el 18 de agosto y hoy)
--  que se quedaron sin sus alumnas fijas por el bug.
-- ─────────────────────────────────────────────────────────────────────

do $$
declare
  v_session_id uuid;
begin
  for v_session_id in
    select id from public.class_sessions
    where status = 'scheduled' and starts_at > now()
  loop
    perform public._autobook_fixed_enrollments_for_session(v_session_id);
  end loop;
end;
$$;
