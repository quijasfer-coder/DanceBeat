"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type ApproveResult = { ok: true } | { ok: false; error: string };

const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: "Tu sesión expiró.",
  NOT_ADMIN: "No tienes permisos.",
  ACCOUNT_NOT_FOUND: "Esa cuenta ya no existe.",
  STUDENT_NOT_FOUND: "Esa alumna ya no existe.",
  NO_ENROLLMENT_TYPE: "Primero asigna un tipo de inscripción a la alumna.",
};

function mapPgError(raw: string): string {
  const code = raw.split(/[\n:]/)[0].trim();
  return ERROR_MESSAGES[code] ?? raw;
}

export async function approveAccountAction(
  accountId: string,
): Promise<ApproveResult> {
  await requireAdmin("/admin/solicitudes");
  const supabase = await createClient();

  const { error } = await supabase.rpc("approve_account", {
    p_account_id: accountId,
  });

  if (error) return { ok: false, error: mapPgError(error.message) };

  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/alumnos");
  revalidatePath(`/admin/alumnos/${accountId}`);
  return { ok: true };
}

export async function rejectAccountAction(
  accountId: string,
  reason: string | null,
): Promise<ApproveResult> {
  await requireAdmin("/admin/solicitudes");
  const supabase = await createClient();

  const { error } = await supabase.rpc("reject_account", {
    p_account_id: accountId,
    p_reason: reason ?? undefined,
  });

  if (error) return { ok: false, error: mapPgError(error.message) };

  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/alumnos");
  revalidatePath(`/admin/alumnos/${accountId}`);
  return { ok: true };
}

export async function markEnrollmentPaidAction(
  studentId: string,
  method: "cash" | "transfer" | "tpv",
): Promise<ApproveResult> {
  await requireAdmin("/admin/solicitudes");
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_enrollment_paid", {
    p_student_id: studentId,
    p_method: method,
  });

  if (error) return { ok: false, error: mapPgError(error.message) };

  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/alumnos");
  revalidatePath(`/admin/alumnos/${studentId}`);
  return { ok: true };
}
