import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Studio = Database["public"]["Tables"]["studios"]["Row"];

/**
 * Lista las sucursales públicas (visibles para clientes externos).
 * RLS adicional filtra: anon y authenticated solo ven is_public = true,
 * staff ve todas. Aquí filtramos explícitamente igual por defensa en
 * profundidad.
 */
export async function getPublicStudios(): Promise<Studio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studios")
    .select("*")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
