-- ════════════════════════════════════════════════════════════════════
--  Dance Beat Academy — Auto-generación de sesiones
--  Migración 0029
--
--  Hasta ahora, generar las class_sessions de las próximas semanas era
--  manual: cada coreógrafa tenía que entrar a /profesor/[classId] y dar
--  clic en "Generar". Si se le olvidaba, esa clase se quedaba sin
--  sesiones reservables para el mes siguiente.
--
--  Esta migración extrae la lógica de generación de fechas de
--  `ensure_class_sessions` a una función interna sin chequeo de permisos
--  (`_generate_class_sessions`), y agrega `generate_sessions_all_active_classes`
--  para que un cron diario (Vercel Cron → /api/cron/generate-sessions)
--  la corra sobre todas las clases activas usando el service role.
--
--  `ensure_class_sessions` (el botón manual del profesor) se mantiene
--  igual — sigue sirviendo como respaldo/override manual.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
--  _generate_class_sessions — lógica pura, sin checar permisos.
--  Úsala solo desde funciones que ya validaron quién puede llamarla.
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
  v_count       int;
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

comment on function public._generate_class_sessions is
  'Lógica de generación de sesiones sin chequeo de permisos. No exponer directo a authenticated/anon.';

revoke execute on function public._generate_class_sessions(uuid, int) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
--  ensure_class_sessions — mismo nombre/firma de antes (botón manual del
--  profesor), ahora como wrapper: valida permiso y llama al helper.
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
  v_user  uuid := auth.uid();
  v_class public.classes%rowtype;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;

  select * into v_class from public.classes where id = p_class_id;
  if not found then
    raise exception 'CLASS_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not (
    public.is_admin()
    or exists (
      select 1 from public.teachers t
      where t.id = v_class.teacher_id and t.profile_id = v_user
    )
  ) then
    raise exception 'NOT_AUTHORIZED' using errcode = 'P0001';
  end if;

  return public._generate_class_sessions(p_class_id, p_weeks_ahead);
end;
$$;

comment on function public.ensure_class_sessions is
  'Genera idempotentemente N semanas de class_sessions para una clase. Llamable por admin o por el profesor asignado (botón manual de respaldo).';

-- ─────────────────────────────────────────────────────────────────────
--  generate_sessions_all_active_classes — para el cron diario.
--  Sin chequeo de auth.uid(): no la llama una persona con sesión, la
--  llama el server de Dance Beat con el service role key. Por eso el
--  EXECUTE queda revocado para anon/authenticated y solo se otorga a
--  service_role.
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.generate_sessions_all_active_classes(
  p_weeks_ahead int default 6
)
returns table (class_id uuid, sessions_created int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_count    int;
begin
  for v_class_id in select id from public.classes where is_active = true loop
    v_count := public._generate_class_sessions(v_class_id, p_weeks_ahead);
    if v_count > 0 then
      class_id := v_class_id;
      sessions_created := v_count;
      return next;
    end if;
  end loop;
end;
$$;

comment on function public.generate_sessions_all_active_classes is
  'Corre _generate_class_sessions sobre todas las clases activas. Pensada para un cron diario (Vercel Cron) via service role — no requiere sesión de usuario.';

revoke execute on function public.generate_sessions_all_active_classes(int) from public, anon, authenticated;
grant  execute on function public.generate_sessions_all_active_classes(int) to service_role;
