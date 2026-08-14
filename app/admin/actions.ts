"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { sendTeacherWelcomeEmail } from "@/lib/email";
import type { Database } from "@/lib/database.types";

type DanceLevel = Database["public"]["Enums"]["dance_level"];

export type AdminFormState = { error?: string; success?: string } | null;

/**
 * Actualiza una clase + el style asociado (nombre/tagline/descripción).
 * Solo admin. Después de actualizar invalida cachés de páginas afectadas.
 */
export async function updateClassAction(
  classId: string,
  styleId: string,
  originalDayOfWeek: number,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin(`/admin/clases/${classId}/editar`);
  const supabase = await createClient();

  // ─── Campos de styles (contenido público visible) ──────────
  const styleName = (formData.get("style_name") as string)?.trim();
  const styleTagline = (formData.get("style_tagline") as string)?.trim();
  const styleDescription = (formData.get("style_description") as string)?.trim();
  const styleAgeRange = (formData.get("style_age_range") as string)?.trim();
  const styleCoverUrl = (formData.get("style_cover_url") as string)?.trim();

  // ─── Campos de classes (programación operativa) ─────────────
  const studioId = (formData.get("studio_id") as string) || null;
  const teacherIdRaw = (formData.get("teacher_id") as string) ?? "";
  const teacherId = teacherIdRaw && teacherIdRaw !== "none" ? teacherIdRaw : null;
  const startsAtTime = (formData.get("starts_at_time") as string)?.trim();
  const durationMin = parseInt(formData.get("duration_min") as string, 10);
  const level = formData.get("level") as DanceLevel;
  const capacity = parseInt(formData.get("capacity") as string, 10);
  const ageMinStr = (formData.get("age_min") as string)?.trim();
  const ageMaxStr = (formData.get("age_max") as string)?.trim();
  const isActive = formData.get("is_active") === "on";
  const isPublic = formData.get("is_public") === "on";

  // El DayPicker manda todos los días marcados en un solo campo. Esta fila
  // (classId) se queda con el día original si sigue marcado; si lo quitaron,
  // se mueve al primer día que haya quedado. El resto de los días marcados
  // se crean como clases hermanas nuevas (mismo patrón que createClassAction).
  const selectedDays = formData
    .getAll("days_of_week")
    .map((d) => parseInt(d as string, 10))
    .filter((d) => !isNaN(d));

  if (selectedDays.length === 0) {
    return { error: "Selecciona al menos un día de la semana." };
  }

  const dayOfWeek = selectedDays.includes(originalDayOfWeek)
    ? originalDayOfWeek
    : selectedDays[0];
  const addDaysOfWeek = selectedDays.filter((d) => d !== dayOfWeek);

  if (!styleName || !studioId || !startsAtTime || isNaN(capacity)) {
    return { error: "Faltan campos obligatorios." };
  }

  // 1. Update style (contenido público)
  const { error: styleError } = await supabase
    .from("styles")
    .update({
      name: styleName,
      tagline: styleTagline || null,
      description: styleDescription || null,
      age_range: styleAgeRange || null,
      cover_url: styleCoverUrl || null,
    })
    .eq("id", styleId);

  if (styleError) return { error: `Style: ${styleError.message}` };

  // 2. Update class (programación)
  const { error: classError } = await supabase
    .from("classes")
    .update({
      studio_id: studioId,
      teacher_id: teacherId,
      day_of_week: dayOfWeek,
      starts_at_time: startsAtTime,
      duration_min: durationMin,
      level,
      capacity,
      age_min: ageMinStr ? parseInt(ageMinStr, 10) : null,
      age_max: ageMaxStr ? parseInt(ageMaxStr, 10) : null,
      is_active: isActive,
      is_public: isPublic,
    })
    .eq("id", classId);

  if (classError) return { error: `Class: ${classError.message}` };

  // 3. Días adicionales: crear una clase hermana por cada día marcado en
  // "Agregar a otro día", clonando los mismos datos de sucursal/coreógrafo/
  // horario/cupo que se acaban de guardar arriba. Quedan como filas
  // independientes en `classes` (mismo modelo que "Crear clase nueva").
  if (addDaysOfWeek.length > 0) {
    const { data: createdClasses, error: addDaysError } = await supabase
      .from("classes")
      .insert(
        addDaysOfWeek.map((day) => ({
          style_id: styleId,
          studio_id: studioId,
          teacher_id: teacherId,
          day_of_week: day,
          starts_at_time: startsAtTime,
          duration_min: durationMin,
          level,
          capacity,
          age_min: ageMinStr ? parseInt(ageMinStr, 10) : null,
          age_max: ageMaxStr ? parseInt(ageMaxStr, 10) : null,
          is_active: isActive,
        })),
      )
      .select("id");

    if (addDaysError) return { error: `Días adicionales: ${addDaysError.message}` };

    if (isActive) {
      await Promise.all(
        (createdClasses ?? []).map((c) =>
          supabase.rpc("ensure_class_sessions", {
            p_class_id: c.id,
            p_weeks_ahead: 4,
          }),
        ),
      );
    }
  }

  // Invalida caché de páginas afectadas
  revalidatePath("/", "layout");
  revalidatePath("/clases");
  revalidatePath("/clases/[slug]", "page");
  revalidatePath("/horarios");
  revalidatePath("/admin/clases");

  redirect("/admin/clases?saved=1");
}

