"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type BookingResult = { ok: true } | { ok: false; error: string };

const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Tu sesión expiró. Vuelve a iniciar sesión.",
  NOT_OWNER: "Esa alumna no pertenece a tu cuenta.",
  STUDENT_NOT_FOUND: "No encontramos a la alumna.",
  SESSION_NOT_FOUND: "Esa clase ya no existe.",
  SESSION_NOT_BOOKABLE: "Esa clase fue cancelada y no se puede reservar.",
  SESSION_PAST: "La clase ya empezó. Refresca la página.",
  CLASS_FULL: "La clase llegó a su cupo máximo.",
  NO_SUBSCRIPTION:
    "Esta alumna no tiene un plan activo. Contacta a la academia para asignarte uno.",
  NO_CREDITS:
    "No te quedan créditos este ciclo. Espera al próximo ciclo o cambia de plan.",
  ALREADY_BOOKED: "Ya tienes reserva para esta clase.",
};

function mapPgError(raw: string): string {
  // Postgres devuelve mensajes tipo: 'CLASS_FULL' o 'CLASS_FULL\n…detalle'
  const code = raw.split(/[\n:]/)[0].trim();
  return ERROR_MESSAGES[code] ?? raw;
}

export async function bookClassAction(
  sessionId: string,
  studentId: string,
): Promise<BookingResult> {
  await requireAuth("/app/reservar");
  const supabase = await createClient();

  const { error } = await supabase.rpc("book_class", {
    p_session_id: sessionId,
    p_student_id: studentId,
  });

  if (error) {
    return { ok: false, error: mapPgError(error.message) };
  }

  revalidatePath("/app/reservar");
  revalidatePath("/app/reservas");
  revalidatePath("/app");
  return { ok: true };
}

export async function cancelBookingAction(
  bookingId: string,
): Promise<BookingResult> {
  await requireAuth("/app/reservas");
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
  });

  if (error) {
    return { ok: false, error: mapPgError(error.message) };
  }

  revalidatePath("/app/reservar");
  revalidatePath("/app/reservas");
  revalidatePath("/app");
  return { ok: true };
}
