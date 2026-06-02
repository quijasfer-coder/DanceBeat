import Image from "next/image";
import { ImageIcon, ExternalLink, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedAccount } from "@/lib/auth";

export const metadata = {
  title: "Galería",
  robots: { index: false },
};

export default async function AlumnaGaleriaPage() {
  await requireApprovedAccount("/app/galeria");
  const supabase = await createClient();

  const { data: albums } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("event_date", { ascending: false });

  const list = albums ?? [];

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bone-mute">
          Memoria de la academia
        </p>
        <h1 className="font-display text-5xl mt-2">Galería</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Revive lo que hemos construido juntas. Cada álbum abre en Google Drive
          en una pestaña nueva.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ImageIcon className="w-8 h-8 text-bone-mute mx-auto mb-4" />
          <p className="text-bone-mute">
            Aún no hay álbumes publicados. Pronto subiremos los primeros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((a) => {
            const dateLabel = a.event_date
              ? new Date(a.event_date).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null;
            return (
              <a
                key={a.id}
                href={a.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-bone-border/30 bg-ink-off overflow-hidden flex flex-col hover:border-lumen/40 transition-colors"
              >
                <div className="relative aspect-[4/3] bg-ink-surface overflow-hidden">
                  {a.cover_url ? (
                    <Image
                      src={a.cover_url}
                      alt={a.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-bone-mute/40" />
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {dateLabel && (
                    <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-mute mb-2">
                      <Calendar className="w-3 h-3" />
                      {dateLabel}
                    </p>
                  )}
                  <h3 className="font-display text-xl text-bone mb-2">
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className="text-sm text-bone-mute leading-relaxed mb-4 line-clamp-3">
                      {a.description}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-lumen group-hover:text-bone transition-colors">
                    Ir al álbum
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
