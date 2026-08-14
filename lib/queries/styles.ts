import { createPublicClient } from "@/lib/supabase/server";
import { getActiveClasses } from "@/lib/queries/schedule";
import type { Database } from "@/lib/database.types";

export type Style = Database["public"]["Tables"]["styles"]["Row"];

/**
 * Lista todos los estilos activos ordenados por display_order.
 * Lectura pública (RLS permite anon). Usa el cliente público para que
 * funcione también desde `generateStaticParams` / `generateMetadata`.
 */
export async function getActiveStyles(): Promise<Style[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("styles")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Estilos activos que además tienen al menos una clase pública (activa,
 * is_public=true, en una sucursal pública). Es lo que debe verse en
 * cualquier listado/grid del sitio público — un estilo sin ninguna
 * clase visible no debe ofrecerse como algo explorable/reservable,
 * aunque `styles.is_active` siga en true.
 */
export async function getStylesWithPublicSchedule(): Promise<Style[]> {
  const [styles, classes] = await Promise.all([
    getActiveStyles(),
    getActiveClasses(),
  ]);
  const styleIdsWithClasses = new Set(classes.map((c) => c.style_id));
  return styles.filter((s) => styleIdsWithClasses.has(s.id));
}

/**
 * Obtiene un estilo por slug. Devuelve null si no existe o está inactivo.
 */
export async function getStyleBySlug(slug: string): Promise<Style | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("styles")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}
