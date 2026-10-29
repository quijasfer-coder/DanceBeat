-- La policy event_assignments_owner_rsvp deja que la mamá actualice SU
-- asignación, pero RLS no limita columnas: solo revisaba que el nuevo
-- status fuera invited/confirmed/declined, así que por API directa podía
-- tocar también payment_status, paid_at, attended_at, etc.
--
-- Este trigger cierra eso: si quien actualiza no es admin (y hay sesión de
-- usuario), SOLO puede cambiar `status`, y solo mientras el status actual
-- sea invited/confirmed/declined. service_role / SQL directo (auth.uid()
-- nulo) y admins no se ven afectados.

create or replace function public.event_assignments_guard_owner_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.status not in ('invited', 'confirmed', 'declined') then
    raise exception 'ASSIGNMENT_LOCKED' using errcode = 'P0001';
  end if;

  if new.event_id       is distinct from old.event_id
     or new.student_id     is distinct from old.student_id
     or new.payment_status is distinct from old.payment_status
     or new.payment_method is distinct from old.payment_method
     or new.paid_at        is distinct from old.paid_at
     or new.marked_paid_by is distinct from old.marked_paid_by
     or new.attended_at    is distinct from old.attended_at
     or new.attended_by    is distinct from old.attended_by
     or new.notes          is distinct from old.notes
     or new.created_at     is distinct from old.created_at
  then
    raise exception 'ONLY_STATUS_EDITABLE' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists event_assignments_guard_owner_update
  on public.event_assignments;

create trigger event_assignments_guard_owner_update
  before update on public.event_assignments
  for each row execute function public.event_assignments_guard_owner_update();
