import Link from "next/link";
import Image from "next/image";
import { Plus, ImageIcon, ExternalLink, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatCalendarDate } from "@/lib/format";
import { PublishToggle, DeleteAlbumButton } from "./album-actions";

export const metadata = {
  title: "Admin · Galería",
  robots: { index: false },
};

export default async function AdminGaleriaPage() {
  await requireAdmin("/admin/galeria");
  const supabase = await createClient();

  const { data: albums } = await supabase
    .from("gallery_albums")
    .select("*")
    .order("display_order", { ascending: true })
    .order("event_date", { ascending: false });

  const list = albums ?? [];

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
            Memoria visual
          </p>
          <h1 className="font-display text-5xl mt-2">Galería</h1>
          <p className="text-sm text-bone-mute mt-3 max-w-xl">
            Álbumes de eventos, presentaciones y momentos. Cada álbum apunta a
            una carpeta de Drive. Las alumnas los ven desde su dashboard.
          </p>
        </div>
        <Link
          href="/admin/galeria/nuevo"
          className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo álbum
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ImageIcon className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute mb-6">
            Aún no hay álbumes. Crea el primero para empezar a documentar la
            historia de la academia.
          </p>
          <Link
            href="/admin/galeria/nuevo"
            className="inline-flex items-center gap-2 bg-bone text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-lumen transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primer álbum
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((a) => {
            const dateLabel = a.event_date
              ? formatCalendarDate(a.event_date, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;
            return (
              <article
                key={a.id}
                className="rounded-2xl border border-bone-border/30 bg-ink-off overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-ink-surface">
                  {a.cover_url ? (
                    <Image
                      src={a.cover_url}
                      alt={a.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-bone-mute/40" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <PublishToggle
                      albumId={a.id}
                      initialPublished={a.is_published}
                    />
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {dateLabel && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-1">
                      {dateLabel}
                    </p>
                  )}
                  <h3 className="font-display text-xl text-bone mb-2">
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className="text-sm text-bone-mute line-clamp-2 mb-4">
                      {a.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-bone-border/30">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/galeria/${a.id}/editar`}
                        className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-bone transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </Link>
                      <a
                        href={a.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-bone-mute hover:text-lumen transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Drive
                      </a>
                    </div>
                    <DeleteAlbumButton albumId={a.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
