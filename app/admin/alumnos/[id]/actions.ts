"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type SubscriptionInsert =
  Database["public"]["Tables"]["subscriptions"]["Insert"];
type PaymentMethod = "cash" | "transfer" | "tpv";

export type SubFormState = { error?: string; success?: string } | null;

/**
 * Renueva la suscripción de un student Y registra el cobro en el mismo
 * paso — antes eran dos cosas separadas (asignar plan a mano, sin
 * ningún registro de pago). Estrategia igual que antes: si ya tiene una
 * sub `active`, se cancela y se inserta la nueva; el pago queda ligado
 * a la suscripción nueva.
 */
export async function renewSubscriptionAction(
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
  const paymentMethod = ((formData.get("payment_method") as string) ?? "").trim() as
    | PaymentMethod
    | "";
  const amountMxnRaw = ((formData.get("amount_mxn") as string) ?? "").trim();

  if (!planId) return { error: "Selecciona un plan." };
  if (!cycleStartRaw || !cycleEndRaw) {
    return { error: "Indica fechas de inicio y fin del ciclo." };
  }
  if (!paymentMethod) return { error: "Selecciona el método de pago." };

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

  const amountMxn = parseFloat(amountMxnRaw);
  if (isNaN(amountMxn) || amountMxn <= 0) {
    return { error: "Indica el monto cobrado." };
  }
  const amountCents = Math.round(amountMxn * 100);

  const start = new Date(cycleStartRaw + "T00:00:00").toISOString();
  const end = new Date(cycleEndRaw + "T23:59:59").toISOString();

  const { data: studentRow, error: studentErr } = await supabase
    .from("students")
    .select("account_id")
    .eq("id", studentId)
    .maybeSingle();
  if (studentErr) return { error: studentErr.message };
  if (!studentRow) return { error: "Esa alumna ya no existe." };

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

  const { data: newSub, error: insertErr } = await supabase
    .from("subscriptions")
    .insert(insert)
    .select("id")
    .single();

  if (insertErr || !newSub) {
    return { error: insertErr?.message ?? "No se pudo crear la suscripción." };
  }

  const { error: payErr } = await supabase.from("payments").insert({
    account_id: studentRow.account_id,
    student_id: studentId,
    subscription_id: newSub.id,
    kind: "monthly",
    amount_cents: amountCents,
    status: "succeeded",
    method: paymentMethod,
    paid_at: new Date().toISOString(),
  });

  if (payErr) return { error: `Pago: ${payErr.message}` };

  revalidatePath(`/admin/alumnos/${studentId}`);
  revalidatePath("/admin/alumnos");
  revalidatePath("/app");
  return { success: "Suscripción renovada y pago registrado — sus clases ya están habilitadas." };
}

/**
 * Asigna qué tipo de inscripción le toca a una alumna (define el monto
 * que se cobrará al marcar su inscripción como pagada).
 */
export async function setStudentEnrollmentTypeAction(
  studentId: string,
  enrollmentTypeId: string,
): Promise<{ error?: string }> {
  await requireAdmin(`/admin/alumnos/${studentId}`);
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({ enrollment_type_id: enrollmentTypeId || null })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/alumnos/${studentId}`);
  return {};
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
