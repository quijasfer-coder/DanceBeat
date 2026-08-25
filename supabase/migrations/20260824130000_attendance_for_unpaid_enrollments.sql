-- ════════════════════════════════════════════════════════════════════
--  Pase de lista para alumnas con clase fija SIN plan activo todavía.
--
--  Hasta ahora el pase de lista del profesor (/profesor/sesion/[id])
--  solo mostraba alumnas con un `booking` real — y un booking solo se
--  crea si la alumna tiene suscripción activa con créditos (para no
--  registrar un cobro que no existe). Eso significaba que una alumna
--  asignada a una clase fija pero que aún no ha pagado desaparecía por
--  completo del pase de lista, aunque físicamente esté en la clase.
--
--  Esta migración separa "¿tiene crédito pagado?" de "¿está en mi
--  clase para pasar lista?":
--   · `bookings.credit_charged` — false cuando el booking se creó SOLO
--     para registrar asistencia, sin consumir ni suponer un crédito
--     pagado. No toca subscriptions/payments/recibos en ningún caso.
--   · RPC `mark_attendance_for_enrollment` — el profesor marca
--     asistencia de una alumna de `class_enrollments` que todavía no
--     tiene booking en esa sesión; crea el booking con
--     credit_charged=false en vez de fallar o bloquear el botón.
-- ════════════════════════════════════════════════════════════════════

alter table public.bookings
  add column credit_charged boolean not null default true;

comment on column public.bookings.credit_charged is
  'false si el booking se creó solo para pasar lista (alumna de clase fija sin plan/crédito activo) — no representa un pago real. true en cualquier booking normal que sí consumió un crédito.';

-- ─────────────────────────────────────────────────────────────────────
--  MARK_ATTENDANCE_FOR_ENROLLMENT — el profesor marca asistencia de una
--  alumna con clase fija que aún no tiene booking en esta sesión
--  (típicamente porque no tiene plan/crédito activo). Si ya existe un
--  booking para esa alumna+sesión, simplemente lo actualiza como
--  mark_attendance. Nunca toca subscriptions ni seats_taken.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.mark_attendance_for_enrollment(
  p_student_id uuid,
  p_session_id uuid,
  p_attended   boolean
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_session   public.class_sessions%rowtype;
  v_booking   public.bookings%rowtype;
  v_status    public.booking_status;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  select * into v_session from public.class_sessions where id = p_session_id;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not (public.is_admin() or public.is_teacher_of_session(p_session_id)) then
    raise exception 'NOT_AUTHORIZED' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.class_enrollments
    where student_id = p_student_id and class_id = v_session.class_id
  ) then
    raise exception 'NOT_ENROLLED' using errcode = 'P0001';
  end if;

  v_status := case when p_attended
                   then 'attended'::public.booking_status
                   else 'no_show'::public.booking_status end;

  select * into v_booking
    from public.bookings
    where student_id = p_student_id and session_id = p_session_id
    for update;

  if found then
    update public.bookings
       set status      = v_status,
           attended_at = case when p_attended then now() else null end,
           attended_by = case when p_attended then v_user else null end
     where id = v_booking.id
     returning * into v_booking;
  else
    insert into public.bookings
      (student_id, session_id, status, is_fixed, credit_charged, attended_at, attended_by)
    values
      (p_student_id, p_session_id, v_status, true, false,
       case when p_attended then now() else null end,
       case when p_attended then v_user else null end)
    returning * into v_booking;
  end if;

  return v_booking;
end;
$$;

comment on function public.mark_attendance_for_enrollment is
  'Marca asistencia/no_show de una alumna con clase fija (class_enrollments) que aún no tiene booking en esta sesión — típicamente por no tener plan/crédito activo. Crea el booking con credit_charged=false, sin tocar subscriptions ni seats_taken.';

revoke execute on function public.mark_attendance_for_enrollment(uuid, uuid, boolean) from public;
grant  execute on function public.mark_attendance_for_enrollment(uuid, uuid, boolean) to authenticated;
