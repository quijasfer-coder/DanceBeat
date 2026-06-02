-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Business Functions
--  Migración 0003
--
--  Funciones críticas del sistema de reservas. Todas son SECURITY DEFINER
--  para poder operar transaccionalmente sobre múltiples tablas, pero
--  validan internamente que el llamador tenga permiso.
--
--  Llamables desde Next.js así:
--    await supabase.rpc('book_class',     { p_session_id, p_student_id });
--    await supabase.rpc('cancel_booking', { p_booking_id });
--
--  Errores codificados (mensajes consistentes para el frontend):
--    NOT_AUTHENTICATED    sin sesión
--    NOT_OWNER            no eres dueño del student
--    STUDENT_NOT_FOUND
--    SESSION_NOT_FOUND
--    SESSION_NOT_BOOKABLE status != 'scheduled'
--    SESSION_PAST         la sesión ya empezó
--    CLASS_FULL           sin cupo
--    NO_SUBSCRIPTION      sin sub activa
--    NO_CREDITS           sub activa pero 0 créditos
--    ALREADY_BOOKED       ya tienes reserva activa para esta sesión
--    BOOKING_NOT_FOUND
--    NOT_CANCELLABLE      booking no está en estado 'confirmed'
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  HELPER: leer settings con default
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.get_setting(p_key text, p_default text default null)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value from public.settings where key = p_key), p_default);
$$;

comment on function public.get_setting is
  'Lee un valor de la tabla settings, devuelve p_default si la key no existe.';

-- ─────────────────────────────────────────────────────────────────────
--  BOOK_CLASS — reserva atómica de una sesión para un alumno
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
  'Reserva atómica: valida cupo + créditos + ventana de tiempo, inserta booking, decrementa créditos.';

-- ─────────────────────────────────────────────────────────────────────
--  PROMOTE_FROM_WAITLIST — usado por cancel_booking
--  Promueve al primero de la lista de espera (que aún califique).
--  Si nadie califica, retorna null sin error.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.promote_from_waitlist(p_session_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session       public.class_sessions%rowtype;
  v_capacity      int;
  v_waitlist      public.waitlist%rowtype;
  v_subscription  public.subscriptions%rowtype;
  v_new_booking   public.bookings%rowtype;
begin
  -- Lock sesión
  select * into v_session
    from public.class_sessions
    where id = p_session_id
    for update;
  if not found or v_session.status <> 'scheduled' or v_session.starts_at <= now() then
    return null;
  end if;

  v_capacity := coalesce(
    v_session.capacity_override,
    (select capacity from public.classes where id = v_session.class_id)
  );
  if v_session.seats_taken >= v_capacity then
    return null;
  end if;

  -- Loop: probar candidatos hasta encontrar uno válido o agotar lista
  loop
    select * into v_waitlist
      from public.waitlist
      where session_id = p_session_id and promoted_at is null
      order by position asc, joined_at asc
      limit 1
      for update;

    if not found then
      return null;
    end if;

    -- Validar sub activa con créditos
    select * into v_subscription
      from public.subscriptions
      where student_id = v_waitlist.student_id and status = 'active'
      for update;

    if not found or v_subscription.credits_remaining <= 0 then
      -- Marcar como procesado (ya no aplica) y seguir con el siguiente
      update public.waitlist set promoted_at = now() where id = v_waitlist.id;
      continue;
    end if;

    -- Que no tenga ya una reserva activa para esta sesión
    if exists (
      select 1 from public.bookings
        where student_id = v_waitlist.student_id
          and session_id = p_session_id
          and status in ('confirmed', 'attended')
    ) then
      update public.waitlist set promoted_at = now() where id = v_waitlist.id;
      continue;
    end if;

    -- Promover
    insert into public.bookings (student_id, session_id, status)
         values (v_waitlist.student_id, p_session_id, 'confirmed')
      returning * into v_new_booking;

    update public.subscriptions
       set credits_remaining = credits_remaining - 1
     where id = v_subscription.id;

    update public.class_sessions
       set seats_taken = seats_taken + 1
     where id = p_session_id;

    update public.waitlist
       set promoted_at = now()
     where id = v_waitlist.id;

    return v_new_booking;
  end loop;
end;
$$;

comment on function public.promote_from_waitlist is
  'Promueve al primero válido de la lista de espera. Llamado desde cancel_booking.';

-- ─────────────────────────────────────────────────────────────────────
--  CANCEL_BOOKING — cancelar una reserva con regla de las 12h
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

  -- Lock booking
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Validar permiso
  select * into v_student from public.students where id = v_booking.student_id;
  if v_student.account_id <> v_user and not public.is_admin() then
    raise exception 'NOT_OWNER' using errcode = 'P0001';
  end if;

  -- Solo se cancelan reservas confirmadas
  if v_booking.status <> 'confirmed' then
    raise exception 'NOT_CANCELLABLE' using errcode = 'P0001';
  end if;

  -- Cargar sesión
  select * into v_session
    from public.class_sessions
    where id = v_booking.session_id
    for update;
  if v_session.starts_at <= now() then
    raise exception 'SESSION_PAST' using errcode = 'P0001';
  end if;

  -- Determinar si es cancelación tardía
  v_window_hours := coalesce(public.get_setting('cancel_window_hours', '12')::int, 12);
  v_is_late := (v_session.starts_at - now()) < (v_window_hours::text || ' hours')::interval;
  v_new_status := case when v_is_late then 'cancelled_late'::public.booking_status
                                       else 'cancelled'::public.booking_status end;

  -- Actualizar booking
  update public.bookings
     set status          = v_new_status,
         cancelled_at    = now(),
         credit_returned = (not v_is_late)
   where id = p_booking_id
   returning * into v_booking;

  -- Devolver crédito si no es tardía
  if not v_is_late then
    update public.subscriptions
       set credits_remaining = credits_remaining + 1
     where student_id = v_booking.student_id and status = 'active';
  end if;

  -- Liberar el cupo
  update public.class_sessions
     set seats_taken = greatest(seats_taken - 1, 0)
   where id = v_booking.session_id;

  -- Intentar promover de waitlist (silencioso si nadie aplica)
  perform public.promote_from_waitlist(v_booking.session_id);

  return v_booking;
end;
$$;

comment on function public.cancel_booking is
  'Cancela una reserva. Aplica la regla de las 12h: si es a tiempo devuelve crédito, si no cobra el crédito pero libera el cupo.';

-- ─────────────────────────────────────────────────────────────────────
--  PERMISOS — explícitos para evitar exposición accidental
-- ─────────────────────────────────────────────────────────────────────

-- Por defecto Supabase otorga EXECUTE a anon/authenticated en funciones de public.
-- Reset y otorgamos explícitamente solo lo que queremos.

revoke execute on function public.book_class(uuid, uuid)         from public;
revoke execute on function public.cancel_booking(uuid)           from public;
revoke execute on function public.promote_from_waitlist(uuid)    from public;
revoke execute on function public.get_setting(text, text)        from public;

grant execute on function public.book_class(uuid, uuid)          to authenticated;
grant execute on function public.cancel_booking(uuid)            to authenticated;
grant execute on function public.get_setting(text, text)         to anon, authenticated;

-- promote_from_waitlist: NO se otorga a nadie. Solo se llama internamente
-- desde cancel_booking (que es SECURITY DEFINER y ejecuta con permisos del owner).
