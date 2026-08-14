import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type StyleRow = Database["public"]["Tables"]["styles"]["Row"];
type StudioRow = Database["public"]["Tables"]["studios"]["Row"];

export type ClassWithStyleAndStudio = ClassRow & {
  styles: Pick<StyleRow, "id" | "slug" | "name" | "tagline" | "cover_url">;
  studios: Pick<StudioRow, "id" | "slug" | "name">;
};

/**
 * Lista todas las clases activas con su style y studio (JOIN).
 * Útil para construir el calendario semanal en /horarios o el detalle
 * de una clase con su info completa.
 */
export async function getActiveClasses(): Promise<ClassWithStyleAndStudio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      *,
      styles:style_id ( id, slug, name, tagline, cover_url ),
      studios:studio_id!inner ( id, slug, name )
      `,
    )
    .eq("is_active", true)
    .eq("is_public", true)
    .eq("studios.is_public", true)
    .order("day_of_week", { ascending: true })
    .order("starts_at_time", { ascending: true });

  if (error) throw error;
  return (data as ClassWithStyleAndStudio[]) ?? [];
}

/**
 * Lista las clases activas asociadas a un estilo específico.
 * Usado en /clases/[slug] para mostrar los horarios de ese estilo.
 */
export async function getClassesByStyleSlug(
  styleSlug: string,
): Promise<ClassWithStyleAndStudio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(
      `
      *,
      styles:style_id!inner ( id, slug, name, tagline, cover_url ),
      studios:studio_id!inner ( id, slug, name )
      `,
    )
    .eq("is_active", true)
    .eq("is_public", true)
    .eq("styles.slug", styleSlug)
    .eq("studios.is_public", true)
    .order("day_of_week", { ascending: true })
    .order("starts_at_time", { ascending: true });

  if (error) throw error;
  return (data as ClassWithStyleAndStudio[]) ?? [];
}
