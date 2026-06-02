import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Plan = Database["public"]["Tables"]["plans"]["Row"];
// `code` ahora es text libre (slug). Antes era un enum cerrado.
export type PlanCode = string;

/**
 * Lista todos los planes activos ordenados por display_order.
 */
export async function getActivePlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene un plan por su código. Devuelve null si no existe.
 */
export async function getPlanByCode(code: PlanCode): Promise<Plan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// formatMxn vive en @/lib/format — separado para que pueda ser
// importado desde client components sin arrastrar código server-only.
export { formatMxn } from "@/lib/format";