/**
 * Crea una nueva clase. Puede usar un estilo existente (style_id) o crear
 * uno nuevo (style_new_*). Si crea uno nuevo, también guarda nombre, slug,
 * tagline, descripción, age_range y cover_url.
 */
export async function createClassAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin("/admin/clases/nueva");
  const supabase = await createClient();

  const mode = (formData.get("style_mode") as string) ?? "existing";

  // ─── Resolver el style_id (existente o nuevo) ───────────────
  let styleId: string;

  if (mode === "new") {
    const newName = (formData.get("style_new_name") as string)?.trim();
    const newSlugRaw = ((formData.get("style_new_slug") as string) ?? "").trim();
    const newTagline = ((formData.get("style_new_tagline") as string) ?? "").trim();
    const newDescription = ((formData.get("style_new_description") as string) ?? "").trim();
    const newAgeRange = ((formData.get("style_new_age_range") as string) ?? "").trim();
    const newCoverUrl = ((formData.get("style_new_cover_url") as string) ?? "").trim();

    if (!newName) return { error: "El nombre del estilo es obligatorio." };

    // Slug: si no viene capturado, lo derivamos del nombre
    const slug = (newSlugRaw || newName)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) return { error: "El slug del estilo no es válido." };

    // Verificar unicidad
    const { data: existing } = await supabase
      .from("styles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      return {
        error: `Ya existe un estilo con el slug "${slug}". Cambia el nombre o el slug.`,
      };
    }

    // display_order al final
    const { data: lastOrder } = await supabase
      .from("styles")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const displayOrder = (lastOrder?.display_order ?? 0) + 1;

    const { data: created, error: styleErr } = await supabase
      .from("styles")
      .insert({
        slug,
        name: newName,
        tagline: newTagline || null,
        description: newDescription || null,
        age_range: newAgeRange || null,
        cover_url: newCoverUrl || null,
        is_active: true,
        display_order: displayOrder,
      })
      .select("id")
      .single();

    if (styleErr) return { error: `Style: ${styleErr.message}` };
    styleId = created.id;
  } else {
    const existingStyleId = (formData.get("style_id") as string)?.trim();
    if (!existingStyleId) return { error: "Selecciona un estilo." };
    styleId = existingStyleId;
  }

  // ─── Campos de class ─────────────────────────────────────────
  const studioId = (formData.get("studio_id") as string) || null;
  const teacherIdRaw = (formData.get("teacher_id") as string) ?? "";
  const teacherId = teacherIdRaw && teacherIdRaw !== "none" ? teacherIdRaw : null;
  const daysOfWeek = formData.getAll("days_of_week").map((d) => parseInt(d as string, 10));
  const startsAtTime = (formData.get("starts_at_time") as string)?.trim();
  const durationMin = parseInt(formData.get("duration_min") as string, 10);
  const level = formData.get("level") as DanceLevel;
  const capacity = parseInt(formData.get("capacity") as string, 10);
  const ageMinStr = (formData.get("age_min") as string)?.trim();
  const ageMaxStr = (formData.get("age_max") as string)?.trim();
  const isActive = formData.get("is_active") !== "off";

  if (!studioId || !startsAtTime || daysOfWeek.length === 0 || isNaN(capacity)) {
    return { error: "Faltan campos obligatorios de programación." };
  }

  // Crear un registro de clase por cada día seleccionado
  const { data: createdClasses, error: classErr } = await supabase
    .from("classes")
    .insert(
      daysOfWeek.map((day) => ({
        style_id: styleId,
        studio_id: studioId,
        teacher_id: teacherId,
        day_of_week: day,
        starts_at_time: startsAtTime,
        duration_min: isNaN(durationMin) ? 60 : durationMin,
        level,
        capacity,
        age_min: ageMinStr ? parseInt(ageMinStr, 10) : null,
        age_max: ageMaxStr ? parseInt(ageMaxStr, 10) : null,
        is_active: isActive,
      })),
    )
    .select("id");

  if (classErr) return { error: `Class: ${classErr.message}` };

  // Generar las próximas semanas de sesiones fechadas para que las clases
  // activas aparezcan de inmediato en /app/reservar (sin esto, la clase
  // queda "activa" pero invisible para las alumnas hasta que alguien
  // dispare ensure_class_sessions manualmente desde /profesor).
  if (isActive) {
    await Promise.all(
      (createdClasses ?? []).map((c) =>
        supabase.rpc("ensure_class_sessions", {
          p_class_id: c.id,
          p_weeks_ahead: 4,
        }),
      ),
    );
  }

  revalidatePath("/", "layout");
  revalidatePath("/clases");
  revalidatePath("/horarios");
  revalidatePath("/admin/clases");
  redirect("/admin/clases?saved=1");
}

