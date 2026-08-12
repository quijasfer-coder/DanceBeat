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
  photo_url?: string;
  curp_pdf_path?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  mother_name?: string;
  mother_phone?: string;
  father_name?: string;
  father_phone?: string;
  photo_video_consent?: boolean;
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

  const now = new Date().toISOString();

  const rows = students.map((s) => {
    const consent = s.photo_video_consent === true;
    return {
      account_id: profile.id,
      full_name: s.full_name.trim(),
      birthdate: s.birthdate,
      phone: s.phone?.trim() || null,
      school: s.school?.trim() || null,
      grade: s.grade?.trim() || null,
      notes: s.notes?.trim() || null,
      is_self: s.is_self === true,
      photo_url: s.photo_url?.trim() || null,
      curp_pdf_path: s.curp_pdf_path?.trim() || null,
      emergency_contact_name: s.emergency_contact_name?.trim() || null,
      emergency_contact_phone: s.emergency_contact_phone?.trim() || null,
      mother_name: s.mother_name?.trim() || null,
      mother_phone: s.mother_phone?.trim() || null,
      father_name: s.father_name?.trim() || null,
      father_phone: s.father_phone?.trim() || null,
      photo_video_consent: consent,
      photo_video_consent_at: consent ? now : null,
    };
  });

  const { error } = await supabase.from("students").insert(rows);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app", "layout");
  redirect("/app");
}

export type UpdateStudentState = { error?: string } | null;

/**
 * Edita un alumno ya existente — el titular de la cuenta puede completar
 * o corregir datos después del onboarding (foto, CURP, contacto de
 * emergencia, padres, etc.) sin tener que recrear al alumno.
 */
export async function updateStudentAction(
  studentId: string,
  _prev: UpdateStudentState,
  formData: FormData,
): Promise<UpdateStudentState> {
  const profile = await requireAuth(`/app/alumno/${studentId}/editar`);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("students")
    .select("id, account_id, photo_video_consent")
    .eq("id", studentId)
    .maybeSingle();

  if (!existing || existing.account_id !== profile.id) {
    return { error: "No se encontró ese alumno en tu cuenta." };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const birthdate = (formData.get("birthdate") as string)?.trim();
  if (!fullName || !birthdate) {
    return { error: "Nombre y fecha de nacimiento son obligatorios." };
  }

  const consent = formData.get("photo_video_consent") === "on";
  const consentChanged = consent !== existing.photo_video_consent;

  const { error } = await supabase
    .from("students")
    .update({
      full_name: fullName,
      birthdate,
      phone: ((formData.get("phone") as string) ?? "").trim() || null,
      school: ((formData.get("school") as string) ?? "").trim() || null,
      grade: ((formData.get("grade") as string) ?? "").trim() || null,
      notes: ((formData.get("notes") as string) ?? "").trim() || null,
      photo_url: ((formData.get("photo_url") as string) ?? "").trim() || null,
      curp_pdf_path:
        ((formData.get("curp_pdf_path") as string) ?? "").trim() || null,
      emergency_contact_name:
        ((formData.get("emergency_contact_name") as string) ?? "").trim() || null,
      emergency_contact_phone:
        ((formData.get("emergency_contact_phone") as string) ?? "").trim() || null,
      mother_name: ((formData.get("mother_name") as string) ?? "").trim() || null,
      mother_phone: ((formData.get("mother_phone") as string) ?? "").trim() || null,
      father_name: ((formData.get("father_name") as string) ?? "").trim() || null,
      father_phone: ((formData.get("father_phone") as string) ?? "").trim() || null,
      photo_video_consent: consent,
      ...(consentChanged
        ? { photo_video_consent_at: consent ? new Date().toISOString() : null }
        : {}),
    })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/app", "layout");
  redirect("/app");
}
