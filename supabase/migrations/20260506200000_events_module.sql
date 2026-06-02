-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Eventos especiales
--  Migración 0009
--
--  Modelo único `events` para ensayos extraordinarios, competencias,
--  presentaciones (Luminaria) y otros eventos no recurrentes. Diferencia
--  por `kind`. La asignación de alumnas vive en `event_assignments`.
--
--  Costo: parejo por evento (cost_cents en events). El payment_status
--  es por alumna porque algunas pagan por plataforma y otras en persona;
--  el admin marca manualmente quien ya pagó cuando recibe efectivo.
--
--  Asistencia: same patrón que bookings (status + attended_at + by).
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────────────────────────────────

create type event_kind as enum ('rehearsal', 'competition', 'showcase', 'other');

create type event_assignment_status as enum (
  'invited',     -- recién asignada, no ha confirmado
  'confirmed',   -- confirmó que va
  'declined',    -- avisó que no va
  'attended',    -- llegó y se le marcó asistencia
  'no_show'      -- no llegó
);

create type event_payment_status as enum (
  'not_required',-- evento gratis o aún no aplica
  'pending',     -- evento con costo, sin pagar
  'paid'         -- pagado (por plataforma o en persona, lo distingue payment_method)
);

-- ─────────────────────────────────────────────────────────────────────
--  EVENTS
-- ─────────────────────────────────────────────────────────────────────

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  kind          event_kind not null default 'rehearsal',
  title         text not null,
  description   text,
  requirements  text,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  location      text,
  studio_id     uuid references public.studios(id) on delete set null,
  cost_cents    int check (cost_cents is null or cost_cents >= 0),
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index events_starts_at_idx on public.events(starts_at);
create index events_kind_idx on public.events(kind);
create index events_published_idx on public.events(is_published) where is_published = true;

create trigger set_updated_at_events
  before update on public.events
  for each row execute function public.set_updated_at();

comment on column public.events.location is
  'Texto libre. Puede ser una sucursal externa, hotel, teatro, otra ciudad, etc. Para eventos en sede usa también studio_id.';
comment on column public.events.cost_cents is
  'Costo extra del evento (parejo). null = gratis. Aplica por alumna asignada.';
comment on column public.events.requirements is
  'Qué deben llevar / requerimientos especiales (vestuario, código, etc.). Separado de description para destacarlo en UI.';
comment on column public.events.is_published is
  'false = borrador (solo admin lo ve). true = visible a alumnas asignadas.';

-- ─────────────────────────────────────────────────────────────────────
--  EVENT_ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────────────

create table public.event_assignments (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  student_id      uuid not null references public.students(id) on delete cascade,
  status          event_assignment_status not null default 'invited',
  payment_status  event_payment_status not null default 'not_required',
  payment_method  text, -- 'cash', 'transfer', 'stripe', etc.
  paid_at         timestamptz,
  marked_paid_by  uuid references public.profiles(id) on delete set null,
  attended_at     timestamptz,
  attended_by     uuid references public.profiles(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (event_id, student_id)
);

create index event_assignments_event_idx on public.event_assignments(event_id);
create index event_assignments_student_idx on public.event_assignments(student_id);

create trigger set_updated_at_event_assignments
  before update on public.event_assignments
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
--  RLS
-- ─────────────────────────────────────────────────────────────────────

alter table public.events             enable row level security;
alter table public.event_assignments  enable row level security;

-- events: alumna ve los eventos publicados a los que está asignada;
-- staff (admin/teacher) ve todos.
create policy "events_select_visible"
  on public.events for select
  to authenticated
  using (
    public.is_staff()
    or (
      is_published = true
      and exists (
        select 1
        from public.event_assignments ea
        join public.students s on s.id = ea.student_id
        where ea.event_id = events.id and s.account_id = auth.uid()
      )
    )
  );

create policy "events_admin_all"
  on public.events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- event_assignments: alumna ve las suyas; staff ve todas.
create policy "event_assignments_select_visible"
  on public.event_assignments for select
  to authenticated
  using (
    public.is_staff()
    or public.owns_student(student_id)
  );

create policy "event_assignments_admin_all"
  on public.event_assignments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- La alumna puede actualizar SU PROPIO assignment para confirmar/declinar
-- (limita el cambio a esos status — el resto solo lo cambia admin).
create policy "event_assignments_owner_rsvp"
  on public.event_assignments for update
  to authenticated
  using (public.owns_student(student_id))
  with check (
    public.owns_student(student_id)
    and status in ('invited', 'confirmed', 'declined')
  );

-- ─────────────────────────────────────────────────────────────────────
--  RPC: bulk_assign_event_by_class
--  Asigna a un evento todas las alumnas con bookings recientes en una
--  clase dada. "Recientes" = últimas 8 semanas y/o sesiones futuras.
--  Idempotente: usa ON CONFLICT do nothing.
--  Retorna cuántas asignaciones nuevas se crearon.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.bulk_assign_event_by_class(
  p_event_id uuid,
  p_class_id uuid
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.events where id = p_event_id) then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.classes where id = p_class_id) then
    raise exception 'CLASS_NOT_FOUND' using errcode = 'P0001';
  end if;

  with target_students as (
    select distinct b.student_id
    from public.bookings b
    join public.class_sessions cs on cs.id = b.session_id
    where cs.class_id = p_class_id
      and b.status in ('confirmed', 'attended')
      and (
        cs.starts_at >= now() - interval '8 weeks'
        or cs.starts_at >= now()
      )
  ),
  inserted as (
    insert into public.event_assignments (event_id, student_id)
    select p_event_id, ts.student_id from target_students ts
    on conflict (event_id, student_id) do nothing
    returning 1
  )
  select count(*)::int into v_count from inserted;

  return coalesce(v_count, 0);
end;
$$;

comment on function public.bulk_assign_event_by_class is
  'Asigna a un evento todas las alumnas con bookings activos/recientes (8 semanas) en una clase. Idempotente.';

revoke execute on function public.bulk_assign_event_by_class(uuid, uuid) from public;
grant  execute on function public.bulk_assign_event_by_class(uuid, uuid) to authenticated;