/**
 * Elimina una clase de manera permanente. Por la cascada del schema:
 *   classes → class_sessions → bookings + waitlist
 * todo lo dependiente se borra. El style asociado se queda (puede tener
 * otras clases del mismo estilo).
 *
 * Devuelve un resumen con la cantidad de sesiones y bookings que se
 * borraron para que el admin pueda confirmar de nuevo si parece mucho.
 */
export async function deleteClassAction(
  classId: string,
): Promise<{ error?: string }> {
  await requireAdmin(`/admin/clases/${classId}/editar`);
  const supabase = await createClient();

  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/clases");
  revalidatePath("/horarios");
  revalidatePath("/admin/clases");
  redirect("/admin/clases?deleted=1");
}

/**
 * Da de baja (soft-delete) a un alumno poniéndolo is_active = false.
 * El registro se conserva en BD para historial.
 */
export async function deactivateStudentAction(
  studentId: string,
): Promise<void> {
  await requireAdmin("/admin/alumnos");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("students")
    .update({ is_active: false })
    .eq("id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/alumnos");
}

/**
 * Reactiva a un alumno dado de baja.
 */
export async function reactivateStudentAction(
  studentId: string,
): Promise<void> {
  await requireAdmin("/admin/alumnos");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("students")
    .update({ is_active: true })
    .eq("id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/alumnos");
}

/**
 * Toggle is_active de una clase desde el listado.
 */
export async function toggleClassActiveAction(
  classId: string,
  newValue: boolean,
): Promise<void> {
  await requireAdmin("/admin/clases");
  const supabase = await createClient();

  await supabase.from("classes").update({ is_active: newValue }).eq("id", classId);

  // Al reactivar, aseguramos que existan sesiones fechadas próximas
  // (una clase puede llevar semanas pausada y quedarse sin sesiones futuras).
  if (newValue) {
    await supabase.rpc("ensure_class_sessions", {
      p_class_id: classId,
      p_weeks_ahead: 4,
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/clases");
  revalidatePath("/horarios");
  revalidatePath("/admin/clases");
}

/**
 * Prende/apaga si una clase se anuncia en el sitio público (dancebeat.studio).
 * No afecta si funciona en el sistema — eso es is_active, aparte.
 */
export async function toggleClassPublicAction(
  classId: string,
  newValue: boolean,
): Promise<void> {
  await requireAdmin("/admin/clases");
  const supabase = await createClient();

  await supabase.from("classes").update({ is_public: newValue }).eq("id", classId);

  revalidatePath("/", "layout");
  revalidatePath("/clases");
  revalidatePath("/horarios");
  revalidatePath("/admin/clases");
}

/**
 * Actualiza settings de la academia (key/value en BD).
 * Cada key se upserta individualmente.
 */
export async function updateSettingsAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin("/admin/configuracion");
  const supabase = await createClient();

  // Inscripción: usuario captura en MXN, BD guarda en centavos
  const enrollmentFeeMxn = parseFloat(
    formData.get("enrollment_fee_mxn") as string,
  );
  const lateFeePct = parseFloat(formData.get("late_fee_pct") as string);
  const lateFeeDay = parseInt(formData.get("late_fee_day_of_month") as string, 10);
  const cancelWindow = parseInt(formData.get("cancel_window_hours") as string, 10);
  const cycleWeeks = parseInt(formData.get("cycle_length_weeks") as string, 10);

  if (
    isNaN(enrollmentFeeMxn) ||
    isNaN(lateFeePct) ||
    isNaN(lateFeeDay) ||
    isNaN(cancelWindow) ||
    isNaN(cycleWeeks)
  ) {
    return { error: "Todos los campos numéricos son requeridos." };
  }

  if (lateFeeDay < 1 || lateFeeDay > 28) {
    return { error: "El día de recargo debe estar entre 1 y 28." };
  }

  const updates = [
    { key: "enrollment_fee_cents", value: String(Math.round(enrollmentFeeMxn * 100)) },
    { key: "late_fee_pct", value: String(lateFeePct) },
    { key: "late_fee_day_of_month", value: String(lateFeeDay) },
    { key: "cancel_window_hours", value: String(cancelWindow) },
    { key: "cycle_length_weeks", value: String(cycleWeeks) },
  ];

  for (const u of updates) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() });
    if (error) return { error: `${u.key}: ${error.message}` };
  }

  revalidatePath("/", "layout");
  revalidatePath("/planes");
  revalidatePath("/admin/configuracion");
  redirect("/admin/configuracion?saved=1");
}

