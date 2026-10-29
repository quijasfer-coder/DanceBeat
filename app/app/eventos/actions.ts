"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

type RsvpResult = { ok: true } | { ok: false; error: string };

/**
 * La alumna (o su mamá) confirma o declina una invitación a evento.
 * Solo toca `status`, solo entre invited/confirmed/declined, y solo si el
 * evento está publicado y todavía no empieza. El RLS
 * (event_assignments_owner_rsvp) garantiza que sea su propia asignación.
 */
export async function rsvpEventAction(
  assignmentId: string,
  status: "confirmed" | "declined",
): Promise<RsvpResult> {
  await requireAuth("/app/eventos");
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("event_assignments")
    .select("id, status, event:events(starts_at, is_published)")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment || !assignment.event || !assignment.event.is_published) {
    return { ok: false, error: "No encontramos esta invitación." };
  }
  if (!["invited", "confirmed", "declined"].includes(assignment.status)) {
    return { ok: false, error: "Esta invitación ya no se puede modificar." };
  }
  if (new Date(assignment.event.starts_at) <= new Date()) {
    return { ok: false, error: "Este evento ya comenzó." };
  }

  const { error } = await supabase
    .from("event_assignments")
    .update({ status })
    .eq("id", assignmentId);

  if (error) return { ok: false, error: "No se pudo guardar tu respuesta." };

  revalidatePath("/app/eventos");
  return { ok: true };
}
