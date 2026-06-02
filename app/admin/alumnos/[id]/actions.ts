"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type SubscriptionInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];

export type SubFormState = { error?: string; success?: string } | null;

/**
 * Crea o reemplaza la suscripción ACTIVA de un student.
 * Pre-Stripe: el admin captura plan, créditos asignados y ciclo a mano.
 *
 * Estrategia: si el student ya tiene una sub `active`, se cancela
 * (status='cancelled') y se inserta la nueva. Así no rompemos historial.
 */
export async function upsertStudentSubscriptionAction(
  studentId: string,
  _prev: SubFormState,
  formData: FormData,
): Promise<SubFormState> {
  await requireAdmin(`/admin/alumnos/${studentId}`);
  const supabase = await createClient();

  const planId = ((formData.get("plan_id") as string) ?? "").trim();
  const creditsTotalRaw = ((formData.get("credits_total") as string) ?? "").trim();
  const creditsRemainingRaw =
    ((formData.get("credits_remaining") as string) ?? "").trim();
  const cycleStartRaw = ((formData.get("cycle_start_at") as string) ?? "").trim();
  const cycleEndRaw = ((formData.get("cycle_end_at") as string) ?? "").trim();

  if (!planId) return { error: "Selecciona un plan." };
  if (!cycleStartRaw || !cycleEndRaw) {
    return { error: "Indica fechas de inicio y fin del ciclo." };
  }

  const creditsTotal = parseInt(creditsTotalRaw, 10);
  const creditsRemaining = creditsRemainingRaw
    ? parseInt(creditsRemainingRaw, 10)
    : creditsTotal;
  if (isNaN(creditsTotal) || creditsTotal < 0) {
    return { error: "Créditos totales debe ser un número ≥ 0." };
  }
  if (isNaN(creditsRemaining) || creditsRemaining < 0) {
    return { error: "Créditos restantes debe ser un número ≥ 0." };
  }

  const start = new Date(cycleStartRaw + "T00:00:00").toISOString();
  const end = new Date(cycleEndRaw + "T23:59:59").toISOString();

  // Cancelar la activa previa (si existe) y crear nueva
  const { error: cancelErr } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("student_id", studentId)
    .eq("status", "active");

  if (cancelErr) return { error: `Cancelar previa: ${cancelErr.message}` };

  const insert: SubscriptionInsert = {
    student_id: studentId,
    plan_id: planId,
    status: "active",
    credits_total: creditsTotal,
    credits_remaining: creditsRemaining,
    cycle_start_at: start,
    cycle_end_at: end,
  };

  const { error: insertErr } = await supabase
    .from("subscriptions")
    .insert(insert);

  if (insertErr) return { error: insertErr.message };

  revalidatePath(`/admin/alumnos/${studentId}`);
  revalidatePath("/admin/alumnos");
  revalidatePath("/app");
  return { success: "Suscripción activa actualizada." };
}

export async function cancelStudentSubscriptionAction(
  studentId: string,
  subscriptionId: string,
): Promise<{ error?: string }> {
  await requireAdmin(`/admin/alumnos/${studentId}`);
  const supabase = await createClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", subscriptionId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/alumnos/${studentId}`);
  revalidatePath("/app");
  return {};
}

export async function adjustCreditsAction(
  studentId: string,
  subscriptionId: string,
  delta: number,
): Promise<{ error?: string }> {
  await requireAdmin(`/admin/alumnos/${studentId}`);
  const supabase = await createClient();

  // Read current value
  const { data: sub, error: readErr } = await supabase
    .from("subscriptions")
    .select("credits_remaining")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (readErr) return { error: readErr.message };
  if (!sub) return { error: "Suscripción no encontrada." };

  const next = Math.max(0, sub.credits_remaining + delta);
  const { error } = await supabase
    .from("subscriptions")
    .update({ credits_remaining: next })
    .eq("id", subscriptionId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/alumnos/${studentId}`);
  revalidatePath("/app");
  return {};
}
