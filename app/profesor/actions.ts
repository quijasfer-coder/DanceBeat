"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth";

export type ProfesorActionState = { error?: string; success?: string } | null;

/**
 * Genera N semanas de sesiones para una clase. Idempotente
 * (no duplica fechas existentes). Llamada desde un form en /profesor/[classId].
 */
export async function ensureSessionsAction(
  classId: string,
  _prev: ProfesorActionState,
  formData: FormData,
): Promise<ProfesorActionState> {
  await requireTeacher(`/profesor/${classId}`);
  const supabase = await createClient();

  const weeks = parseInt(
    (formData.get("weeks") as string) || "4",
    10,
  );

  const { data, error } = await supabase.rpc("ensure_class_sessions", {
    p_class_id: classId,
    p_weeks_ahead: isNaN(weeks) ? 4 : Math.min(Math.max(weeks, 1), 26),
  });

  if (error) return { error: error.message };

  revalidatePath(`/profesor/${classId}`);
  revalidatePath("/profesor");
  return {
    success: data
      ? `${data} sesion${data === 1 ? "" : "es"} nueva${data === 1 ? "" : "s"} generada${data === 1 ? "" : "s"}.`
      : "Las sesiones de las próximas semanas ya existían.",
  };
}

/**
 * Actualiza el propio perfil del coreógrafo logueado: nombre, foto y
 * contacto de emergencia. El RLS de `teachers_update_own` solo deja
 * tocar la fila cuyo profile_id sea el del usuario en sesión.
 */
export async function updateOwnTeacherProfileAction(
  _prev: ProfesorActionState,
  formData: FormData,
): Promise<ProfesorActionState> {
  const profile = await requireTeacher("/profesor/perfil");
  const supabase = await createClient();

  const fullName = (formData.get("full_name") as string)?.trim();
  const photoUrl = ((formData.get("photo_url") as string) ?? "").trim();
  const emergencyName = (
    (formData.get("emergency_contact_name") as string) ?? ""
  ).trim();
  const emergencyPhone = (
    (formData.get("emergency_contact_phone") as string) ?? ""
  ).trim();

  if (!fullName) {
    return { error: "El nombre es obligatorio." };
  }

  const { error } = await supabase
    .from("teachers")
    .update({
      full_name: fullName,
      photo_url: photoUrl || null,
      emergency_contact_name: emergencyName || null,
      emergency_contact_phone: emergencyPhone || null,
    })
    .eq("profile_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/profesor/perfil");
  revalidatePath("/profesor");
  return { success: "Perfil actualizado." };
}

/**
 * Marca asistencia o no_show de una reserva.
 * El RPC valida internamente que el caller sea el profesor de la sesión.
 */
export async function markAttendanceAction(
  bookingId: string,
  attended: boolean,
  sessionId: string,
): Promise<{ error?: string }> {
  await requireTeacher(`/profesor/sesion/${sessionId}`);
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_attendance", {
    p_booking_id: bookingId,
    p_attended: attended,
  });

  if (error) return { error: error.message };

  revalidatePath(`/profesor/sesion/${sessionId}`);
  return {};
}
