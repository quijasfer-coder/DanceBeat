import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AlbumForm } from "../album-form";

export const metadata = {
  title: "Admin · Nuevo álbum",
  robots: { index: false },
};

export default async function NewAlbumPage() {
  await requireAdmin("/admin/galeria/nuevo");

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
        <h1 className="font-display text-5xl mt-2">Nuevo álbum</h1>
        <p className="text-sm text-bone-mute mt-3 max-w-xl">
          Crea un álbum nuevo. Por defecto queda oculto: marca como publicado
          cuando esté listo para que las alumnas lo vean.
        </p>
      </div>

      <AlbumForm />
    </div>
  );
}
