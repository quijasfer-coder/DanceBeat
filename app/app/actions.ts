"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type OnboardingState = { error?: string } | null;

export type StudentInput = {
  full_name: string;
  birthdate: string;
  phone?: string;
  school?: string;
  grade?: string;
  notes?: string;
  is_self?: boolean;
};

/**
 * Crea N students asociados a la cuenta del usuario actual.
 * Usado por el wizard de onboarding (un papá puede registrar a varios hijos).
 */
export async function createStudentsAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const profile = await requireAuth("/app/onboarding");
  const supabase = await createClient();

  const studentsRaw = formData.get("students_json") as string;
  if (!studentsRaw) {
    return { error: "No se enviaron alumnos." };
  }

  let students: StudentInput[];
  try {
    students = JSON.parse(studentsRaw);
  } catch {
    return { error: "Error procesando los datos de los alumnos." };
  }

  if (!Array.isArray(students) || students.length === 0) {
    return { error: "Agrega al menos un alumno." };
  }

  // Validación básica
  for (const s of students) {
    if (!s.full_name?.trim() || !s.birthdate) {
      return { error: "Cada alumno necesita nombre completo y fecha de nacimiento." };
    }
  }

  const rows = students.map((s) => ({
    account_id: profile.id,
    full_name: s.full_name.trim(),
    birthdate: s.birthdate,
    phone: s.phone?.trim() || null,
    school: s.school?.trim() || null,
    grade: s.grade?.trim() || null,
    notes: s.notes?.trim() || null,
    is_self: s.is_self === true,
  }));

  const { error } = await supabase.from("students").insert(rows);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app", "layout");
  redirect("/app");
}