/**
 * Crea un coreógrafo (teacher) y, si existe ya un profile con ese email,
 * lo vincula y promueve a role='teacher'. Si no existe, crea solo el
 * registro de catálogo y avisa que el usuario aún debe registrarse.
 */
export async function createTeacherAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin("/admin/coreografos");
  const supabase = await createClient();

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const bio = ((formData.get("bio_internal") as string) ?? "").trim();
  const photoUrl = ((formData.get("photo_url") as string) ?? "").trim();
  const hireDate = ((formData.get("hire_date") as string) ?? "").trim();

  if (!fullName) {
    return { error: "El nombre es obligatorio." };
  }

  let profileId: string | null = null;
  let warning: string | null = null;

  if (email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, email, full_name")
      .eq("email", email)
      .maybeSingle();

    if (profile) {
      profileId = profile.id;
      if (profile.role !== "admin") {
        const { error: roleErr } = await supabase
          .from("profiles")
          .update({ role: "teacher" })
          .eq("id", profile.id);
        if (roleErr) return { error: `Profile: ${roleErr.message}` };
      }
      // No bloquea el alta si el correo falla — solo se loguea.
      await sendTeacherWelcomeEmail({
        email: profile.email,
        name: profile.full_name || fullName,
      });
    } else {
      warning = `No existe un usuario registrado con ${email}. Pídele que cree su cuenta en /auth/registro con ese mismo email para vincularlo.`;
    }
  }

  const { error: teacherErr } = await supabase.from("teachers").insert({
    profile_id: profileId,
    full_name: fullName,
    bio_internal: bio || null,
    photo_url: photoUrl || null,
    hire_date: hireDate || null,
    is_active: true,
  });

  if (teacherErr) return { error: `Teacher: ${teacherErr.message}` };

  revalidatePath("/admin/coreografos");

  if (warning) {
    return { success: warning };
  }

  redirect("/admin/coreografos?saved=1");
}

/**
 * Vincula un teacher existente (sin profile_id) a un usuario que ya se
 * registró. Útil cuando el admin creó al coreógrafo antes de que el
 * usuario terminara su registro.
 */
export async function linkTeacherProfileAction(
  teacherId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin("/admin/coreografos");
  const supabase = await createClient();

  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email) return { error: "Email requerido." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, email, full_name")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return {
      error: `No hay un usuario registrado con ${email}. Pídele que cree su cuenta primero.`,
    };
  }

  // Asegurar que ningún otro teacher tenga ya ese profile_id
  const { data: clash } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (clash && clash.id !== teacherId) {
    return { error: "Ese usuario ya está vinculado a otro coreógrafo." };
  }

  const { error: tErr } = await supabase
    .from("teachers")
    .update({ profile_id: profile.id })
    .eq("id", teacherId);
  if (tErr) return { error: `Teacher: ${tErr.message}` };

  if (profile.role !== "admin") {
    const { error: rErr } = await supabase
      .from("profiles")
      .update({ role: "teacher" })
      .eq("id", profile.id);
    if (rErr) return { error: `Profile: ${rErr.message}` };
  }

  // No bloquea la vinculación si el correo falla — solo se loguea.
  await sendTeacherWelcomeEmail({
    email: profile.email,
    name: profile.full_name || email,
  });

  revalidatePath("/admin/coreografos");
  redirect("/admin/coreografos?saved=1");
}

