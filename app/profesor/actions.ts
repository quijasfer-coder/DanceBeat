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
