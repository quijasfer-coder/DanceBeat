-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Teacher workflows
--  Migración 0007
--
--  Lo necesario para que un coreógrafo (profile.role = 'teacher')
--  pueda ver sus clases, generar sesiones y tomar lista.
--
--  Agrega:
--   · helper public.is_teacher_of_class(class_id)
--   · RPC public.ensure_class_sessions(class_id, weeks_ahead)
--       — genera N semanas de class_sessions a partir de hoy
--   · RPC public.mark_attendance(booking_id, attended boolean)
--       — marca asistencia / no_show de un booking
--
--  Errores codificados consistentes con migración 0003:
--    NOT_AUTHENTICATED, NOT_AUTHORIZED, CLASS_NOT_FOUND, BOOKING_NOT_FOUND
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  HELPER: is_teacher_of_class
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.is_teacher_of_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = p_class_id and t.profile_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────
--  ENSURE_CLASS_SESSIONS — genera N semanas de sesiones idempotente
--  Permission: admin o teacher de la clase.
--  Devuelve cuántas filas nuevas se crearon.
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
  v_user        uuid := auth.uid();
  v_class       public.classes%rowtype;
  v_today       date := (now() at time zone 'America/Mexico_City')::date;
  v_first_date  date;
  v_end_date    date;
  v_count       int;
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

  with new_rows as (
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
    returning 1
  )
  select count(*)::int into v_count from new_rows;

  return coalesce(v_count, 0);
end;
$$;

comment on function public.ensure_class_sessions is
  'Genera idempotentemente N semanas de class_sessions para una clase. Llamable por admin o por el profesor asignado.';

-- ─────────────────────────────────────────────────────────────────────
--  MARK_ATTENDANCE — el profesor toma lista
--  attended=true  → status='attended', attended_at=now(), attended_by=user
--  attended=false → status='no_show',  attended_at=null,  attended_by=null
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.mark_attendance(
  p_booking_id uuid,
  p_attended   boolean
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_booking   public.bookings%rowtype;
  v_status    public.booking_status;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not (public.is_admin() or public.is_teacher_of_session(v_booking.session_id)) then
    raise exception 'NOT_AUTHORIZED' using errcode = 'P0001';
  end if;

  v_status := case when p_attended
                   then 'attended'::public.booking_status
                   else 'no_show'::public.booking_status end;

  update public.bookings
     set status      = v_status,
         attended_at = case when p_attended then now() else null end,
         attended_by = case when p_attended then v_user else null end
   where id = p_booking_id
   returning * into v_booking;

  return v_booking;
end;
$$;

comment on function public.mark_attendance is
  'Marca una reserva como asistencia o no_show. Llamable por admin o profesor de la sesión.';

-- ─────────────────────────────────────────────────────────────────────
--  PERMISOS
-- ─────────────────────────────────────────────────────────────────────

revoke execute on function public.ensure_class_sessions(uuid, int)   from public;
revoke execute on function public.mark_attendance(uuid, boolean)     from public;

grant  execute on function public.ensure_class_sessions(uuid, int)   to authenticated;
grant  execute on function public.mark_attendance(uuid, boolean)     to authenticated;
