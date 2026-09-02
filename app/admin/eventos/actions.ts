"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type EventKind = Database["public"]["Enums"]["event_kind"];
type AssignmentStatus = Database["public"]["Enums"]["event_assignment_status"];
type PaymentStatus = Database["public"]["Enums"]["event_payment_status"];
type AssignmentUpdate = Database["public"]["Tables"]["event_assignments"]["Update"];

export type EventFormState = { error?: string; success?: string } | null;

// ─────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────

function parseDateTimeLocal(raw: string | null | undefined): string | null {
  // datetime-local devuelve "2026-05-15T19:30" (sin zona horaria) — eso
  // es hora de CDMX, no UTC. Sin anexar el offset, `new Date(raw)` en el
  // server (Vercel corre en UTC) lo interpreta como 19:30 UTC = 13:30
  // CDMX, guardando la hora 6h antes de lo que tecleó el admin.
  // México no usa horario de verano desde 2022 — -06:00 es fijo todo el año.
  if (!raw) return null;
  const d = new Date(`${raw}:00-06:00`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────
//  CREATE / UPDATE EVENT
// ─────────────────────────────────────────────────────────────────────

function readEventForm(formData: FormData): {
  values?: {
    kind: EventKind;
    title: string;
    description: string | null;
    requirements: string | null;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    studio_id: string | null;
    cost_cents: number | null;
    is_published: boolean;
  };
  error?: string;
} {
  const kind = formData.get("kind") as EventKind;
  const title = (formData.get("title") as string)?.trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const requirements = ((formData.get("requirements") as string) ?? "").trim();
  const startsAtRaw = (formData.get("starts_at") as string)?.trim();
  const endsAtRaw = ((formData.get("ends_at") as string) ?? "").trim();
  const location = ((formData.get("location") as string) ?? "").trim();
  const studioIdRaw = (formData.get("studio_id") as string) ?? "";
  const costMxnRaw = ((formData.get("cost_mxn") as string) ?? "").trim();
  const isPublished = formData.get("is_published") === "on";

  if (!title) return { error: "El título es obligatorio." };
  if (!startsAtRaw) return { error: "La fecha de inicio es obligatoria." };
  if (!kind) return { error: "Selecciona el tipo de evento." };

  const startsAt = parseDateTimeLocal(startsAtRaw);
  if (!startsAt) return { error: "Fecha de inicio inválida." };

  let endsAt: string | null = null;
  if (endsAtRaw) {
    endsAt = parseDateTimeLocal(endsAtRaw);
    if (!endsAt) return { error: "Fecha de fin inválida." };
    if (new Date(endsAt) < new Date(startsAt)) {
      return { error: "La fecha de fin debe ser posterior a la de inicio." };
    }
  }

  let costCents: number | null = null;
  if (costMxnRaw) {
    const mxn = parseFloat(costMxnRaw);
    if (isNaN(mxn) || mxn < 0) {
      return { error: "El costo debe ser un número mayor o igual a 0." };
    }
    costCents = mxn === 0 ? null : Math.round(mxn * 100);
  }

  return {
    values: {
      kind,
      title,
      description: description || null,
      requirements: requirements || null,
      starts_at: startsAt,
      ends_at: endsAt,
      location: location || null,
      studio_id: studioIdRaw && studioIdRaw !== "none" ? studioIdRaw : null,
      cost_cents: costCents,
      is_published: isPublished,
    },
  };
}

export async function createEventAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin("/admin/eventos/nuevo");
  const supabase = await createClient();

  const parsed = readEventForm(formData);
  if (parsed.error || !parsed.values) return { error: parsed.error };

  const { data, error } = await supabase
    .from("events")
    .insert(parsed.values)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/eventos");
  redirect(`/admin/eventos/${data.id}`);
}

export async function updateEventAction(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin(`/admin/eventos/${eventId}`);
  const supabase = await createClient();

  const parsed = readEventForm(formData);
  if (parsed.error || !parsed.values) return { error: parsed.error };

  const { error } = await supabase
    .from("events")
    .update(parsed.values)
    .eq("id", eventId);

  if (error) return { error: error.message };

  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${eventId}`);
  return { success: "Evento actualizado." };
}

export async function deleteEventAction(eventId: string): Promise<void> {
  await requireAdmin("/admin/eventos");
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", eventId);
  revalidatePath("/admin/eventos");
  redirect("/admin/eventos");
}

// ─────────────────────────────────────────────────────────────────────
//  ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────

export type AssignFormState = { error?: string; success?: string } | null;

export async function assignByClassAction(
  eventId: string,
  _prev: AssignFormState,
  formData: FormData,
): Promise<AssignFormState> {
  await requireAdmin(`/admin/eventos/${eventId}`);
  const supabase = await createClient();

  const classId = (formData.get("class_id") as string)?.trim();
  if (!classId) return { error: "Selecciona una clase." };

  const { data, error } = await supabase.rpc("bulk_assign_event_by_class", {
    p_event_id: eventId,
    p_class_id: classId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/eventos/${eventId}`);
  return {
    success: data
      ? `${data} alumna${data === 1 ? "" : "s"} asignada${data === 1 ? "" : "s"} desde la clase.`
      : "No había alumnas nuevas en esa clase para asignar.",
  };
}

export async function assignManualAction(
  eventId: string,
  _prev: AssignFormState,
  formData: FormData,
): Promise<AssignFormState> {
  await requireAdmin(`/admin/eventos/${eventId}`);
  const supabase = await createClient();

  const studentIds = formData.getAll("student_ids") as string[];
  if (studentIds.length === 0) {
    return { error: "Selecciona al menos una alumna." };
  }

  const rows = studentIds.map((id) => ({ event_id: eventId, student_id: id }));
  // upsert evita errores de duplicados; ignora los ya asignados
  const { error } = await supabase
    .from("event_assignments")
    .upsert(rows, { onConflict: "event_id,student_id", ignoreDuplicates: true });

  if (error) return { error: error.message };

  revalidatePath(`/admin/eventos/${eventId}`);
  return {
    success: `${studentIds.length} alumna${studentIds.length === 1 ? "" : "s"} agregada${studentIds.length === 1 ? "" : "s"}.`,
  };
}

export async function removeAssignmentAction(
  assignmentId: string,
  eventId: string,
): Promise<void> {
  await requireAdmin(`/admin/eventos/${eventId}`);
  const supabase = await createClient();
  await supabase.from("event_assignments").delete().eq("id", assignmentId);
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function setAssignmentStatusAction(
  assignmentId: string,
  eventId: string,
  status: AssignmentStatus,
): Promise<{ error?: string }> {
  await requireAdmin(`/admin/eventos/${eventId}`);
  const supabase = await createClient();

  const patch: AssignmentUpdate = { status };
  if (status === "attended") {
    patch.attended_at = new Date().toISOString();
  } else if (status === "no_show") {
    patch.attended_at = null;
  }

  const { error } = await supabase
    .from("event_assignments")
    .update(patch)
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}

export async function setPaymentStatusAction(
  assignmentId: string,
  eventId: string,
  status: PaymentStatus,
  method: string | null = null,
): Promise<{ error?: string }> {
  await requireAdmin(`/admin/eventos/${eventId}`);
  const supabase = await createClient();

  const patch: AssignmentUpdate = {
    payment_status: status,
    payment_method: status === "paid" ? method : null,
    paid_at: status === "paid" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("event_assignments")
    .update(patch)
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/eventos/${eventId}`);
  return {};
}
