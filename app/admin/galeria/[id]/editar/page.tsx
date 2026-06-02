import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { AlbumForm } from "../../album-form";

export const metadata = {
  title: "Admin · Editar álbum",
  robots: { index: false },
};

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("/admin/galeria");
  const { id } = await params;
  const supabase = await createClient();

  const { data: album } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!album) notFound();

  return (
    <div className="p-10 max-w-4xl">
      <Link
        href="/admin/galeria"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-bone-mute hover:text-lumen transition-colors mb-6"
      >
        <ArrowLeft className="w-3 h-3" />
        Volver a galería
      </Link>

      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Galería
        </p>
        <h1 className="font-display text-5xl mt-2">Editar álbum</h1>
      </div>

      <AlbumForm
        albumId={album.id}
        defaults={{
          title: album.title,
          description: album.description,
          event_date: album.event_date,
          cover_url: album.cover_url,
          drive_url: album.drive_url,
          is_published: album.is_published,
          display_order: album.display_order,
        }}
      />
    </div>
  );
}
