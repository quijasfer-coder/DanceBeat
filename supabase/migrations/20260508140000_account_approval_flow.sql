-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Flujo de aprobación de cuenta
--  Migración 0015
--
--  Modelo de gates por cuenta (3 estados antes de poder reservar):
--   1. account_status: pending | approved | rejected (admin decide)
--   2. enrolled_at:    null o timestamp (inscripción $1,600 pagada)
--   3. subscription:   activa o no (plan de clases)
--
--  Esta migración cubre #1 + el tracking de quién aprueba/rechaza,
--  además del registro del pago manual de inscripción.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  ENUM y columnas en profiles
-- ─────────────────────────────────────────────────────────────────────

create type account_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column account_status account_status not null default 'pending',
  add column approved_at    timestamptz,
  add column approved_by    uuid references public.profiles(id),
  add column rejected_at    timestamptz,
  add column rejected_by    uuid references public.profiles(id),
  add column rejection_reason text,
  add column enrollment_paid_method text,
  add column enrollment_paid_by     uuid references public.profiles(id);

comment on column public.profiles.account_status is
  'pending = recién registrada, esperando aprobación. approved = aprobada por admin. rejected = solicitud denegada.';
comment on column public.profiles.enrollment_paid_method is
  'Método de pago de inscripción: cash | transfer | stripe | otro. Null si no se ha pagado.';

-- ─────────────────────────────────────────────────────────────────────
--  BACKFILL — cuentas existentes pasan a 'approved' con fecha now()
--  Es una decisión de transición: no queremos romper a usuarios actuales.
-- ─────────────────────────────────────────────────────────────────────

update public.profiles
   set account_status = 'approved',
       approved_at    = coalesce(created_at, now())
 where account_status = 'pending';

-- Si la admin (Fer) ya tiene enrolled_at null y rol admin, la marcamos
-- como inscrita por consistencia.
update public.profiles
   set enrolled_at = coalesce(enrolled_at, now()),
       enrollment_paid_method = coalesce(enrollment_paid_method, 'admin')
 where role = 'admin';

-- ─────────────────────────────────────────────────────────────────────
--  TRIGGER actualizado — nuevas cuentas arrancan en 'pending'
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, account_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    'student',
    'pending'
  );
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
--  RPC: approve_account
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.approve_account(p_account_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'P0001';
  end if;

  update public.profiles
     set account_status = 'approved',
         approved_at    = now(),
         approved_by    = v_user,
         rejected_at    = null,
         rejected_by    = null,
         rejection_reason = null
   where id = p_account_id
   returning * into v_profile;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND' using errcode = 'P0001';
  end if;

  return v_profile;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
--  RPC: reject_account
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.reject_account(
  p_account_id uuid,
  p_reason     text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'P0001';
  end if;

  update public.profiles
     set account_status = 'rejected',
         rejected_at    = now(),
         rejected_by    = v_user,
         rejection_reason = p_reason,
         approved_at    = null,
         approved_by    = null
   where id = p_account_id
   returning * into v_profile;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND' using errcode = 'P0001';
  end if;

  return v_profile;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
--  RPC: mark_enrollment_paid (registra pago manual de inscripción)
--  Crea fila en payments y setea enrolled_at + método.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.mark_enrollment_paid(
  p_account_id uuid,
  p_method     text  -- 'cash' | 'transfer' | 'other'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_amount int;
  v_profile public.profiles%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = 'P0001';
  end if;

  -- Lee el monto vigente de inscripción del settings
  v_amount := coalesce(public.get_setting('enrollment_fee_cents', '160000')::int, 160000);

  -- Inserta el payment
  insert into public.payments (account_id, amount_cents, kind, status, paid_at)
  values (p_account_id, v_amount, 'enrollment', 'succeeded', now());

  -- Actualiza el profile
  update public.profiles
     set enrolled_at            = now(),
         enrollment_paid_method = p_method,
         enrollment_paid_by     = v_user
   where id = p_account_id
   returning * into v_profile;

  if not found then
    raise exception 'ACCOUNT_NOT_FOUND' using errcode = 'P0001';
  end if;

  return v_profile;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
--  PERMISOS
-- ─────────────────────────────────────────────────────────────────────

revoke execute on function public.approve_account(uuid)             from public;
revoke execute on function public.reject_account(uuid, text)        from public;
revoke execute on function public.mark_enrollment_paid(uuid, text)  from public;

grant execute on function public.approve_account(uuid)             to authenticated;
grant execute on function public.reject_account(uuid, text)        to authenticated;
grant execute on function public.mark_enrollment_paid(uuid, text)  to authenticated;