/**
 * Toggle is_active de un coreógrafo (no destruye sus clases asignadas;
 * solo lo oculta de selectores futuros).
 */
export async function toggleTeacherActiveAction(
  teacherId: string,
  newValue: boolean,
): Promise<void> {
  await requireAdmin("/admin/coreografos");
  const supabase = await createClient();
  await supabase.from("teachers").update({ is_active: newValue }).eq("id", teacherId);
  revalidatePath("/admin/coreografos");
}

/**
 * Crea un plan nuevo desde /admin/planes/nueva.
 * El campo `code` es un slug único (a-z0-9_-) que el admin captura.
 * Después se puede editar todo lo demás desde /admin/planes/[id]/editar.
 */
export async function createPlanAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin("/admin/planes/nueva");
  const supabase = await createClient();

  const code = ((formData.get("code") as string) ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const name = (formData.get("name") as string)?.trim();
  const tagline = ((formData.get("tagline") as string) ?? "").trim();
  const priceMxn = parseFloat(formData.get("price_mxn") as string);
  const cadence = ((formData.get("cadence") as string) ?? "/mes").trim();
  const classesPerWeekStr = ((formData.get("classes_per_week") as string) ?? "").trim();
  const creditsPerMonthStr = ((formData.get("credits_per_month") as string) ?? "").trim();
  const perksRaw = (formData.get("perks") as string) ?? "";
  const featured = formData.get("featured") === "on";
  const isActive = formData.get("is_active") !== "off"; // default ON

  if (!code || !/^[a-z0-9_-]+$/.test(code)) {
    return {
      error: "El código debe contener solo letras minúsculas, números, guiones o guiones bajos (sin espacios).",
    };
  }
  if (!name) {
    return { error: "El nombre es obligatorio." };
  }
  if (isNaN(priceMxn) || priceMxn <= 0) {
    return { error: "El precio debe ser un número mayor que 0." };
  }

  // Verificar unicidad del code
  const { data: existing } = await supabase
    .from("plans")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (existing) {
    return { error: `Ya existe un plan con el código "${code}". Elige otro.` };
  }

  const perks = perksRaw
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // Calcular display_order como max + 1 para que aparezca al final
  const { data: lastOrder } = await supabase
    .from("plans")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const displayOrder = (lastOrder?.display_order ?? 0) + 1;

  const { error } = await supabase.from("plans").insert({
    code,
    name,
    tagline: tagline || null,
    price_cents: Math.round(priceMxn * 100),
    cadence: cadence || "/mes",
    classes_per_week: classesPerWeekStr ? parseInt(classesPerWeekStr, 10) : null,
    credits_per_month: creditsPerMonthStr ? parseInt(creditsPerMonthStr, 10) : null,
    perks,
    featured,
    is_active: isActive,
    display_order: displayOrder,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/planes");
  revalidatePath("/admin/planes");
  redirect("/admin/planes?saved=1");
}

/**
 * Actualiza un plan (precio, perks, copy, etc.).
 */
export async function updatePlanAction(
  planId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin(`/admin/planes/${planId}/editar`);
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const tagline = (formData.get("tagline") as string)?.trim();
  const priceMxn = parseFloat(formData.get("price_mxn") as string);
  const cadence = (formData.get("cadence") as string)?.trim();
  const classesPerWeekStr = (formData.get("classes_per_week") as string)?.trim();
  const creditsPerMonthStr = (formData.get("credits_per_month") as string)?.trim();
  const perksRaw = (formData.get("perks") as string) ?? "";
  const featured = formData.get("featured") === "on";
  const isActive = formData.get("is_active") === "on";

  if (!name || isNaN(priceMxn) || priceMxn <= 0) {
    return { error: "Nombre y precio son requeridos." };
  }

  // Perks: textarea con un perk por línea
  const perks = perksRaw
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("plans")
    .update({
      name,
      tagline: tagline || null,
      price_cents: Math.round(priceMxn * 100),
      cadence: cadence || "/mes",
      classes_per_week: classesPerWeekStr ? parseInt(classesPerWeekStr, 10) : null,
      credits_per_month: creditsPerMonthStr ? parseInt(creditsPerMonthStr, 10) : null,
      perks,
      featured,
      is_active: isActive,
    })
    .eq("id", planId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/planes");
  revalidatePath("/admin/planes");
  redirect("/admin/planes?saved=1");
}
