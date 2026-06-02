"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type AuditionStatus = Database["public"]["Enums"]["audition_status"];
type AuditionUpdate =
  Database["public"]["Tables"]["audition_applications"]["Update"];

export type AuditionAdminFormState =
  | { error?: string; success?: string }
  | null;

const REVIEWED_STATUSES: AuditionStatus[] = [
  "shortlist",
  "accepted",
  "rejected",
];

export async function setAuditionStatusAction(
  applicationId: string,
  status: AuditionStatus,
): Promise<{ error?: string }> {
  const profile = await requireAdmin("/admin/audiciones");
  const supabase = await createClient();

  const patch: AuditionUpdate = { status };

  // Sellar reviewed_at/by cuando pasa a un estado de decisión
  if (REVIEWED_STATUSES.includes(status)) {
    patch.reviewed_at = new Date().toISOString();
    patch.reviewed_by = profile.id;
  }

  const { error } = await supabase
    .from("audition_applications")
    .update(patch)
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath("/admin/audiciones");
  revalidatePath(`/admin/audiciones/${applicationId}`);
  return {};
}

export async function updateAuditionNotesAction(
  applicationId: string,
  _prev: AuditionAdminFormState,
  formData: FormData,
): Promise<AuditionAdminFormState> {
  await requireAdmin(`/admin/audiciones/${applicationId}`);
  const supabase = await createClient();

  const notes = ((formData.get("notes") as string) ?? "").trim();
  const { error } = await supabase
    .from("audition_applications")
    .update({ notes: notes || null })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/audiciones/${applicationId}`);
  return { success: "Notas guardadas." };
}

export async function deleteAuditionAction(
  applicationId: string,
): Promise<void> {
  await requireAdmin("/admin/audiciones");
  const supabase = await createClient();
  await supabase
    .from("audition_applications")
    .delete()
    .eq("id", applicationId);
  revalidatePath("/admin/audiciones");
}

/**
 * Toggle del setting `impulse_auditions_open`. Recibe el nuevo valor
 * desde la UI (string "true" | "false").
 */
export async function toggleAuditionsOpenAction(
  newValue: boolean,
): Promise<{ error?: string }> {
  await requireAdmin("/admin/audiciones");
  const supabase = await createClient();

  const { error } = await supabase
    .from("settings")
    .upsert({
      key: "impulse_auditions_open",
      value: newValue ? "true" : "false",
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/admin/audiciones");
  revalidatePath("/impulse");
  revalidatePath("/impulse/audiciones");
  return {};
}

export async function updateAuditionsClosedMessageAction(
  _prev: AuditionAdminFormState,
  formData: FormData,
): Promise<AuditionAdminFormState> {
  await requireAdmin("/admin/audiciones");
  const supabase = await createClient();

  const message = ((formData.get("message") as string) ?? "").trim();
  if (!message) {
    return { error: "El mensaje no puede estar vacío." };
  }

  const { error } = await supabase
    .from("settings")
    .upsert({
      key: "impulse_auditions_message",
      value: message,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/admin/audiciones");
  revalidatePath("/impulse");
  revalidatePath("/impulse/audiciones");
  return { success: "Mensaje actualizado." };
}
