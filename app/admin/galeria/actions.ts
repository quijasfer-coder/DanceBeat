"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type AlbumInsert = Database["public"]["Tables"]["gallery_albums"]["Insert"];
type AlbumUpdate = Database["public"]["Tables"]["gallery_albums"]["Update"];

export type AlbumFormState = { error?: string; success?: string } | null;

const URL_RE = /^https?:\/\/.+/i;

function readAlbumForm(
  formData: FormData,
):
  | { error: string }
  | { values: Omit<AlbumInsert, "id" | "created_at" | "updated_at"> } {
  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const eventDate = ((formData.get("event_date") as string) ?? "").trim();
  const coverUrl = ((formData.get("cover_url") as string) ?? "").trim();
  const driveUrl = ((formData.get("drive_url") as string) ?? "").trim();
  const isPublished = formData.get("is_published") === "on";
  const displayOrderRaw = ((formData.get("display_order") as string) ?? "")
    .trim();

  if (!title) return { error: "El título es obligatorio." };
  if (!driveUrl) return { error: "El link de Drive es obligatorio." };
  if (!URL_RE.test(driveUrl)) {
    return { error: "El link de Drive debe empezar con http:// o https://" };
  }
  if (coverUrl && !URL_RE.test(coverUrl)) {
    return {
      error: "El link de portada debe empezar con http:// o https://",
    };
  }

  let displayOrder = 0;
  if (displayOrderRaw) {
    const parsed = parseInt(displayOrderRaw, 10);
    if (isNaN(parsed) || parsed < 0) {
      return { error: "El orden debe ser un número positivo." };
    }
    displayOrder = parsed;
  }

  return {
    values: {
      title,
      description: description || null,
      event_date: eventDate || null,
      cover_url: coverUrl || null,
      drive_url: driveUrl,
      is_published: isPublished,
      display_order: displayOrder,
    },
  };
}

export async function createAlbumAction(
  _prev: AlbumFormState,
  formData: FormData,
): Promise<AlbumFormState> {
  await requireAdmin("/admin/galeria/nuevo");
  const supabase = await createClient();

  const parsed = readAlbumForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await supabase.from("gallery_albums").insert(parsed.values);
  if (error) return { error: error.message };

  revalidatePath("/admin/galeria");
  revalidatePath("/app/galeria");
  redirect("/admin/galeria?saved=1");
}

export async function updateAlbumAction(
  albumId: string,
  _prev: AlbumFormState,
  formData: FormData,
): Promise<AlbumFormState> {
  await requireAdmin(`/admin/galeria/${albumId}/editar`);
  const supabase = await createClient();

  const parsed = readAlbumForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const patch: AlbumUpdate = parsed.values;
  const { error } = await supabase
    .from("gallery_albums")
    .update(patch)
    .eq("id", albumId);

  if (error) return { error: error.message };

  revalidatePath("/admin/galeria");
  revalidatePath("/app/galeria");
  redirect("/admin/galeria?saved=1");
}

export async function toggleAlbumPublishedAction(
  albumId: string,
  newValue: boolean,
): Promise<{ error?: string }> {
  await requireAdmin("/admin/galeria");
  const supabase = await createClient();

  const { error } = await supabase
    .from("gallery_albums")
    .update({ is_published: newValue })
    .eq("id", albumId);

  if (error) return { error: error.message };

  revalidatePath("/admin/galeria");
  revalidatePath("/app/galeria");
  return {};
}

export async function deleteAlbumAction(albumId: string): Promise<void> {
  await requireAdmin("/admin/galeria");
  const supabase = await createClient();
  await supabase.from("gallery_albums").delete().eq("id", albumId);
  revalidatePath("/admin/galeria");
  revalidatePath("/app/galeria");
}
