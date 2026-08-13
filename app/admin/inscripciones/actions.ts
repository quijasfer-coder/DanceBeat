"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type EnrollmentTypeFormState = { error?: string; success?: string } | null;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createEnrollmentTypeAction(
  _prev: EnrollmentTypeFormState,
  formData: FormData,
): Promise<EnrollmentTypeFormState> {
  await requireAdmin("/admin/inscripciones");
  const supabase = await createClient();

  const name = ((formData.get("name") as string) ?? "").trim();
  const priceMxnRaw = ((formData.get("price_mxn") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();

  if (!name) return { error: "El nombre es obligatorio." };
  const priceMxn = parseFloat(priceMxnRaw);
  if (isNaN(priceMxn) || priceMxn <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const code = slugify(name);
  if (!code) return { error: "No se pudo generar un código válido del nombre." };

  const { data: lastOrder } = await supabase
    .from("enrollment_types")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const displayOrder = (lastOrder?.display_order ?? 0) + 1;

  const { error } = await supabase.from("enrollment_types").insert({
    code,
    name,
    price_cents: Math.round(priceMxn * 100),
    description: description || null,
    display_order: displayOrder,
  });

  if (error) {
    if (error.message.includes("enrollment_types_code_key")) {
      return { error: `Ya existe un tipo de inscripción llamado "${name}".` };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/inscripciones");
  return { success: "Tipo de inscripción creado." };
}

export async function updateEnrollmentTypeAction(
  id: string,
  _prev: EnrollmentTypeFormState,
  formData: FormData,
): Promise<EnrollmentTypeFormState> {
  await requireAdmin("/admin/inscripciones");
  const supabase = await createClient();

  const name = ((formData.get("name") as string) ?? "").trim();
  const priceMxnRaw = ((formData.get("price_mxn") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio." };
  const priceMxn = parseFloat(priceMxnRaw);
  if (isNaN(priceMxn) || priceMxn <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const { error } = await supabase
    .from("enrollment_types")
    .update({
      name,
      price_cents: Math.round(priceMxn * 100),
      description: description || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/inscripciones");
  return { success: "Guardado." };
}
