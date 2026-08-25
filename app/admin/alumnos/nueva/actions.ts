"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type AdminNewStudentState = { error?: string } | null;

/**
 * El admin registra una alumna en la cuenta de un titular que ya existe —
 * típicamente porque el padre creó su cuenta pensando que eso ya era "el
 * registro" y nunca completó el onboarding. Requiere la policy
 * students_insert_own_or_admin (migración 20260824140000).
 */
export async function adminCreateStudentAction(
  _prev: AdminNewStudentState,
  formData: FormData,
): Promise<AdminNewStudentState> {
  await requireAdmin("/admin/alumnos/nueva");
  const supabase = await createClient();

  const accountId = (formData.get("account_id") as string)?.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const birthdate = (formData.get("birthdate") as string)?.trim();
  const returnTo = (formData.get("return_to") as string) || "/admin/alumnos";

  if (!accountId) {
    return { error: "Elige a qué cuenta pertenece esta alumna." };
  }
  if (!fullName || !birthdate) {
    return { error: "Nombre completo y fecha de nacimiento son obligatorios." };
  }

  const { data: student, error } = await supabase
    .from("students")
    .insert({
      account_id: accountId,
      full_name: fullName,
      birthdate,
      phone: ((formData.get("phone") as string) ?? "").trim() || null,
      school: ((formData.get("school") as string) ?? "").trim() || null,
      grade: ((formData.get("grade") as string) ?? "").trim() || null,
      notes: ((formData.get("notes") as string) ?? "").trim() || null,
      emergency_contact_name:
        ((formData.get("emergency_contact_name") as string) ?? "").trim() ||
        null,
      emergency_contact_phone:
        ((formData.get("emergency_contact_phone") as string) ?? "").trim() ||
        null,
      mother_name: ((formData.get("mother_name") as string) ?? "").trim() || null,
      mother_phone:
        ((formData.get("mother_phone") as string) ?? "").trim() || null,
      father_name: ((formData.get("father_name") as string) ?? "").trim() || null,
      father_phone:
        ((formData.get("father_phone") as string) ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/alumnos");
  revalidatePath("/admin/solicitudes");
  redirect(`/admin/alumnos/${student.id}?creada=1&return_to=${encodeURIComponent(returnTo)}`);
}
